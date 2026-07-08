const express = require("express");

const documentRoutes = require("./document.routes");
const fraudRoutes = require("./fraud.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "MFI360 backend is running"
  });
});

router.use("/documents", documentRoutes);
router.use("/fraud", fraudRoutes);

module.exports = router;