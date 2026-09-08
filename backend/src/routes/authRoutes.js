const express = require("express");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const { loginLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/login", loginLimiter, authController.login);
router.get("/me", authenticate, authController.getMe);

module.exports = { authRoutes: router };
