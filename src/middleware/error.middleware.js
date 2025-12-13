const { error } = require("../utils/response");

module.exports = (err, req, res, next) => {
  console.error("ERROR MIDDLEWARE:", err);

  if (err.code === "P2002") {
    return error(res, "Duplicate value entered", 409);
  }

  if (err.code === "P2025") {
    return error(res, "Record not found", 404);
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

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  return error(res, message, statusCode);
};
