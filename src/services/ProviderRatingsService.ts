import { VendorReview } from "../models/VendorReview";
import { ServiceReview } from "../models/ServiceReview";
import { Service } from "../models/Service";
import { User } from "../models/User";
import { Booking } from "../models/Booking";
import { AppError } from "../utils/AppError";
import { IVendorReview } from "../models/VendorReview";

export interface ProviderRatingStats {
  overallRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
  categoryRatings: {
    jobRating: number;
    communicationRating: number;
    punctualityRating: number;
    qualityRating: number;
  };
  recentReviews: IVendorReview[];
  verifiedReviews: number;
  responseRate: number;
  averageResponseTime: number;
}

export interface ReviewAnalytics {
  monthlyTrends: {
    month: string;
    averageRating: number;
    reviewCount: number;
  }[];
  categoryPerformance: {
    category: string;
    averageRating: number;
    reviewCount: number;
  }[];
  improvementAreas: {
    category: string;
    currentRating: number;
    targetRating: number;
    gap: number;
  }[];
}

export class ProviderRatingsService {
  // Get comprehensive provider rating statistics
  async getProviderRatingStats(
    providerId: string
  ): Promise<ProviderRatingStats> {
    try {
      // Get average ratings and total reviews
      const [averageRatings, ratingDistribution, recentReviews, verifiedCount] =
        await Promise.all([
          VendorReview.getAverageRatings(providerId),
          VendorReview.getRatingDistribution(providerId),
          VendorReview.findByVendor(providerId, 5, 0),
          VendorReview.countDocuments({
            vendorId: providerId,
            isVerified: true,
          }),
        ]);

      const ratingData = averageRatings[0] || {
        averageOverallRating: 0,
        averageJobRating: 0,
        averageCommunicationRating: 0,
        averagePunctualityRating: 0,
        averageQualityRating: 0,
        totalReviews: 0,
      };

      // Convert rating distribution to object format
      const distribution: { [key: number]: number } = {};
      ratingDistribution.forEach((item: any) => {
        distribution[item._id] = item.count;
      });

      // Calculate response rate (reviews with provider responses)
      const totalReviews = ratingData.totalReviews;
      const reviewsWithResponses = await VendorReview.countDocuments({
        vendorId: providerId,
        providerResponse: { $exists: true, $ne: null },
      });
      const responseRate =
        totalReviews > 0 ? (reviewsWithResponses / totalReviews) * 100 : 0;

      // Calculate average response time
      const responseTimeData = await VendorReview.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(providerId),
            "providerResponse.createdAt": { $exists: true },
          },
        },
        {
          $addFields: {
            responseTimeHours: {
              $divide: [
                { $subtract: ["$providerResponse.createdAt", "$createdAt"] },
                1000 * 60 * 60, // Convert to hours
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            averageResponseTime: { $avg: "$responseTimeHours" },
          },
        },
      ]);

      const averageResponseTime = responseTimeData[0]?.averageResponseTime || 0;

      return {
        overallRating: Math.round(ratingData.averageOverallRating * 100) / 100,
        totalReviews: ratingData.totalReviews,
        ratingDistribution: distribution,
        categoryRatings: {
          jobRating: Math.round(ratingData.averageJobRating * 100) / 100,
          communicationRating:
            Math.round(ratingData.averageCommunicationRating * 100) / 100,
          punctualityRating:
            Math.round(ratingData.averagePunctualityRating * 100) / 100,
          qualityRating:
            Math.round(ratingData.averageQualityRating * 100) / 100,
        },
        recentReviews: recentReviews,
        verifiedReviews: verifiedCount,
        responseRate: Math.round(responseRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      };
    } catch (error) {
      throw new AppError("Failed to fetch provider rating statistics", 500);
    }
  }

  // Get provider reviews with pagination and filtering
  async getProviderReviews(
    providerId: string,
    options: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: "date" | "rating" | "helpful";
      verifiedOnly?: boolean;
    } = {}
  ): Promise<{ reviews: IVendorReview[]; pagination: any }> {
    try {
      const {
        page = 1,
        limit = 10,
        rating,
        sortBy = "date",
        verifiedOnly = false,
      } = options;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { vendorId: providerId, isPublic: true };
      if (rating) query.overallRating = rating;
      if (verifiedOnly) query.isVerified = true;

      // Build sort
      let sort: any = {};
      switch (sortBy) {
        case "date":
          sort = { createdAt: -1 };
          break;
        case "rating":
          sort = { overallRating: -1, createdAt: -1 };
          break;
        case "helpful":
          sort = { helpfulCount: -1, createdAt: -1 };
          break;
      }

      const [reviews, total] = await Promise.all([
        VendorReview.find(query)
          .populate("userId", "firstName lastName profileImage")
          .populate("bookingId", "serviceId scheduledDate totalAmount")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        VendorReview.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch provider reviews", 500);
    }
  }

  // Get review analytics for provider improvement
  async getReviewAnalytics(providerId: string): Promise<ReviewAnalytics> {
    try {
      // Get monthly trends for the last 12 months
      const monthlyTrends = await VendorReview.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(providerId),
            isPublic: true,
            createdAt: {
              $gte: new Date(
                new Date().setFullYear(new Date().getFullYear() - 1)
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            averageRating: { $avg: "$overallRating" },
            reviewCount: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
        {
          $limit: 12,
        },
      ]);

      // Get category performance
      const categoryPerformance = await VendorReview.aggregate([
        {
          $match: {
            vendorId: new mongoose.Types.ObjectId(providerId),
            isPublic: true,
          },
        },
        {
          $group: {
            _id: null,
            jobRating: { $avg: "$jobRating" },
            communicationRating: { $avg: "$communicationRating" },
            punctualityRating: { $avg: "$punctualityRating" },
            qualityRating: { $avg: "$qualityRating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      // Calculate improvement areas
      const performance = categoryPerformance[0] || {
        jobRating: 0,
        communicationRating: 0,
        punctualityRating: 0,
        qualityRating: 0,
      };

      const targetRating = 4.5; // Target rating for improvement
      const improvementAreas = [
        {
          category: "Job Quality",
          currentRating: Math.round(performance.jobRating * 100) / 100,
          targetRating,
          gap: Math.round((targetRating - performance.jobRating) * 100) / 100,
        },
        {
          category: "Communication",
          currentRating:
            Math.round(performance.communicationRating * 100) / 100,
          targetRating,
          gap:
            Math.round((targetRating - performance.communicationRating) * 100) /
            100,
        },
        {
          category: "Punctuality",
          currentRating: Math.round(performance.punctualityRating * 100) / 100,
          targetRating,
          gap:
            Math.round((targetRating - performance.punctualityRating) * 100) /
            100,
        },
        {
          category: "Quality",
          currentRating: Math.round(performance.qualityRating * 100) / 100,
          targetRating,
          gap:
            Math.round((targetRating - performance.qualityRating) * 100) / 100,
        },
      ]
        .filter((area) => area.gap > 0)
        .sort((a, b) => b.gap - a.gap);

      return {
        monthlyTrends: monthlyTrends.map((trend) => ({
          month: `${trend._id.year}-${String(trend._id.month).padStart(
            2,
            "0"
          )}`,
          averageRating: Math.round(trend.averageRating * 100) / 100,
          reviewCount: trend.reviewCount,
        })),
        categoryPerformance: [
          {
            category: "Job Quality",
            averageRating: Math.round(performance.jobRating * 100) / 100,
            reviewCount: performance.totalReviews,
          },
          {
            category: "Communication",
            averageRating:
              Math.round(performance.communicationRating * 100) / 100,
            reviewCount: performance.totalReviews,
          },
          {
            category: "Punctuality",
            averageRating:
              Math.round(performance.punctualityRating * 100) / 100,
            reviewCount: performance.totalReviews,
          },
          {
            category: "Quality",
            averageRating: Math.round(performance.qualityRating * 100) / 100,
            reviewCount: performance.totalReviews,
          },
        ],
        improvementAreas,
      };
    } catch (error) {
      throw new AppError("Failed to fetch review analytics", 500);
    }
  }

  // Respond to a review (provider response)
  async respondToReview(
    reviewId: string,
    providerId: string,
    response: string
  ): Promise<IVendorReview> {
    try {
      const review = await VendorReview.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      if (review.vendorId.toString() !== providerId) {
        throw new AppError("Not authorized to respond to this review", 403);
      }

      if (review.providerResponse) {
        throw new AppError("Already responded to this review", 400);
      }

      const updatedReview = await VendorReview.findByIdAndUpdate(
        reviewId,
        {
          providerResponse: {
            comment: response,
            createdAt: new Date(),
          },
        },
        { new: true }
      );

      return updatedReview!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to respond to review", 500);
    }
  }

  // Update provider response
  async updateReviewResponse(
    reviewId: string,
    providerId: string,
    response: string
  ): Promise<IVendorReview> {
    try {
      const review = await VendorReview.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      if (review.vendorId.toString() !== providerId) {
        throw new AppError("Not authorized to update this response", 403);
      }

      const updatedReview = await VendorReview.findByIdAndUpdate(
        reviewId,
        {
          "providerResponse.comment": response,
          "providerResponse.updatedAt": new Date(),
        },
        { new: true }
      );

      return updatedReview!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update review response", 500);
    }
  }

  // Get service-specific reviews for provider
  async getServiceReviews(
    providerId: string,
    serviceId: string,
    options: {
      page?: number;
      limit?: number;
      rating?: number;
    } = {}
  ): Promise<{ reviews: any[]; pagination: any }> {
    try {
      const { page = 1, limit = 10, rating } = options;
      const skip = (page - 1) * limit;

      // Get bookings for this provider and service
      const bookings = await Booking.find({
        providerId,
        serviceId,
      }).select("_id");

      const bookingIds = bookings.map((booking) => booking._id);

      // Build query
      const query: any = {
        vendorId: providerId,
        bookingId: { $in: bookingIds },
        isPublic: true,
      };
      if (rating) query.overallRating = rating;

      const [reviews, total] = await Promise.all([
        VendorReview.find(query)
          .populate("userId", "firstName lastName profileImage")
          .populate("bookingId", "scheduledDate totalAmount")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        VendorReview.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch service reviews", 500);
    }
  }

  // Get provider ranking metrics
  async getProviderRankingMetrics(providerId: string): Promise<any> {
    try {
      // Get provider's average rating
      const providerStats = await this.getProviderRatingStats(providerId);

      // Get all providers' average ratings for comparison
      const allProvidersStats = await VendorReview.aggregate([
        {
          $match: { isPublic: true },
        },
        {
          $group: {
            _id: "$vendorId",
            averageRating: { $avg: "$overallRating" },
            totalReviews: { $sum: 1 },
          },
        },
        {
          $sort: { averageRating: -1, totalReviews: -1 },
        },
      ]);

      // Find provider's rank
      const providerRank = allProvidersStats.findIndex(
        (provider) => provider._id.toString() === providerId
      );

      // Calculate percentile
      const totalProviders = allProvidersStats.length;
      const percentile =
        totalProviders > 0
          ? ((totalProviders - providerRank) / totalProviders) * 100
          : 0;

      // Get top performers for comparison
      const topPerformers = allProvidersStats.slice(0, 10);

      return {
        currentRank: providerRank + 1,
        totalProviders,
        percentile: Math.round(percentile * 100) / 100,
        topPerformers: topPerformers.map((provider, index) => ({
          rank: index + 1,
          providerId: provider._id,
          averageRating: Math.round(provider.averageRating * 100) / 100,
          totalReviews: provider.totalReviews,
        })),
        providerStats,
      };
    } catch (error) {
      throw new AppError("Failed to fetch provider ranking metrics", 500);
    }
  }

  // Get review insights and recommendations
  async getReviewInsights(providerId: string): Promise<any> {
    try {
      const analytics = await this.getReviewAnalytics(providerId);
      const stats = await this.getProviderRatingStats(providerId);

      // Generate insights based on data
      const insights = {
        strengths: [] as string[],
        areasForImprovement: [] as string[],
        recommendations: [] as string[],
      };

      // Analyze strengths
      if (stats.categoryRatings.jobRating >= 4.5) {
        insights.strengths.push("Excellent job quality performance");
      }
      if (stats.categoryRatings.communicationRating >= 4.5) {
        insights.strengths.push("Strong communication skills");
      }
      if (stats.categoryRatings.punctualityRating >= 4.5) {
        insights.strengths.push("Great punctuality record");
      }
      if (stats.responseRate >= 80) {
        insights.strengths.push("High response rate to reviews");
      }

      // Analyze areas for improvement
      analytics.improvementAreas.forEach((area) => {
        insights.areasForImprovement.push(
          `${area.category}: Current rating ${area.currentRating}/5, Target: ${area.targetRating}/5`
        );
      });

      // Generate recommendations
      if (stats.responseRate < 50) {
        insights.recommendations.push(
          "Increase response rate to customer reviews to improve engagement"
        );
      }
      if (stats.averageResponseTime > 24) {
        insights.recommendations.push(
          "Respond to reviews within 24 hours to show excellent customer service"
        );
      }
      if (stats.overallRating < 4.0) {
        insights.recommendations.push(
          "Focus on improving overall service quality to reach 4+ star rating"
        );
      }
      if (analytics.improvementAreas.length > 0) {
        insights.recommendations.push(
          `Prioritize improving ${analytics.improvementAreas[0].category} as it has the largest gap`
        );
      }

      return {
        insights,
        analytics,
        stats,
      };
    } catch (error) {
      throw new AppError("Failed to generate review insights", 500);
    }
  }

  // Mark review as helpful (for other providers/customers)
  async markReviewHelpful(reviewId: string, userId: string): Promise<boolean> {
    try {
      const review = await VendorReview.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      // Check if user already marked as helpful
      const helpfulUsers = review.helpfulUsers || [];
      if (helpfulUsers.includes(userId)) {
        // Remove helpful mark
        await VendorReview.findByIdAndUpdate(reviewId, {
          $pull: { helpfulUsers: userId },
          $inc: { helpfulCount: -1 },
        });
        return false;
      } else {
        // Add helpful mark
        await VendorReview.findByIdAndUpdate(reviewId, {
          $addToSet: { helpfulUsers: userId },
          $inc: { helpfulCount: 1 },
        });
        return true;
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to mark review as helpful", 500);
    }
  }

  // Report inappropriate review
  async reportReview(
    reviewId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      const review = await VendorReview.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      // Check if user already reported this review
      const reportedUsers = review.reportedUsers || [];
      if (reportedUsers.includes(userId)) {
        throw new AppError("You have already reported this review", 400);
      }

      await VendorReview.findByIdAndUpdate(reviewId, {
        $addToSet: { reportedUsers: userId },
        $inc: { reportCount: 1 },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to report review", 500);
    }
  }
}

// Import mongoose for ObjectId
import mongoose from "mongoose";
