// src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middlewares global HARUS didefinisikan SEBELUM routes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Health check endpoint (wajib untuk deployment)
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "Library API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// TODO: nanti di sini kita akan daftarkan routes lain, seperti:
// app.use('/api/books', bookRoutes);
// dll.

module.exports = app;
