const path = require("path");
const documentQueries = require("../database/queries/document.queries");
const aiService = require("./ai.service");

function mapFieldToDocumentType(fieldName) {
  const map = {
    nidFront: "NID_FRONT",
    nidBack: "NID_BACK",
    selfie: "SELFIE",
    businessDoc: "BUSINESS_DOC",
    bankStatement: "BANK_STATEMENT"
  };

  return map[fieldName] || "BUSINESS_DOC";
}

function detectMetadataStatus(file) {
  if (!file) return "NOT_CHECKED";

  const imageTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!imageTypes.includes(file.mimetype)) {
    return "NOT_CHECKED";
  }

  /*
    Important edge case:
    Missing metadata is common when an image is compressed or forwarded through WhatsApp.
    So we do not mark it suspicious here.
  */
  return "MISSING";
}

async function saveUploadedDocuments(applicationId, files) {
  const savedDocuments = [];

  for (const [fieldName, fileList] of Object.entries(files || {})) {
    for (const file of fileList) {
      const documentType = mapFieldToDocumentType(fieldName);

      const saved = await documentQueries.insertDocument({
        applicationId,
        documentType,
        originalName: file.originalname,
        storedName: file.filename,
        filePath: path.normalize(file.path),
        mimeType: file.mimetype,
        fileSize: file.size,
        metadataStatus: detectMetadataStatus(file)
      });

      savedDocuments.push(saved);
    }
  }

  return savedDocuments;
}

async function runOcrForNidDocuments(documents) {
  const updated = [];

  for (const document of documents) {
    if (!["NID_FRONT", "NID_BACK"].includes(document.document_type)) {
      continue;
    }

    const ocr = await aiService.extractOcrData(document.file_path);

    const saved = await documentQueries.updateDocumentOcr(document.id, {
      ocrText: ocr.text,
      ocrData: ocr.data
    });

    updated.push(saved);
  }

  return updated;
}

module.exports = {
  saveUploadedDocuments,
  runOcrForNidDocuments
};