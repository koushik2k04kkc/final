const crypto = require("crypto");

const BANGLA_DIGITS = {
  "?": "0",
  "?": "1",
  "?": "2",
  "?": "3",
  "?": "4",
  "?": "5",
  "?": "6",
  "?": "7",
  "?": "8",
  "?": "9"
};

const BANGLA_TO_ENGLISH_APPROX = {
  "?": "a",
  "?": "o",
  "?": "i",
  "?": "i",
  "?": "u",
  "?": "u",
  "?": "e",
  "?": "oi",
  "?": "o",
  "?": "ou",

  "?": "k",
  "?": "kh",
  "?": "g",
  "?": "gh",
  "?": "ng",
  "?": "ch",
  "?": "chh",
  "?": "j",
  "?": "jh",
  "?": "n",
  "?": "t",
  "?": "th",
  "?": "d",
  "?": "dh",
  "?": "n",
  "?": "t",
  "?": "th",
  "?": "d",
  "?": "dh",
  "?": "n",
  "?": "p",
  "?": "f",
  "?": "b",
  "?": "v",
  "?": "m",
  "?": "j",
  "?": "r",
  "?": "l",
  "?": "sh",
  "?": "sh",
  "?": "s",
  "?": "h",
  "?": "r",
  "?": "rh",
  "?": "y",

  "?": "a",
  "?": "i",
  "?": "i",
  "?": "u",
  "?": "u",
  "?": "e",
  "?": "oi",
  "?": "o",
  "?": "ou",
  "?": "",
  "?": "ng",
  "?": "",
  "?": ""
};

function normalizeDigits(value = "") {
  return String(value).replace(/[?-?]/g, (digit) => {
    return BANGLA_DIGITS[digit] || digit;
  });
}

function normalizePhone(phone = "") {
  let cleaned = normalizeDigits(phone).replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+880")) {
    cleaned = "0" + cleaned.slice(4);
  }

  if (cleaned.startsWith("880")) {
    cleaned = "0" + cleaned.slice(3);
  }

  return cleaned;
}

function normalizeNid(nid = "") {
  return normalizeDigits(nid).replace(/\D/g, "");
}

function transliterateBangla(value = "") {
  return String(value)
    .split("")
    .map((ch) => BANGLA_TO_ENGLISH_APPROX[ch] ?? ch)
    .join("");
}

function normalizeName(name = "") {
  const transliterated = transliterateBangla(name);

  return transliterated
    .toLowerCase()
    .replace(/md\.?/g, "mohammad")
    .replace(/mohd\.?/g, "mohammad")
    .replace(/mohammed/g, "mohammad")
    .replace(/muhammad/g, "mohammad")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phoneticNameKey(name = "") {
  const normalized = normalizeName(name);

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      return part
        .replace(/[aeiou]/g, "")
        .replace(/(.)\1+/g, "$1")
        .slice(0, 6);
    })
    .join("-");
}

function hashDeviceFingerprint(deviceFingerprint = "") {
  if (!deviceFingerprint) return null;

  return crypto
    .createHash("sha256")
    .update(String(deviceFingerprint))
    .digest("hex");
}

function levenshteinDistance(a = "", b = "") {
  const s = normalizeName(a);
  const t = normalizeName(b);

  const dp = Array.from({ length: s.length + 1 }, () => {
    return Array(t.length + 1).fill(0);
  });

  for (let i = 0; i <= s.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= t.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[s.length][t.length];
}

function nameSimilarity(a = "", b = "") {
  const s = normalizeName(a);
  const t = normalizeName(b);

  if (!s || !t) return 0;
  if (s === t) return 1;

  const maxLen = Math.max(s.length, t.length);
  const distance = levenshteinDistance(s, t);

  return Number(((maxLen - distance) / maxLen).toFixed(3));
}

function isLikelySameHousehold(applicant, candidate) {
  if (!applicant || !candidate) return false;

  const sameAddress =
    applicant.address_text &&
    candidate.address_text &&
    normalizeName(applicant.address_text) === normalizeName(candidate.address_text);

  const sameFather =
    applicant.father_name &&
    candidate.father_name &&
    nameSimilarity(applicant.father_name, candidate.father_name) >= 0.88;

  const sameMother =
    applicant.mother_name &&
    candidate.mother_name &&
    nameSimilarity(applicant.mother_name, candidate.mother_name) >= 0.88;

  return Boolean(sameAddress || sameFather || sameMother);
}

function levelFromScore(score) {
  if (score >= 70) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

function actionFromLevel(level) {
  if (level === "HIGH") return "ENHANCED_VERIFICATION";
  if (level === "MEDIUM") return "MANUAL_REVIEW";
  return "AUTO_PASSED";
}

function calculateFraudScore(input) {
  const reasons = [];
  const signals = {};

  let score = 0;

  const {
    duplicateStats = {},
    deviceStats = {},
    ipStats = {},
    faceMatch = {},
    documentSignals = {},
    ocrSignals = {},
    concurrentStats = {}
  } = input || {};

  signals.identity = duplicateStats;
  signals.device = deviceStats;
  signals.ip = ipStats;
  signals.faceMatch = faceMatch;
  signals.document = documentSignals;
  signals.ocr = ocrSignals;
  signals.concurrent = concurrentStats;

  if (duplicateStats.sameNidCount > 0) {
    score += 45;
    reasons.push("Same NID was found in previous applications");
  }

  if (duplicateStats.samePhoneCount > 0) {
    score += 25;
    reasons.push("Same phone number was used before");
  }

  if (
    duplicateStats.fuzzyIdentityMatches &&
    duplicateStats.fuzzyIdentityMatches.length > 0
  ) {
    const strongest = duplicateStats.fuzzyIdentityMatches[0];

    if (strongest.sameHousehold) {
      score += 8;
      reasons.push("Similar identity found, but household relation is possible");
    } else if (strongest.nameSimilarity >= 0.9 && strongest.dobMatched) {
      score += 30;
      reasons.push("Possible same person with different name spelling or transliteration");
    } else if (strongest.nameSimilarity >= 0.82) {
      score += 16;
      reasons.push("Similar name pattern found across previous applications");
    }
  }

  if (deviceStats.sameDeviceApplicationCount >= 4) {
    if (deviceStats.sameHouseholdLikely) {
      score += 8;
      reasons.push("Same device is used often, but family sharing is possible");
    } else {
      score += 22;
      reasons.push("Same device was used for many applications");
    }
  } else if (deviceStats.sameDeviceApplicationCount >= 2) {
    score += 8;
    reasons.push("Same device was used for multiple applications");
  }

  if (ipStats.sameIpApplicationCount >= 6) {
    if (ipStats.sameHouseholdLikely) {
      score += 5;
      reasons.push("Same IP found, but household sharing is possible");
    } else {
      score += 15;
      reasons.push("Same IP address was used for many applications");
    }
  } else if (ipStats.sameIpApplicationCount >= 3) {
    score += 5;
    reasons.push("Same IP address was used more than once");
  }

  if (concurrentStats.sameDeviceRecentPendingCount >= 2) {
    score += 18;
    reasons.push("Multiple applications were submitted from the same device in a short time");
  }

  if (faceMatch.available === true) {
    const confidence = Number(faceMatch.confidence || 0);

    if (confidence < 0.45) {
      score += 30;
      reasons.push("Selfie and NID photo match confidence is very low");
    } else if (confidence < 0.65) {
      score += 14;
      reasons.push("Selfie and NID photo match confidence is medium");
    }
  } else {
    score += 5;
    reasons.push("Face match result is unavailable");
  }

  if (documentSignals.tamperingScore >= 80) {
    score += 25;
    reasons.push("Uploaded document has strong tampering signals");
  } else if (documentSignals.tamperingScore >= 50) {
    score += 12;
    reasons.push("Uploaded document has medium tampering signals");
  }

  if (documentSignals.metadataMissing === true) {
    signals.document.metadataPolicy =
      "Missing EXIF is not automatic fraud because WhatsApp or compression can remove metadata.";
  }

  if (ocrSignals.criticalMismatch === true) {
    score += 22;
    reasons.push("OCR data does not match applicant-provided identity data");
  } else if (ocrSignals.minorMismatch === true) {
    score += 8;
    reasons.push("Minor OCR mismatch found");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const fraudLevel = levelFromScore(score);
  const recommendedAction = actionFromLevel(fraudLevel);

  if (fraudLevel === "MEDIUM") {
    reasons.push("Medium fraud score requires manual review");
  }

  return {
    fraudScore: score,
    fraudLevel,
    recommendedAction,
    reviewStatus: recommendedAction,
    reasons,
    signals
  };
}

module.exports = {
  normalizeDigits,
  normalizePhone,
  normalizeNid,
  normalizeName,
  phoneticNameKey,
  hashDeviceFingerprint,
  nameSimilarity,
  isLikelySameHousehold,
  calculateFraudScore,
  levelFromScore,
  actionFromLevel
};
