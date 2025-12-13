// src/middleware/role.middleware.js
const { error } = require("../utils/response");

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, "Authentication required", 401);
    }
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return error(res, "Insufficient permissions", 403);
    }
    next();
  };
};
