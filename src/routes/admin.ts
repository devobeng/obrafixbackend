import { Router } from "express";
import adminController from "../controllers/adminController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate());
router.use(requireRole("admin"));

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/stats", adminController.getUserStats);

// Account management
router.patch("/users/:id/suspend", adminController.suspendUser);
router.patch("/users/:id/block", adminController.blockUser);
router.patch("/users/:id/reactivate", adminController.reactivateUser);

// Provider verification
router.get("/verifications", adminController.getPendingVerifications);
router.patch("/verifications/:id/approve", adminController.approveVerification);
router.patch("/verifications/:id/reject", adminController.rejectVerification);

// Dashboard
router.get("/dashboard", adminController.getDashboardOverview);

export default router;
