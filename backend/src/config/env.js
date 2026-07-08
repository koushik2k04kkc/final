require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),

  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/mfi360",

  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8000",

  UPLOAD_DIR: process.env.UPLOAD_DIR || "src/uploads",

  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB || 5)
};

module.exports = env;