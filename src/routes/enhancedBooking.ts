import express from "express";
import { EnhancedBookingController } from "../controllers/enhancedBookingController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { enhancedBookingValidators } from "../validators/enhancedBookingValidator";

const router = express.Router();
const enhancedBookingController = new EnhancedBookingController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Booking history and management
router.get("/history", enhancedBookingController.getBookingHistory);
router.get("/summary", enhancedBookingController.getBookingSummary);
router.get("/upcoming", enhancedBookingController.getUpcomingBookings);
router.get("/ongoing", enhancedBookingController.getOngoingBookings);
router.get("/recent", enhancedBookingController.getRecentBookings);
router.get("/status/:status", enhancedBookingController.getBookingsByStatus);

// Booking actions
router.post(
  "/:bookingId/cancel",
  validateRequest(enhancedBookingValidators.cancelBooking),
  enhancedBookingController.cancelBooking
);
router.post(
  "/:bookingId/reschedule",
  validateRequest(enhancedBookingValidators.rescheduleBooking),
  enhancedBookingController.rescheduleBooking
);

// Invoice generation
router.get("/:bookingId/invoice", enhancedBookingController.generateInvoice);

export default router;
