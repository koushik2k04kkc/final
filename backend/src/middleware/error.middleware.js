const { fail } = require("../utils/apiResponse");

function errorMiddleware(err, req, res, next) {
  console.error(err);

  if (err.message && err.message.includes("File too large")) {
    return fail(res, "Uploaded file is too large", 413);
  }

  if (err.message && err.message.includes("Only JPG")) {
    return fail(res, err.message, 400);
  }

  const statusCode = err.statusCode || 500;

  return fail(
    res,
    err.message || "Internal server error",
    statusCode,
    process.env.NODE_ENV === "development" ? err.stack : null
  );
}

module.exports = errorMiddleware;