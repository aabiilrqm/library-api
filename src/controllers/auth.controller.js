// src/controllers/auth.controller.js
const bcrypt = require("bcrypt");
const { success, error } = require("../utils/response");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const prisma = require("../config/database");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return error(res, "Email already registered", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER", // default role
      },
    });

    // Generate tokens (tanpa password di payload)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return response tanpa password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return success(
      res,
      "Registration successful",
      {
        user: userResponse,
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return error(res, "Invalid email or password", 401);
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return error(res, "Invalid email or password", 401);
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return response tanpa password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return success(res, "Login successful", {
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};

exports.refresh = async (req, res) => {
  // Implementasi refresh token
  return error(res, "Not implemented yet", 501);
};

exports.me = async (req, res) => {
  try {
    // req.user sudah diisi oleh auth middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return error(res, "User not found", 404);
    }

    return success(res, "User profile retrieved", { user });
  } catch (err) {
    console.error("ME ERROR:", err);
    return error(res, "Internal server error", 500);
  }
};
