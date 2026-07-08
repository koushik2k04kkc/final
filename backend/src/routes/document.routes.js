const express = require("express");
const documentController = require("../controllers/document.controller");
const { uploadTask2Documents } = require("../middleware/upload.middleware");
const { validateTask2Documents } = require("../validators/document.validator");

const router = express.Router();

router.post(
  "/upload/:applicationId",
  uploadTask2Documents,
  validateTask2Documents,
  documentController.uploadDocuments
);

module.exports = router;