const { query } = require("../connection");

async function insertDocument(payload) {
  const result = await query(
    `
    INSERT INTO documents (
      application_id,
      document_type,
      original_name,
      stored_name,
      file_path,
      mime_type,
      file_size,
      metadata_status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      payload.applicationId,
      payload.documentType,
      payload.originalName,
      payload.storedName,
      payload.filePath,
      payload.mimeType,
      payload.fileSize,
      payload.metadataStatus || "NOT_CHECKED"
    ]
  );

  return result.rows[0];
}

async function updateDocumentOcr(documentId, payload) {
  const result = await query(
    `
    UPDATE documents
    SET
      ocr_text = $2,
      ocr_data = $3::jsonb
    WHERE id = $1
    RETURNING *
    `,
    [
      documentId,
      payload.ocrText || "",
      JSON.stringify(payload.ocrData || {})
    ]
  );

  return result.rows[0];
}

async function updateDocumentTampering(documentId, payload) {
  const result = await query(
    `
    UPDATE documents
    SET
      metadata_status = $2,
      tampering_score = $3,
      tampering_reasons = $4::jsonb
    WHERE id = $1
    RETURNING *
    `,
    [
      documentId,
      payload.metadataStatus || "NOT_CHECKED",
      payload.tamperingScore || 0,
      JSON.stringify(payload.tamperingReasons || [])
    ]
  );

  return result.rows[0];
}

module.exports = {
  insertDocument,
  updateDocumentOcr,
  updateDocumentTampering
};