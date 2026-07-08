const { getClient, query } = require("../connection");

async function getApplicationFraudContext(applicationId) {
  const result = await query(
    `
    SELECT
      a.id AS application_id,
      a.device_fingerprint,
      a.device_hash,
      a.ip_address,
      a.latitude,
      a.longitude,
      a.branch_id,
      a.status,
      a.submitted_at,

      b.id AS borrower_id,
      b.full_name,
      b.normalized_name,
      b.name_phonetic_key,
      b.nid_number,
      b.phone,
      b.dob,
      b.father_name,
      b.mother_name,
      b.address_text
    FROM loan_applications a
    JOIN borrowers b ON b.id = a.borrower_id
    WHERE a.id = $1
    `,
    [applicationId]
  );

  return result.rows[0] || null;
}

async function getDocumentsByApplication(applicationId) {
  const result = await query(
    `
    SELECT *
    FROM documents
    WHERE application_id = $1
    ORDER BY uploaded_at ASC
    `,
    [applicationId]
  );

  return result.rows;
}

async function getIdentityDuplicateStats(applicationId, borrower) {
  const result = await query(
    `
    SELECT
      b.*,
      a.id AS application_id,
      a.device_hash,
      a.ip_address,
      a.branch_id,
      a.submitted_at
    FROM borrowers b
    JOIN loan_applications a ON a.borrower_id = b.id
    WHERE a.id <> $1
      AND (
        ($2::TEXT IS NOT NULL AND b.nid_number = $2)
        OR ($3::TEXT IS NOT NULL AND b.phone = $3)
        OR ($4::TEXT IS NOT NULL AND b.name_phonetic_key = $4)
      )
    ORDER BY a.submitted_at DESC
    LIMIT 30
    `,
    [
      applicationId,
      borrower.nid_number || null,
      borrower.phone || null,
      borrower.name_phonetic_key || null
    ]
  );

  return result.rows;
}

async function getSameDeviceStats(applicationId, deviceHash) {
  if (!deviceHash) {
    return {
      sameDeviceApplicationCount: 0,
      borrowers: []
    };
  }

  const result = await query(
    `
    SELECT
      a.id AS application_id,
      a.status,
      a.submitted_at,
      b.id AS borrower_id,
      b.full_name,
      b.nid_number,
      b.phone,
      b.dob,
      b.father_name,
      b.mother_name,
      b.address_text
    FROM loan_applications a
    JOIN borrowers b ON b.id = a.borrower_id
    WHERE a.device_hash = $1
      AND a.id <> $2
      AND a.submitted_at >= NOW() - INTERVAL '30 days'
    ORDER BY a.submitted_at DESC
    `,
    [deviceHash, applicationId]
  );

  return {
    sameDeviceApplicationCount: result.rows.length,
    borrowers: result.rows
  };
}

async function getSameIpStats(applicationId, ipAddress) {
  if (!ipAddress) {
    return {
      sameIpApplicationCount: 0,
      borrowers: []
    };
  }

  const result = await query(
    `
    SELECT
      a.id AS application_id,
      a.status,
      a.submitted_at,
      b.id AS borrower_id,
      b.full_name,
      b.nid_number,
      b.phone,
      b.dob,
      b.father_name,
      b.mother_name,
      b.address_text
    FROM loan_applications a
    JOIN borrowers b ON b.id = a.borrower_id
    WHERE a.ip_address = $1
      AND a.id <> $2
      AND a.submitted_at >= NOW() - INTERVAL '30 days'
    ORDER BY a.submitted_at DESC
    `,
    [ipAddress, applicationId]
  );

  return {
    sameIpApplicationCount: result.rows.length,
    borrowers: result.rows
  };
}

async function getRecentPendingSameDevice(applicationId, deviceHash) {
  if (!deviceHash) {
    return {
      sameDeviceRecentPendingCount: 0,
      applications: []
    };
  }

  const result = await query(
    `
    SELECT
      a.id AS application_id,
      a.status,
      a.submitted_at,
      b.full_name,
      b.nid_number,
      b.phone
    FROM loan_applications a
    JOIN borrowers b ON b.id = a.borrower_id
    WHERE a.device_hash = $1
      AND a.id <> $2
      AND a.submitted_at >= NOW() - INTERVAL '10 minutes'
      AND a.status IN ('SUBMITTED', 'OCR_PENDING', 'FRAUD_CHECK_PENDING', 'MANUAL_REVIEW')
    ORDER BY a.submitted_at DESC
    `,
    [deviceHash, applicationId]
  );

  return {
    sameDeviceRecentPendingCount: result.rows.length,
    applications: result.rows
  };
}

async function upsertFraudCheck(applicationId, payload, actorId = null) {
  const result = await query(
    `
    INSERT INTO fraud_checks (
      application_id,
      fraud_score,
      fraud_level,
      review_status,
      recommended_action,
      reasons,
      signals,
      checked_by,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (application_id)
    DO UPDATE SET
      fraud_score = EXCLUDED.fraud_score,
      fraud_level = EXCLUDED.fraud_level,
      review_status = EXCLUDED.review_status,
      recommended_action = EXCLUDED.recommended_action,
      reasons = EXCLUDED.reasons,
      signals = EXCLUDED.signals,
      checked_by = EXCLUDED.checked_by,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
    `,
    [
      applicationId,
      payload.fraudScore,
      payload.fraudLevel,
      payload.reviewStatus,
      payload.recommendedAction,
      JSON.stringify(payload.reasons || []),
      JSON.stringify(payload.signals || {}),
      actorId
    ]
  );

  return result.rows[0];
}

async function updateApplicationStatus(applicationId, status) {
  const result = await query(
    `
    UPDATE loan_applications
    SET status = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
    `,
    [applicationId, status]
  );

  return result.rows[0];
}

async function getFraudCheckByApplication(applicationId) {
  const result = await query(
    `
    SELECT *
    FROM fraud_checks
    WHERE application_id = $1
    `,
    [applicationId]
  );

  return result.rows[0] || null;
}

async function getManualReviewQueue(level = "MEDIUM") {
  const result = await query(
    `
    SELECT
      fc.*,
      a.status AS application_status,
      b.full_name,
      b.phone,
      b.nid_number,
      b.address_text
    FROM fraud_checks fc
    JOIN loan_applications a ON a.id = fc.application_id
    JOIN borrowers b ON b.id = a.borrower_id
    WHERE fc.fraud_level = $1
       OR fc.review_status IN ('MANUAL_REVIEW', 'ENHANCED_VERIFICATION')
    ORDER BY fc.fraud_score DESC, fc.created_at DESC
    `,
    [level]
  );

  return result.rows;
}

async function saveManualDecision(applicationId, payload) {
  const result = await query(
    `
    UPDATE fraud_checks
    SET
      review_status = $2,
      manual_decision = $3,
      manual_note = $4,
      checked_by = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE application_id = $1
    RETURNING *
    `,
    [
      applicationId,
      payload.reviewStatus,
      payload.manualDecision,
      payload.manualNote || null,
      payload.actorId || null
    ]
  );

  return result.rows[0];
}

async function insertAuditLog(applicationId, action, details = {}, actorId = null) {
  const result = await query(
    `
    INSERT INTO fraud_audit_logs (
      application_id,
      action,
      actor_id,
      details
    )
    VALUES ($1, $2, $3, $4::jsonb)
    RETURNING *
    `,
    [applicationId, action, actorId, JSON.stringify(details)]
  );

  return result.rows[0];
}

async function runFraudCheckWithLocks(applicationId, lockKeys, callback) {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    for (const key of lockKeys.filter(Boolean)) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [key]);
    }

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getApplicationFraudContext,
  getDocumentsByApplication,
  getIdentityDuplicateStats,
  getSameDeviceStats,
  getSameIpStats,
  getRecentPendingSameDevice,
  upsertFraudCheck,
  updateApplicationStatus,
  getFraudCheckByApplication,
  getManualReviewQueue,
  saveManualDecision,
  insertAuditLog,
  runFraudCheckWithLocks
};