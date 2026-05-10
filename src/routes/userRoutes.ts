import { Router } from "express";
import userController from "../controllers/userController.js";

const router = Router();

// Note: All routes here are already protected by authenticateToken in routes/index.ts

// Get client profile
router.get("/client", userController.getClientProfile);

// Update client profile
router.put("/client", userController.updateClient);

// Soft delete client profile
router.delete("/client", userController.softDeleteAccount); 

// Create a new client
router.post("/client", userController.createClient);

export default router;