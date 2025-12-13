const { error } = require("../utils/response");
const validate = require("./validate.middleware");

module.exports = (schema) => {
  return (req, res, next) => {
    const { error: validationError } = schema.validate(req.body);

    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    next();
  };
};

module.exports = validate;  