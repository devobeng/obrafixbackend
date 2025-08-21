import { Router } from "express";
import { WithdrawalController } from "../controllers/withdrawalController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = Router();
const withdrawalController = new WithdrawalController();

// Provider routes (authenticated providers)
router.post("/request", authenticate(), requireRole(["provider"]), withdrawalController.createWithdrawalRequest);
router.get("/my-requests", authenticate(), requireRole(["provider"]), withdrawalController.getWithdrawalRequestsByUser);
router.get("/request/:withdrawalId", authenticate(), withdrawalController.getWithdrawalRequestById);
router.delete("/request/:withdrawalId", authenticate(), withdrawalController.cancelWithdrawalRequest);
router.get("/stats", authenticate(), requireRole(["provider"]), withdrawalController.getWithdrawalStats);

// Admin routes
router.get("/by-status", authenticate(), requireRole(["admin"]), withdrawalController.getWithdrawalRequestsByStatus);
router.get("/pending", authenticate(), requireRole(["admin"]), withdrawalController.getPendingWithdrawalRequests);
router.put("/request/:withdrawalId/process", authenticate(), requireRole(["admin"]), withdrawalController.processWithdrawalRequest);
router.get("/all-stats", authenticate(), requireRole(["admin"]), withdrawalController.getAllWithdrawalStats);

export default router; 