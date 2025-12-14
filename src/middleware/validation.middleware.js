// src/middleware/validation.middleware.js
const { error } = require("../utils/response");

module.exports = (schema) => {
  return (req, res, next) => {
    console.log("🔍 Validation middleware called for:", req.path); // DEBUG

    // Validate against schema (bisa single schema atau object dengan body/query/params)
    let validationResult;

    if (schema.validate) {
      // Single Joi schema (untuk backward compatibility)
      validationResult = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
    } else if (schema.body) {
      // Object dengan body/query/params schemas
      const errors = [];

      if (schema.body) {
        const { error: bodyError } = schema.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (bodyError) {
          errors.push(
            ...bodyError.details.map((detail) => ({
              field: detail.path.join("."),
              message: detail.message,
            }))
          );
        }
      }

      if (schema.query) {
        const { error: queryError } = schema.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (queryError) {
          errors.push(
            ...queryError.details.map((detail) => ({
              field: detail.path.join("."),
              message: detail.message,
            }))
          );
        }
      }

      if (schema.params) {
        const { error: paramsError } = schema.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (paramsError) {
          errors.push(
            ...paramsError.details.map((detail) => ({
              field: detail.path.join("."),
              message: detail.message,
            }))
          );
        }
      }

      if (errors.length > 0) {
        console.log("❌ Validation errors:", errors); // DEBUG
        return error(res, "Validation failed", 400, errors);
      }

      return next();
    }

    // Jika single schema
    if (validationResult && validationResult.error) {
      console.log("❌ Validation error:", validationResult.error.details); // DEBUG
      const errors = validationResult.error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      return error(res, "Validation failed", 400, errors);
    }

    console.log("✅ Validation passed"); // DEBUG
    next();
  };
};
