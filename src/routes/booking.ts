import express from "express";
import { BookingController } from "../controllers/bookingController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import {
  bookingCreateSchema,
  jobStatusUpdateSchema,
  messageSchema,
  bookingFiltersSchema,
  cancellationSchema,
  disputeSchema,
  refundSchema,
} from "../validators/bookingValidator";

const router = express.Router();
const bookingController = new BookingController();

// Public routes (none for bookings)

// User routes (authenticated users)
router.use(authenticate());

// User booking management
router.post(
  "/",
  validateRequest(bookingCreateSchema),
  bookingController.createBooking
);
router.get(
  "/user",
  validateRequest(bookingFiltersSchema, "query"),
  bookingController.getUserBookings
);
router.get("/user/:id", bookingController.getBookingById);
router.post(
  "/:id/messages",
  validateRequest(messageSchema),
  bookingController.addMessage
);
router.put("/:id/messages/read", bookingController.markMessagesAsRead);
router.post(
  "/:id/cancel",
  validateRequest(cancellationSchema),
  bookingController.cancelBooking
);
router.post(
  "/:id/dispute",
  validateRequest(disputeSchema),
  bookingController.createDispute
);
router.get("/user/stats", bookingController.getBookingStats);

// Provider routes (authenticated providers)
router.get(
  "/provider",
  requireRole("provider"),
  validateRequest(bookingFiltersSchema, "query"),
  bookingController.getProviderBookings
);
router.get(
  "/provider/:id",
  requireRole("provider"),
  bookingController.getBookingById
);
router.put(
  "/provider/:id/status",
  requireRole("provider"),
  validateRequest(jobStatusUpdateSchema),
  bookingController.updateJobStatus
);
router.post(
  "/provider/:id/messages",
  requireRole("provider"),
  validateRequest(messageSchema),
  bookingController.addMessage
);
router.put(
  "/provider/:id/messages/read",
  requireRole("provider"),
  bookingController.markMessagesAsRead
);
router.post(
  "/provider/:id/cancel",
  requireRole("provider"),
  validateRequest(cancellationSchema),
  bookingController.cancelBooking
);
router.post(
  "/provider/:id/dispute",
  requireRole("provider"),
  validateRequest(disputeSchema),
  bookingController.createDispute
);
router.get(
  "/provider/stats",
  requireRole("provider"),
  bookingController.getBookingStats
);

// Admin routes (authenticated admins)
router.get(
  "/admin/all",
  requireRole("admin"),
  validateRequest(bookingFiltersSchema, "query"),
  bookingController.getAllBookings
);
router.get(
  "/admin/stats",
  requireRole("admin"),
  bookingController.getAdminBookingStats
);
router.put(
  "/admin/:id/status",
  requireRole("admin"),
  validateRequest(jobStatusUpdateSchema),
  bookingController.updateJobStatus
);
router.post(
  "/admin/:id/dispute/resolve",
  requireRole("admin"),
  validateRequest(refundSchema),
  bookingController.resolveDispute
);
router.post(
  "/admin/:id/refund",
  requireRole("admin"),
  validateRequest(refundSchema),
  bookingController.processRefund
);

// General booking routes (for both users and providers)
router.get("/:id", bookingController.getBookingById);
router.put(
  "/:id/status",
  validateRequest(jobStatusUpdateSchema),
  bookingController.updateJobStatus
);

export default router;
