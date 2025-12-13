const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const {
  loggerMiddleware,
  requestLogger,
} = require("./middleware/logger.middleware");
const {
  corsOptions,
  apiLimiter,
  securityHeaders,
  sanitizeInput,
} = require("./middleware/security.middleware");

const app = express();

app.use(securityHeaders);
app.use(sanitizeInput);

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "production") {
  app.use(loggerMiddleware);
} else {
  app.use(morgan("dev"));
  app.use(requestLogger);
}

app.use("/api/", apiLimiter);

const authRoutes = require("./routes/auth.routes");

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "Library API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

const errorMiddleware = require("./middleware/error.middleware");
const { errorLogger } = require("./middleware/logger.middleware");

app.use(errorLogger);

app.use(errorMiddleware);

module.exports = app;
