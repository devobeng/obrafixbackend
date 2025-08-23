import express from "express";
import { RefundRequestController } from "../controllers/RefundRequestController";
import { authenticate } from "../middleware/auth";

const router = express.Router();
const refundRequestController = new RefundRequestController();

// All routes require authentication
router.use(authenticate());

// Refund request management
router.post("/", refundRequestController.createRefundRequest);
router.get("/", refundRequestController.getUserRefundRequests);
router.get("/statistics", refundRequestController.getRefundStatistics);
router.get("/search", refundRequestController.searchRefundRequests);

// Individual refund request operations
router.get("/:requestId", refundRequestController.getRefundRequestById);
router.put("/:requestId", refundRequestController.updateRefundRequest);
router.post("/:requestId/cancel", refundRequestController.cancelRefundRequest);

// Admin routes
router.post("/:requestId/process", refundRequestController.processRefund);
router.get("/urgent/all", refundRequestController.getUrgentRequests);

export default router;
