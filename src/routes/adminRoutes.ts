import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import {
  updateUserStatusSchema,
  verifyProviderDocumentsSchema,
  updateServiceStatusSchema,
  createServiceCategorySchema,
  updateServiceCategorySchema,
  setCommissionRateSchema,
  handleBookingCancellationSchema,
  processBookingRefundSchema,
  escalateDisputeSchema,
  resolveDisputeSchema,
  handleDisputeSchema,
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
  generateAnalyticsSchema,
  updateSystemSettingsSchema,
} from "../validations/adminValidation";

const router = Router();
const adminController = new AdminController();

// Apply authentication and role middleware to all admin routes
router.use(authenticate());
router.use(requireRole("admin"));

// ==================== SERVICE & CATEGORY MANAGEMENT ====================

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

router.patch(
  "/categories/:id/commission-rate",
  validateRequest(setCommissionRateSchema),
  adminController.setCategoryCommissionRate
);

router.get("/categories/stats", adminController.getServiceCategoryStats);

// ==================== BOOKING MANAGEMENT ====================

// Live Booking Monitoring
router.get("/bookings/live-stats", adminController.getLiveBookingStats);

router.get("/bookings/live", adminController.getLiveBookings);

// Booking Management
router.get("/bookings", adminController.getAllBookings);

router.get("/bookings/:id", adminController.getBookingById);

// Booking Cancellation & Refunds
router.post(
  "/bookings/:id/cancel",
  validateRequest(handleBookingCancellationSchema),
  adminController.handleBookingCancellation
);

router.post(
  "/bookings/:id/refund",
  validateRequest(processBookingRefundSchema),
  adminController.processBookingRefund
);

// Dispute Management
router.post(
  "/bookings/:id/dispute/escalate",
  validateRequest(escalateDisputeSchema),
  adminController.escalateDispute
);

router.post(
  "/bookings/:id/dispute/resolve",
  validateRequest(resolveDisputeSchema),
  adminController.resolveDispute
);

router.get("/disputes/stats", adminController.getDisputeStats);

// Legacy dispute handling (kept for compatibility)
router.patch(
  "/bookings/:id/dispute",
  validateRequest(handleDisputeSchema),
  adminController.handleBookingDispute
);

// ==================== USER MANAGEMENT ====================

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

// ==================== SERVICE MANAGEMENT ====================

// Service Management Routes
router.get("/services", adminController.getAllServices);

router.patch(
  "/services/:id/status",
  validateRequest(updateServiceStatusSchema),
  adminController.updateServiceStatus
);

// ==================== PAYMENT MANAGEMENT ====================

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

// ==================== ANALYTICS AND REPORTS ====================

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

// ==================== SYSTEM SETTINGS ====================

// System Settings Routes
router.get("/settings", adminController.getSystemSettings);

router.put(
  "/settings",
  validateRequest(updateSystemSettingsSchema),
  adminController.updateSystemSettings
);

export default router;
