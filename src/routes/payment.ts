import express from "express";
import { PaymentController } from "../controllers/paymentController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = express.Router();
const paymentController = new PaymentController();

// Payment gateway routes
router.post("/paystack/initialize", authenticate(), paymentController.initializePaystackPayment);
router.post("/paystack/verify", paymentController.verifyPaystackPayment);
router.post("/mobile-money", authenticate(), paymentController.processMobileMoneyPayment);
router.post("/bank-transfer", authenticate(), paymentController.processBankTransfer);
router.post("/card", authenticate(), paymentController.processCardPayment);

// Booking payment routes
router.post("/booking", authenticate(), paymentController.processBookingPayment);

// Refund routes
router.post("/refund", authenticate(), requireRole(["admin"]), paymentController.refundPayment);

export default router;
