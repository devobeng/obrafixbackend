import express from "express";
import { AdminPaymentController } from "../controllers/adminPaymentController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/roleAuth";
import { validateRequest } from "../middleware/validation";
import {
  approveWithdrawalRequestSchema,
  rejectWithdrawalRequestSchema,
  updatePaymentIntegrationSettingsSchema,
  withdrawalRequestFiltersSchema,
  revenueReportFiltersSchema,
  analyticsFiltersSchema,
  topServicesReportFiltersSchema,
  topVendorsReportFiltersSchema,
  customerActivityReportFiltersSchema,
  usageAnalyticsFiltersSchema,
} from "../validations/adminPaymentValidation";

const router = express.Router();
const adminPaymentController = new AdminPaymentController();

// Apply authentication and authorization middleware to all routes
router.use(authenticate());
router.use(requireRole("admin"));

// ==================== PAYOUT MANAGEMENT ====================

// Get all withdrawal requests with filtering
router.get(
  "/withdrawals",
  validateRequest(withdrawalRequestFiltersSchema),
  adminPaymentController.getWithdrawalRequests
);

// Get payout statistics
router.get("/withdrawals/stats", adminPaymentController.getPayoutStats);

// Approve withdrawal request
router.post(
  "/withdrawals/:id/approve",
  validateRequest(approveWithdrawalRequestSchema),
  adminPaymentController.approveWithdrawalRequest
);

// Reject withdrawal request
router.post(
  "/withdrawals/:id/reject",
  validateRequest(rejectWithdrawalRequestSchema),
  adminPaymentController.rejectWithdrawalRequest
);

// ==================== REVENUE & COMMISSION MANAGEMENT ====================

// Get revenue statistics
router.get(
  "/revenue/stats",
  validateRequest(revenueReportFiltersSchema),
  adminPaymentController.getRevenueStats
);

// Get commission statistics
router.get("/commission/stats", adminPaymentController.getCommissionStats);

// ==================== PAYMENT ANALYTICS ====================

// Get payment analytics
router.get(
  "/analytics/payments",
  validateRequest(analyticsFiltersSchema),
  adminPaymentController.getPaymentAnalytics
);

// ==================== INTEGRATION MANAGEMENT ====================

// Get payment integration status
router.get("/integrations/status", adminPaymentController.getPaymentIntegrationStatus);

// Update payment integration settings
router.patch(
  "/integrations/settings",
  validateRequest(updatePaymentIntegrationSettingsSchema),
  adminPaymentController.updatePaymentIntegrationSettings
);

// ==================== REPORTS & ANALYTICS ====================

// Daily revenue report
router.get(
  "/reports/revenue/daily",
  validateRequest(revenueReportFiltersSchema),
  adminPaymentController.getDailyRevenueReport
);

// Weekly revenue report
router.get(
  "/reports/revenue/weekly",
  validateRequest(revenueReportFiltersSchema),
  adminPaymentController.getWeeklyRevenueReport
);

// Monthly revenue report
router.get(
  "/reports/revenue/monthly",
  validateRequest(revenueReportFiltersSchema),
  adminPaymentController.getMonthlyRevenueReport
);

// Top services report
router.get(
  "/reports/services/top",
  validateRequest(topServicesReportFiltersSchema),
  adminPaymentController.getTopServicesReport
);

// Top vendors report
router.get(
  "/reports/vendors/top",
  validateRequest(topVendorsReportFiltersSchema),
  adminPaymentController.getTopVendorsReport
);

// Customer activity report
router.get(
  "/reports/customers/activity",
  validateRequest(customerActivityReportFiltersSchema),
  adminPaymentController.getCustomerActivityReport
);

// Usage analytics
router.get(
  "/reports/usage/analytics",
  validateRequest(usageAnalyticsFiltersSchema),
  adminPaymentController.getUsageAnalytics
);

export default router; 