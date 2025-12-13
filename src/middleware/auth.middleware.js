// src/middleware/auth.middleware.js
const { error } = require("../utils/response");
const { verifyAccessToken } = require("../utils/jwt");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, "Access token required. Format: Bearer <token>", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;

    next();
  } catch (err) {
    if (err.message.includes("expired")) {
      return error(res, "Access token expired", 401);
    }
    if (err.message.includes("invalid")) {
      return error(res, "Invalid access token", 401);
    }

    return error(res, "Authentication failed", 401);
  }
};
