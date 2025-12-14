const Joi = require("joi");

// Common validation schemas
exports.paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string(),
  order: Joi.string().valid("asc", "desc").default("asc"),
});

exports.idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

exports.searchSchema = Joi.object({
  q: Joi.string().min(1).max(100),
});

// Date range filter
exports.dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")),
});

// Status filter
exports.statusSchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "INACTIVE", "PENDING", "COMPLETED"),
});

// Combine multiple schemas
exports.combineSchemas = (...schemas) => {
  return schemas.reduce((combined, schema) => {
    return combined.concat(schema);
  }, Joi.object());
};
