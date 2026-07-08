const { fail } = require("../utils/apiResponse");

function validateTask2Documents(req, res, next) {
  const files = req.files || {};

  if (!files.nidFront || files.nidFront.length === 0) {
    return fail(res, "NID front image is required", 400);
  }

  if (!files.selfie || files.selfie.length === 0) {
    return fail(res, "Selfie is required for identity verification", 400);
  }

  const totalFiles = Object.values(files).reduce((count, group) => {
    return count + group.length;
  }, 0);

  if (totalFiles > 6) {
    return fail(res, "Maximum 6 files are allowed", 400);
  }

  return next();
}

module.exports = {
  validateTask2Documents
};