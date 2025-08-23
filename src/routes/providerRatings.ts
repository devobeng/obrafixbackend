import { Router } from "express";
import { ProviderRatingsController } from "../controllers/providerRatingsController";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/auth";

const router = Router();
const ratingsController = new ProviderRatingsController();

// Provider routes (authenticated providers only)
router.get(
  "/stats",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getRatingStats
);

router.get(
  "/reviews",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getReviews
);

router.get(
  "/analytics",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getReviewAnalytics
);

router.get(
  "/ranking",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getRankingMetrics
);

router.get(
  "/insights",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getReviewInsights
);

router.get(
  "/distribution",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getRatingDistribution
);

router.get(
  "/trends",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getMonthlyTrends
);

router.get(
  "/performance",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getCategoryPerformance
);

router.get(
  "/improvement-areas",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getImprovementAreas
);

// Service-specific reviews
router.get(
  "/service/:serviceId",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.getServiceReviews
);

// Review response management
router.post(
  "/reviews/:reviewId/respond",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.respondToReview
);

router.put(
  "/reviews/:reviewId/response",
  authenticate(),
  requireRole(["provider"]),
  ratingsController.updateReviewResponse
);

// Review interaction (helpful/report)
router.post(
  "/reviews/:reviewId/helpful",
  authenticate(),
  ratingsController.markReviewHelpful
);

router.post(
  "/reviews/:reviewId/report",
  authenticate(),
  ratingsController.reportReview
);

// Public routes (for customers to view provider reviews)
router.get(
  "/public/:providerId/stats",
  ratingsController.getPublicProviderRatingStats
);

router.get(
  "/public/:providerId/reviews",
  ratingsController.getPublicProviderReviews
);

router.get("/reviews/:reviewId", ratingsController.getReviewById);

export default router;
