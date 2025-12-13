// src/middleware/logger.middleware.js
const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  const masked = { ...obj };
  const sensitiveFields = [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
    "secret",
  ];

  sensitiveFields.forEach((field) => {
    if (masked[field]) {
      masked[field] = "***MASKED***";
    }
  });

  return masked;
};

const formatLogMessage = (req, res, responseTime) => {
  const timestamp = getTimestamp();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const status = res.statusCode;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("user-agent") || "Unknown";
  const userId = req.user ? req.user.id : "Anonymous";

  let message = `[${timestamp}] ${method} ${url} ${status} ${responseTime}ms - IP: ${ip}, UserID: ${userId}, Agent: ${userAgent}`;

  if (
    process.env.NODE_ENV !== "production" &&
    req.body &&
    Object.keys(req.body).length > 0
  ) {
    const maskedBody = maskSensitiveData(req.body);
    message += `\n  Body: ${JSON.stringify(maskedBody)}`;
  }

  if (req.query && Object.keys(req.query).length > 0) {
    const maskedQuery = maskSensitiveData(req.query);
    message += `\n  Query: ${JSON.stringify(maskedQuery)}`;
  }

  return message;
};

const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (body) {
    const responseTime = Date.now() - startTime;

    const logMessage = formatLogMessage(req, res, responseTime);

    if (res.statusCode >= 400) {
      console.error(logMessage);

      if (process.env.NODE_ENV === "production") {
        fs.appendFileSync(
          path.join(logDir, "error.log"),
          logMessage + "\n",
          "utf8"
        );
      }
    } else {
      console.log(logMessage);

      // Log ke file untuk production
      if (process.env.NODE_ENV === "production") {
        fs.appendFileSync(
          path.join(logDir, "access.log"),
          logMessage + "\n",
          "utf8"
        );
      }
    }

    return originalSend.call(this, body);
  };

  next();
};

const requestLogger = (req, res, next) => {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

  if (
    process.env.NODE_ENV !== "production" &&
    req.body &&
    Object.keys(req.body).length > 0
  ) {
    const maskedBody = maskSensitiveData(req.body);
    console.log(`  Body:`, maskedBody);
  }

  next();
};

const errorLogger = (err, req, res, next) => {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] ERROR: ${err.message}\n  Stack: ${err.stack}\n  URL: ${req.method} ${req.originalUrl}`;

  console.error(logMessage);

  if (process.env.NODE_ENV === "production") {
    fs.appendFileSync(
      path.join(logDir, "error.log"),
      logMessage + "\n",
      "utf8"
    );
  }

  next(err);
};

module.exports = {
  loggerMiddleware,
  requestLogger,
  errorLogger,
};
