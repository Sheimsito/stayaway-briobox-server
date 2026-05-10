import { Router } from "express";
import authController from "../controllers/authController.js";
import { rateLimiter } from "../middleware/auth.js";
import { authenticateToken } from "../middleware/auth.js";



const router = Router();


// Login a user
router.post("/login", rateLimiter, authController.login);

// Logout a user
router.post("/logout", authenticateToken, authController.logout);

// Forgot password
router.post("/forgot-password", authController.forgotPassword);

// Reset password
router.post("/reset-password", authController.resetPassword);

// Verify authentication
router.get("/verify-auth", authenticateToken, authController.verifyAuth);

export default router;