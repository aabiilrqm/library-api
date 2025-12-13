const { error } = require("../utils/response");

/**
 *
 * @param {Object} schemas
 * @returns {Function}
 */
const validate = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    if (schemas.body) {
      const { error: bodyError } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (bodyError) {
        errors.push({
          source: "body",
          details: bodyError.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }
    }

    if (schemas.query) {
      const { error: queryError } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (queryError) {
        errors.push({
          source: "query",
          details: queryError.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }
    }

    if (schemas.params) {
      const { error: paramsError } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (paramsError) {
        errors.push({
          source: "params",
          details: paramsError.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }
    }

    if (errors.length > 0) {
      return error(res, "Validation failed", 400, errors);
    }

    next();
  };
};

module.exports = validate;
