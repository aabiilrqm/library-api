const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return error(res, "Unauthorized", 401);

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return error(res, "Invalid or expired token", 401);

    req.user = decoded;
    next();
  });
};
