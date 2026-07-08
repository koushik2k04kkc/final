const fraudService = require("../services/fraud.service");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

const runFraudCheck = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const actorId = req.user?.id || null;

  const result = await fraudService.runFraudCheck(applicationId, actorId);

  return success(res, "Fraud check completed successfully", result);
});

const getFraudCheck = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const result = await fraudService.getFraudCheck(applicationId);

  return success(res, "Fraud check fetched successfully", result);
});

const getManualReviewQueue = asyncHandler(async (req, res) => {
  const level = req.query.level || "MEDIUM";

  const result = await fraudService.getManualReviewQueue(level);

  return success(res, "Manual review queue fetched successfully", result);
});

const saveManualDecision = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const result = await fraudService.saveManualDecision(applicationId, {
    manualDecision: req.body.manualDecision,
    manualNote: req.body.manualNote,
    actorId: req.user?.id || null
  });

  return success(res, "Manual fraud decision saved successfully", result);
});

module.exports = {
  runFraudCheck,
  getFraudCheck,
  getManualReviewQueue,
  saveManualDecision
};