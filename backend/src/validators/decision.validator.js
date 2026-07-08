const { fail } = require("../utils/apiResponse");

function validateManualDecision(req, res, next) {
  const allowed = [
    "CLEARED",
    "REJECTED",
    "REQUEST_MORE_DOCUMENTS",
    "FIELD_VERIFICATION"
  ];

  const { manualDecision, manualNote } = req.body;

  if (!manualDecision || !allowed.includes(manualDecision)) {
    return fail(res, "Invalid manual decision", 400, {
      allowed
    });
  }

  if (manualNote && String(manualNote).length > 1000) {
    return fail(res, "Manual note cannot exceed 1000 characters", 400);
  }

  return next();
}

module.exports = {
  validateManualDecision
};