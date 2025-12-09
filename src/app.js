// src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Middlewares global
app.use(cors());
app.use(express.json());

// Logger HTTP sederhana (nanti bisa kita ganti dengan custom logger middleware)
app.use(morgan("dev"));

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
// app.use('/api/auth', authRoutes);
// app.use('/api/books', bookRoutes);
// dll.

module.exports = app;
