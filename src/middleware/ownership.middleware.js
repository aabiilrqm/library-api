// src/middleware/ownership.middleware.js
const { error } = require("../utils/response");
const prisma = require("../config/database");

module.exports = (modelName, idParam = "id", ownerField = "userId") => {
  return async (req, res, next) => {
    try {
      const resourceId = parseInt(req.params[idParam]);
      const userId = req.user.id;
      const userRole = req.user.role;
      if (userRole === "ADMIN") {
        return next();
      }

      const resource = await prisma[modelName].findUnique({
        where: { id: resourceId },
        select: { [ownerField]: true },
      });

      if (!resource) {
        return error(res, "Resource not found", 404);
      }

      if (resource[ownerField] !== userId) {
        return error(res, "You are not the owner of this resource", 403);
      }

      next();
    } catch (err) {
      console.error("OWNERSHIP MIDDLEWARE ERROR:", err);
      return error(res, "Internal server error", 500);
    }
  };
};
