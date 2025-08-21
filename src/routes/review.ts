import { Router } from "express";
import reviewController from "../controllers/serviceReviewController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/service/:serviceId", reviewController.getReviewsByService);
router.get("/:id", reviewController.getReviewById);

// Authenticated user routes
router.post("/", authenticate(), reviewController.createReview);
router.get("/user/me", authenticate(), reviewController.getReviewsByUser);
router.put("/:id", authenticate(), reviewController.updateReview);
router.delete("/:id", authenticate(), reviewController.deleteReview);

// Admin-only routes
router.patch(
  "/:id/verify",
  authenticate(),
  requireRole("admin"),
  reviewController.verifyReview
);
router.get(
  "/stats/overview",
  authenticate(),
  requireRole("admin"),
  reviewController.getReviewStats
);

export default router;
