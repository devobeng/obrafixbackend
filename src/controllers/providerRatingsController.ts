import { Request, Response } from "express";
import { ProviderRatingsService } from "../services/ProviderRatingsService";
import { asyncHandler } from "../middleware/errorHandler";

export class ProviderRatingsController {
  private ratingsService: ProviderRatingsService;

  constructor() {
    this.ratingsService = new ProviderRatingsService();
  }

  // Get provider rating statistics
  getRatingStats = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const stats = await this.ratingsService.getProviderRatingStats(providerId);

    res.json({
      success: true,
      data: stats,
    });
  });

  // Get provider reviews with filtering and pagination
  getReviews = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const {
      page = "1",
      limit = "10",
      rating,
      sortBy = "date",
      verifiedOnly = "false",
    } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      rating: rating ? parseInt(rating as string) : undefined,
      sortBy: sortBy as "date" | "rating" | "helpful",
      verifiedOnly: verifiedOnly === "true",
    };

    const result = await this.ratingsService.getProviderReviews(
      providerId,
      options
    );

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  });

  // Get review analytics for improvement
  getReviewAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const analytics = await this.ratingsService.getReviewAnalytics(providerId);

    res.json({
      success: true,
      data: analytics,
    });
  });

  // Respond to a review
  respondToReview = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Response is required" });
    }

    if (response.length > 1000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Response cannot exceed 1000 characters",
        });
    }

    const updatedReview = await this.ratingsService.respondToReview(
      reviewId,
      providerId,
      response
    );

    res.json({
      success: true,
      message: "Response added successfully",
      data: updatedReview,
    });
  });

  // Update provider response
  updateReviewResponse = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Response is required" });
    }

    if (response.length > 1000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Response cannot exceed 1000 characters",
        });
    }

    const updatedReview = await this.ratingsService.updateReviewResponse(
      reviewId,
      providerId,
      response
    );

    res.json({
      success: true,
      message: "Response updated successfully",
      data: updatedReview,
    });
  });

  // Get service-specific reviews
  getServiceReviews = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { serviceId } = req.params;
    const { page = "1", limit = "10", rating } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      rating: rating ? parseInt(rating as string) : undefined,
    };

    const result = await this.ratingsService.getServiceReviews(
      providerId,
      serviceId,
      options
    );

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  });

  // Get provider ranking metrics
  getRankingMetrics = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const metrics = await this.ratingsService.getProviderRankingMetrics(
      providerId
    );

    res.json({
      success: true,
      data: metrics,
    });
  });

  // Get review insights and recommendations
  getReviewInsights = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const insights = await this.ratingsService.getReviewInsights(providerId);

    res.json({
      success: true,
      data: insights,
    });
  });

  // Mark review as helpful
  markReviewHelpful = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { reviewId } = req.params;

    const isHelpful = await this.ratingsService.markReviewHelpful(
      reviewId,
      userId
    );

    res.json({
      success: true,
      message: isHelpful ? "Marked as helpful" : "Removed helpful mark",
      data: { isHelpful },
    });
  });

  // Report inappropriate review
  reportReview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Reason is required" });
    }

    await this.ratingsService.reportReview(reviewId, userId, reason);

    res.json({
      success: true,
      message: "Review reported successfully",
    });
  });

  // Get public provider reviews (for customers)
  getPublicProviderReviews = asyncHandler(
    async (req: Request, res: Response) => {
      const { providerId } = req.params;
      const {
        page = "1",
        limit = "10",
        rating,
        sortBy = "date",
        verifiedOnly = "false",
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        rating: rating ? parseInt(rating as string) : undefined,
        sortBy: sortBy as "date" | "rating" | "helpful",
        verifiedOnly: verifiedOnly === "true",
      };

      const result = await this.ratingsService.getProviderReviews(
        providerId,
        options
      );

      res.json({
        success: true,
        data: result.reviews,
        pagination: result.pagination,
      });
    }
  );

  // Get public provider rating stats (for customers)
  getPublicProviderRatingStats = asyncHandler(
    async (req: Request, res: Response) => {
      const { providerId } = req.params;

      const stats = await this.ratingsService.getProviderRatingStats(
        providerId
      );

      // Remove sensitive information for public view
      const publicStats = {
        overallRating: stats.overallRating,
        totalReviews: stats.totalReviews,
        ratingDistribution: stats.ratingDistribution,
        categoryRatings: stats.categoryRatings,
        verifiedReviews: stats.verifiedReviews,
        responseRate: stats.responseRate,
        averageResponseTime: stats.averageResponseTime,
      };

      res.json({
        success: true,
        data: publicStats,
      });
    }
  );

  // Get review by ID (for detailed view)
  getReviewById = asyncHandler(async (req: Request, res: Response) => {
    const { reviewId } = req.params;

    // Import VendorReview model
    const { VendorReview } = await import("../models/VendorReview");

    const review = await VendorReview.findById(reviewId)
      .populate("userId", "firstName lastName profileImage")
      .populate("vendorId", "firstName lastName profileImage")
      .populate("bookingId", "serviceId scheduledDate totalAmount");

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    res.json({
      success: true,
      data: review,
    });
  });

  // Get rating distribution chart data
  getRatingDistribution = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Import VendorReview model
    const { VendorReview } = await import("../models/VendorReview");

    const distribution = await VendorReview.getRatingDistribution(providerId);

    res.json({
      success: true,
      data: distribution,
    });
  });

  // Get monthly rating trends
  getMonthlyTrends = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const analytics = await this.ratingsService.getReviewAnalytics(providerId);

    res.json({
      success: true,
      data: analytics.monthlyTrends,
    });
  });

  // Get category performance comparison
  getCategoryPerformance = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const analytics = await this.ratingsService.getReviewAnalytics(providerId);

    res.json({
      success: true,
      data: analytics.categoryPerformance,
    });
  });

  // Get improvement areas
  getImprovementAreas = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const analytics = await this.ratingsService.getReviewAnalytics(providerId);

    res.json({
      success: true,
      data: analytics.improvementAreas,
    });
  });
}
