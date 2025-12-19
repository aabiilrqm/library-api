// src/controllers/auth.controller.js
const bcrypt = require("bcrypt");
const { success, error } = require("../utils/response");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const prisma = require("../config/database");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return error(res, "Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER", 
      },
    });

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

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
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, "Refresh token required", 400);
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      return error(res, "User not found", 404);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return success(res, "Token refreshed successfully", {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    if (err.message.includes("expired") || err.message.includes("invalid")) {
      return error(res, "Invalid or expired refresh token", 401);
    }
    return error(res, "Internal server error", 500);
  }
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
