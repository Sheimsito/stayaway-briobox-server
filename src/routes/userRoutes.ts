import { Router } from "express";
import userController from "../controllers/userController.js";


const router = Router();

// Note: All routes here are already protected by authenticateToken in routes/index.ts

// Get customer profile
router.get("/customer/:id", userController.getClientProfile);

// Get all customers
router.get("/customers", userController.getAllClients);

// Update customer profile
router.put("/customer/:id", userController.updateClient);

// Soft delete customer profile
router.delete("/customer/:id", userController.softDeleteAccount);

// Create a new customer
router.post("/customer", userController.createClient);

// Admin routes

// Get all employees (admin only)
router.get("/employees", userController.getAllEmployees);

// Get user info
router.get("/user", userController.getUserProfile);

// Update user info
router.put("/user", userController.updateUserProfile);

// Delete user
router.delete("/user", userController.softDeleteUserProfile);




// Admin routes

// Create user
router.post("/user", userController.createUser);

export default router;