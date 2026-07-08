const express = require("express");
const fraudController = require("../controllers/fraud.controller");
const { validateManualDecision } = require("../validators/decision.validator");

const router = express.Router();

router.post("/check/:applicationId", fraudController.runFraudCheck);

router.get("/queue/manual-review", fraudController.getManualReviewQueue);

router.get("/:applicationId", fraudController.getFraudCheck);

router.patch(
  "/:applicationId/manual-decision",
  validateManualDecision,
  fraudController.saveManualDecision
);

module.exports = router;