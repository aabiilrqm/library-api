// src/routes/auth.routes.js
const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validation.middleware");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const { registerSchema, loginSchema } = require("../validators/auth.validator");

// Public routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);

router.get("/me", authMiddleware, authController.me);

router.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Welcome admin!",
      user: req.user,
    });
  }
);

router.get(
  "/user-only",
  authMiddleware,
  roleMiddleware("USER", "ADMIN"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Welcome user!",
      user: req.user,
    });
  }
);

module.exports = router;
