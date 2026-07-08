const fraudQueries = require("../database/queries/fraud.queries");
const aiService = require("./ai.service");

const {
  normalizeName,
  normalizeNid,
  normalizePhone,
  phoneticNameKey,
  hashDeviceFingerprint,
  nameSimilarity,
  isLikelySameHousehold,
  calculateFraudScore
} = require("../utils/fraudRules");

function prepareBorrowerForMatching(application) {
  return {
    id: application.borrower_id,
    full_name: application.full_name,
    normalized_name: normalizeName(application.full_name),
    name_phonetic_key: phoneticNameKey(application.full_name),
    nid_number: normalizeNid(application.nid_number),
    phone: normalizePhone(application.phone),
    dob: application.dob,
    father_name: application.father_name,
    mother_name: application.mother_name,
    address_text: application.address_text
  };
}

function buildFuzzyIdentityMatches(applicant, candidates) {
  return candidates
    .map((candidate) => {
      const similarity = nameSimilarity(applicant.full_name, candidate.full_name);
      const dobMatched =
        applicant.dob &&
        candidate.dob &&
        String(applicant.dob).slice(0, 10) === String(candidate.dob).slice(0, 10);

      const sameHousehold = isLikelySameHousehold(applicant, candidate);

      return {
        borrowerId: candidate.id,
        applicationId: candidate.application_id,
        candidateName: candidate.full_name,
        nameSimilarity: similarity,
        dobMatched,
        sameHousehold,
        reason:
          similarity >= 0.9
            ? "Strong name similarity"
            : similarity >= 0.82
              ? "Medium name similarity"
              : "Weak name similarity"
      };
    })
    .filter((item) => item.nameSimilarity >= 0.82)
    .sort((a, b) => b.nameSimilarity - a.nameSimilarity);
}

function buildDuplicateStats(applicant, candidates) {
  const sameNidCount = candidates.filter((item) => {
    return applicant.nid_number && item.nid_number === applicant.nid_number;
  }).length;

  const samePhoneCount = candidates.filter((item) => {
    return applicant.phone && normalizePhone(item.phone) === applicant.phone;
  }).length;

  const fuzzyIdentityMatches = buildFuzzyIdentityMatches(applicant, candidates);

  return {
    sameNidCount,
    samePhoneCount,
    fuzzyIdentityMatches
  };
}

function enrichDeviceStats(applicant, stats) {
  const sameHouseholdMatches = stats.borrowers.filter((borrower) => {
    return isLikelySameHousehold(applicant, borrower);
  });

  return {
    sameDeviceApplicationCount: stats.sameDeviceApplicationCount,
    sameHouseholdLikely:
      stats.sameDeviceApplicationCount > 0 &&
      sameHouseholdMatches.length >= Math.ceil(stats.sameDeviceApplicationCount / 2),
    borrowers: stats.borrowers.map((item) => ({
      applicationId: item.application_id,
      fullName: item.full_name,
      sameHousehold: isLikelySameHousehold(applicant, item)
    }))
  };
}

function enrichIpStats(applicant, stats) {
  const sameHouseholdMatches = stats.borrowers.filter((borrower) => {
    return isLikelySameHousehold(applicant, borrower);
  });

  return {
    sameIpApplicationCount: stats.sameIpApplicationCount,
    sameHouseholdLikely:
      stats.sameIpApplicationCount > 0 &&
      sameHouseholdMatches.length >= Math.ceil(stats.sameIpApplicationCount / 2),
    borrowers: stats.borrowers.map((item) => ({
      applicationId: item.application_id,
      fullName: item.full_name,
      sameHousehold: isLikelySameHousehold(applicant, item)
    }))
  };
}

function findDocumentByType(documents, type) {
  return documents.find((doc) => doc.document_type === type) || null;
}

function buildOcrSignals(applicant, documents) {
  const nidDoc =
    findDocumentByType(documents, "NID_FRONT") ||
    findDocumentByType(documents, "NID_BACK");

  if (!nidDoc || !nidDoc.ocr_data) {
    return {
      available: false,
      criticalMismatch: false,
      minorMismatch: false,
      reason: "OCR data unavailable"
    };
  }

  const ocrData =
    typeof nidDoc.ocr_data === "string"
      ? JSON.parse(nidDoc.ocr_data || "{}")
      : nidDoc.ocr_data;

  const ocrName = ocrData.name || ocrData.fullName || "";
  const ocrNid = normalizeNid(ocrData.nidNumber || ocrData.nid || "");
  const ocrDob = ocrData.dob || null;

  const nameScore = ocrName ? nameSimilarity(applicant.full_name, ocrName) : null;
  const nidMatched = ocrNid ? ocrNid === applicant.nid_number : null;
  const dobMatched =
    ocrDob && applicant.dob
      ? String(ocrDob).slice(0, 10) === String(applicant.dob).slice(0, 10)
      : null;

  const criticalMismatch = nidMatched === false;
  const minorMismatch =
    !criticalMismatch &&
    ((nameScore !== null && nameScore < 0.8) || dobMatched === false);

  return {
    available: true,
    ocrName,
    ocrNid,
    nameScore,
    nidMatched,
    dobMatched,
    criticalMismatch,
    minorMismatch
  };
}

async function runFraudCheck(applicationId, actorId = null) {
  const context = await fraudQueries.getApplicationFraudContext(applicationId);

  if (!context) {
    const error = new Error("Loan application not found");
    error.statusCode = 404;
    throw error;
  }

  const deviceHash =
    context.device_hash || hashDeviceFingerprint(context.device_fingerprint || "");

  const lockKeys = [
    `fraud:application:${applicationId}`,
    deviceHash ? `fraud:device:${deviceHash}` : null,
    context.nid_number ? `fraud:nid:${normalizeNid(context.nid_number)}` : null,
    context.phone ? `fraud:phone:${normalizePhone(context.phone)}` : null
  ];

  return fraudQueries.runFraudCheckWithLocks(applicationId, lockKeys, async () => {
    await fraudQueries.updateApplicationStatus(applicationId, "FRAUD_CHECK_PENDING");

    const freshContext = await fraudQueries.getApplicationFraudContext(applicationId);

    const applicant = prepareBorrowerForMatching({
      ...freshContext,
      device_hash: deviceHash
    });

    const documents = await fraudQueries.getDocumentsByApplication(applicationId);

    const identityCandidates = await fraudQueries.getIdentityDuplicateStats(
      applicationId,
      applicant
    );

    const duplicateStats = buildDuplicateStats(applicant, identityCandidates);

    const rawDeviceStats = await fraudQueries.getSameDeviceStats(
      applicationId,
      deviceHash
    );

    const rawIpStats = await fraudQueries.getSameIpStats(
      applicationId,
      freshContext.ip_address
    );

    const recentPendingStats = await fraudQueries.getRecentPendingSameDevice(
      applicationId,
      deviceHash
    );

    const deviceStats = enrichDeviceStats(applicant, rawDeviceStats);
    const ipStats = enrichIpStats(applicant, rawIpStats);

    const selfie = findDocumentByType(documents, "SELFIE");
    const nidFront =
      findDocumentByType(documents, "NID_FRONT") ||
      findDocumentByType(documents, "NID_BACK");

    const faceMatch = await aiService.analyzeFaceMatch({
      selfiePath: selfie?.file_path,
      nidImagePath: nidFront?.file_path
    });

    const documentSignals = await aiService.analyzeDocumentForgery(
      documents.map((doc) => ({
        id: doc.id,
        documentType: doc.document_type,
        filePath: doc.file_path,
        mimeType: doc.mime_type,
        metadataStatus: doc.metadata_status
      }))
    );

    const ocrSignals = buildOcrSignals(applicant, documents);

    const fraudResult = calculateFraudScore({
      applicant,
      duplicateStats,
      deviceStats,
      ipStats,
      faceMatch,
      documentSignals,
      ocrSignals,
      concurrentStats: recentPendingStats
    });

    const savedFraudCheck = await fraudQueries.upsertFraudCheck(
      applicationId,
      fraudResult,
      actorId
    );

    let applicationStatus = "FRAUD_LOW";

    if (fraudResult.fraudLevel === "MEDIUM") {
      applicationStatus = "MANUAL_REVIEW";
    }

    if (fraudResult.fraudLevel === "HIGH") {
      applicationStatus = "ENHANCED_VERIFICATION";
    }

    await fraudQueries.updateApplicationStatus(applicationId, applicationStatus);

    await fraudQueries.insertAuditLog(
      applicationId,
      "FRAUD_CHECK_COMPLETED",
      {
        fraudScore: fraudResult.fraudScore,
        fraudLevel: fraudResult.fraudLevel,
        recommendedAction: fraudResult.recommendedAction,
        edgeCasePolicy: {
          nameMatching: "Fuzzy matching supports Bengali-English transliteration",
          familyDeviceSharing: "Device/IP alone does not create high fraud score",
          faceMatch: "Confidence threshold is used instead of binary match",
          metadata: "Missing EXIF is not automatic fraud",
          concurrency: "PostgreSQL advisory lock protects simultaneous same-device checks",
          mediumRisk: "Medium risk is always sent to manual review"
        }
      },
      actorId
    );

    return {
      ...savedFraudCheck,
      applicationStatus
    };
  });
}

async function getFraudCheck(applicationId) {
  const fraudCheck = await fraudQueries.getFraudCheckByApplication(applicationId);

  if (!fraudCheck) {
    const error = new Error("Fraud check not found for this application");
    error.statusCode = 404;
    throw error;
  }

  return fraudCheck;
}

async function getManualReviewQueue(level = "MEDIUM") {
  return fraudQueries.getManualReviewQueue(level);
}

async function saveManualDecision(applicationId, payload) {
  const allowed = [
    "CLEARED",
    "REJECTED",
    "REQUEST_MORE_DOCUMENTS",
    "FIELD_VERIFICATION"
  ];

  if (!allowed.includes(payload.manualDecision)) {
    const error = new Error("Invalid manual decision");
    error.statusCode = 400;
    throw error;
  }

  let reviewStatus = "MANUAL_REVIEW";
  let applicationStatus = "MANUAL_REVIEW";

  if (payload.manualDecision === "CLEARED") {
    reviewStatus = "CLEARED";
    applicationStatus = "FRAUD_LOW";
  }

  if (payload.manualDecision === "REJECTED") {
    reviewStatus = "REJECTED";
    applicationStatus = "REJECTED";
  }

  if (payload.manualDecision === "FIELD_VERIFICATION") {
    reviewStatus = "ENHANCED_VERIFICATION";
    applicationStatus = "ENHANCED_VERIFICATION";
  }

  if (payload.manualDecision === "REQUEST_MORE_DOCUMENTS") {
    reviewStatus = "MANUAL_REVIEW";
    applicationStatus = "MANUAL_REVIEW";
  }

  const saved = await fraudQueries.saveManualDecision(applicationId, {
    reviewStatus,
    manualDecision: payload.manualDecision,
    manualNote: payload.manualNote,
    actorId: payload.actorId || null
  });

  await fraudQueries.updateApplicationStatus(applicationId, applicationStatus);

  await fraudQueries.insertAuditLog(
    applicationId,
    "FRAUD_MANUAL_DECISION_SAVED",
    {
      manualDecision: payload.manualDecision,
      manualNote: payload.manualNote || null,
      applicationStatus
    },
    payload.actorId || null
  );

  return saved;
}

module.exports = {
  runFraudCheck,
  getFraudCheck,
  getManualReviewQueue,
  saveManualDecision
};