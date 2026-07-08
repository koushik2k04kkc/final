const path = require("path");
const fs = require("fs");
const multer = require("multer");
const env = require("../config/env");

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const uploadRoot = path.join(process.cwd(), env.UPLOAD_DIR);

ensureDir(uploadRoot);
ensureDir(path.join(uploadRoot, "nid"));
ensureDir(path.join(uploadRoot, "selfies"));
ensureDir(path.join(uploadRoot, "business-docs"));
ensureDir(path.join(uploadRoot, "bank-statements"));

function getFolderByField(fieldName) {
  const map = {
    nidFront: "nid",
    nidBack: "nid",
    selfie: "selfies",
    businessDoc: "business-docs",
    bankStatement: "bank-statements"
  };

  return map[fieldName] || "business-docs";
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = getFolderByField(file.fieldname);
    const destination = path.join(uploadRoot, folder);

    ensureDir(destination);

    cb(null, destination);
  },

  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeOriginalName = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, `${unique}-${safeOriginalName}`);
  }
});

function fileFilter(req, file, cb) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed"));
  }

  return cb(null, true);
}

const uploadTask2Documents = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 6
  }
}).fields([
  { name: "nidFront", maxCount: 1 },
  { name: "nidBack", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
  { name: "businessDoc", maxCount: 2 },
  { name: "bankStatement", maxCount: 1 }
]);

module.exports = {
  uploadTask2Documents
};