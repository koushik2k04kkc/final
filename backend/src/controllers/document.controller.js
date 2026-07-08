const documentService = require("../services/document.service");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

const uploadDocuments = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const savedDocuments = await documentService.saveUploadedDocuments(
    applicationId,
    req.files
  );

  const ocrDocuments = await documentService.runOcrForNidDocuments(savedDocuments);

  return success(res, "Documents uploaded successfully", {
    savedDocuments,
    ocrDocuments
  }, 201);
});

module.exports = {
  uploadDocuments
};