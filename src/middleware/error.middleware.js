// src/middleware/error.middleware.js
const { error } = require("../utils/response");

module.exports = (err, req, res, next) => {
  console.error("ERROR MIDDLEWARE:", {
    message: err.message,
    stack: err.stack,
    code: err.code,
    name: err.name,
    path: req.path,
    method: req.method,
    userId: req.user ? req.user.id : "anonymous",
  });

  if (err.code === "P2002") {
    return error(res, "Duplicate value entered", 409);
  }

  if (err.code === "P2025") {
    return error(res, "Record not found", 404);
  }

  if (err.code === "P2003") {
    return error(res, "Foreign key constraint failed", 400);
  }

  if (err.name === "JsonWebTokenError") {
    return error(res, "Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return error(res, "Token expired", 401);
  }

  if (err.name === "ValidationError") {
    return error(res, "Validation failed", 400, err.errors);
  }

  if (err.message && err.message.includes("already exists")) {
    return error(res, err.message, 409);
  }

  if (err.message && err.message.includes("not found")) {
    return error(res, err.message, 404);
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  return error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === "development" ? { stack: err.stack } : null
  );
};
