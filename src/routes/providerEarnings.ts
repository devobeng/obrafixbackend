import { Router } from "express";
import { ProviderEarningsController } from "../controllers/providerEarningsController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = Router();
const earningsController = new ProviderEarningsController();

// Provider routes (authenticated providers only)
router.get(
  "/dashboard",
  authenticate(),
  requireRole(["provider"]),
  earningsController.getEarningsDashboard
);
router.get(
  "/report",
  authenticate(),
  requireRole(["provider"]),
  earningsController.getEarningsReport
);
router.get(
  "/breakdown",
  authenticate(),
  requireRole(["provider"]),
  earningsController.getEarningsBreakdown
);
router.get(
  "/wallet-summary",
  authenticate(),
  requireRole(["provider"]),
  earningsController.getWalletSummary
);
router.get(
  "/payment-history",
  authenticate(),
  requireRole(["provider"]),
  earningsController.getPaymentHistory
);
router.get(
  "/withdrawal-history",
  authenticate(),
  requireRole(["provider"]),
  earningsController.getWithdrawalHistory
);
router.get(
  "/performance-metrics",
  authenticate(),
  requireRole(["provider"]),
  earningsController.getPerformanceMetrics
);
router.post(
  "/calculate-estimated",
  authenticate(),
  requireRole(["provider"]),
  earningsController.calculateEstimatedEarnings
);

// Admin routes
router.get(
  "/commission-config",
  authenticate(),
  requireRole(["admin"]),
  earningsController.getCommissionConfig
);
router.put(
  "/commission-config",
  authenticate(),
  requireRole(["admin"]),
  earningsController.updateCommissionConfig
);
router.post(
  "/process-job-payment",
  authenticate(),
  requireRole(["admin"]),
  earningsController.processJobPayment
);

export default router;
