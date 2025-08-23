import express from "express";
import { ProviderDashboardController } from "../controllers/ProviderDashboardController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = express.Router();
const providerDashboardController = new ProviderDashboardController();

// All routes require authentication and provider role
router.use(authenticate());
router.use(requireRole("provider"));

// Service Management Routes
router.post("/services", providerDashboardController.createService);
router.get("/services", providerDashboardController.getProviderServices);
router.put("/services/:serviceId", providerDashboardController.updateService);

// Job Requests Management Routes
router.get("/job-requests", providerDashboardController.getJobRequests);
router.post(
  "/job-requests/:requestId/accept",
  providerDashboardController.acceptJobRequest
);
router.post(
  "/job-requests/:requestId/reject",
  providerDashboardController.rejectJobRequest
);

// Real-time Job Status Updates
router.put(
  "/bookings/:bookingId/status",
  providerDashboardController.updateJobStatus
);

// Provider Dashboard Statistics
router.get("/dashboard/stats", providerDashboardController.getDashboardStats);

export default router;
