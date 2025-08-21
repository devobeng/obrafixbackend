import express from "express";
import { VendorReviewController } from "../controllers/vendorReviewController";
import { authenticate } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { vendorReviewValidators } from "../validators/vendorReviewValidator";

const router = express.Router();
const vendorReviewController = new VendorReviewController();

// Public routes (no authentication required)
router.get("/vendor/:vendorId", vendorReviewController.getVendorReviews);
router.get(
  "/vendor/:vendorId/summary",
  vendorReviewController.getVendorRatingSummary
);
router.get("/:reviewId", vendorReviewController.getReviewById);
router.post("/:reviewId/helpful", vendorReviewController.markReviewHelpful);

// Protected routes (authentication required)
router.use(authenticate);

// User review management
router.get("/user/reviews", vendorReviewController.getUserReviews);
router.post(
  "/",
  validateRequest(vendorReviewValidators.createReview),
  vendorReviewController.createReview
);
router.put(
  "/:reviewId",
  validateRequest(vendorReviewValidators.updateReview),
  vendorReviewController.updateReview
);
router.delete("/:reviewId", vendorReviewController.deleteReview);
router.post(
  "/:reviewId/report",
  validateRequest(vendorReviewValidators.reportReview),
  vendorReviewController.reportReview
);

export default router;
