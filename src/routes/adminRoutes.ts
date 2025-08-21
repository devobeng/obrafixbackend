import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";
import { validateRequest } from "../middleware/validation";
import {
  updateUserStatusSchema,
  verifyProviderDocumentsSchema,
  updateServiceStatusSchema,
  createServiceCategorySchema,
  updateServiceCategorySchema,
  handleDisputeSchema,
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
  generateAnalyticsSchema,
  updateSystemSettingsSchema,
} from "../validations/adminValidation";

const router = Router();
const adminController = new AdminController();

// Apply authentication and role middleware to all admin routes
router.use(authenticateToken);
router.use(requireRole("admin"));

// User Management Routes
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.patch(
  "/users/:id/status",
  validateRequest(updateUserStatusSchema),
  adminController.updateUserStatus
);
router.patch(
  "/users/:id/verify",
  validateRequest(verifyProviderDocumentsSchema),
  adminController.verifyProviderDocuments
);

// Service Management Routes
router.get("/services", adminController.getAllServices);
router.patch(
  "/services/:id/status",
  validateRequest(updateServiceStatusSchema),
  adminController.updateServiceStatus
);

// Service Category Management Routes
router.post(
  "/categories",
  validateRequest(createServiceCategorySchema),
  adminController.createServiceCategory
);
router.put(
  "/categories/:id",
  validateRequest(updateServiceCategorySchema),
  adminController.updateServiceCategory
);
router.delete("/categories/:id", adminController.deleteServiceCategory);

// Booking Management Routes
router.get("/bookings", adminController.getAllBookings);
router.get("/bookings/:id", adminController.getBookingById);
router.patch(
  "/bookings/:id/dispute",
  validateRequest(handleDisputeSchema),
  adminController.handleBookingDispute
);

// Payment Management Routes
router.get("/withdrawals", adminController.getAllWithdrawalRequests);
router.patch(
  "/withdrawals/:id/approve",
  validateRequest(approveWithdrawalSchema),
  adminController.approveWithdrawalRequest
);
router.patch(
  "/withdrawals/:id/reject",
  validateRequest(rejectWithdrawalSchema),
  adminController.rejectWithdrawalRequest
);

// Analytics and Reports Routes
router.get("/dashboard", adminController.getDashboardOverview);
router.get("/reports/revenue", adminController.getRevenueReport);
router.get("/reports/users", adminController.getUserReport);
router.get("/reports/services", adminController.getServiceReport);
router.post(
  "/analytics/generate",
  validateRequest(generateAnalyticsSchema),
  adminController.generateAnalytics
);

// System Settings Routes
router.get("/settings", adminController.getSystemSettings);
router.put(
  "/settings",
  validateRequest(updateSystemSettingsSchema),
  adminController.updateSystemSettings
);

export default router;
