const router = require("express").Router();

const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validation.middleware");
const authMiddleware = require("../middleware/auth.middleware");

const { registerSchema, loginSchema } = require("../validators/auth.validator");

// Public routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);

// Protected route
router.get("/me", authMiddleware, authController.me);

module.exports = router;
