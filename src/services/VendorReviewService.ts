import { VendorReview, IVendorReview } from "../models/VendorReview";
import { Booking } from "../models/Booking";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

export class VendorReviewService {
  // Create a new vendor review
  async createReview(
    vendorId: string,
    userId: string,
    bookingId: string,
    reviewData: {
      jobRating: number;
      communicationRating: number;
      punctualityRating: number;
      qualityRating: number;
      comment: string;
      images?: string[];
    }
  ): Promise<IVendorReview> {
    try {
      // Verify booking exists and belongs to user
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (booking.userId.toString() !== userId) {
        throw new AppError(
          "Access denied - you can only review your own bookings",
          403
        );
      }

      if (booking.status !== "completed") {
        throw new AppError("Can only review completed bookings", 400);
      }

      // Check if review already exists for this booking
      const existingReview = await VendorReview.findOne({ bookingId });
      if (existingReview) {
        throw new AppError("Review already exists for this booking", 400);
      }

      // Create the review
      const review = new VendorReview({
        vendorId,
        userId,
        bookingId,
        ...reviewData,
        images: reviewData.images || [],
      });

      await review.save();

      // Update vendor's average rating
      await this.updateVendorRating(vendorId);

      return review;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create review", 500);
    }
  }

  // Get reviews for a specific vendor
  async getVendorReviews(
    vendorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reviews: IVendorReview[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        VendorReview.findByVendor(vendorId, limit, skip),
        VendorReview.countDocuments({ vendorId, isPublic: true }),
      ]);

      return {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new AppError("Failed to retrieve vendor reviews", 500);
    }
  }

  // Get user's reviews
  async getUserReviews(userId: string): Promise<IVendorReview[]> {
    try {
      return await VendorReview.findByUser(userId);
    } catch (error) {
      throw new AppError("Failed to retrieve user reviews", 500);
    }
  }

  // Get review by ID
  async getReviewById(reviewId: string): Promise<IVendorReview> {
    try {
      const review = await VendorReview.findById(reviewId)
        .populate("userId", "firstName lastName profileImage")
        .populate("vendorId", "firstName lastName profileImage")
        .populate("bookingId", "serviceId scheduledDate");

      if (!review) {
        throw new AppError("Review not found", 404);
      }

      return review;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve review", 500);
    }
  }

  // Update review
  async updateReview(
    reviewId: string,
    userId: string,
    updateData: Partial<{
      jobRating: number;
      communicationRating: number;
      punctualityRating: number;
      qualityRating: number;
      comment: string;
      images: string[];
    }>
  ): Promise<IVendorReview> {
    try {
      const review = await VendorReview.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      if (review.userId.toString() !== userId) {
        throw new AppError(
          "Access denied - you can only edit your own reviews",
          403
        );
      }

      // Update the review
      Object.assign(review, updateData);
      await review.save();

      // Update vendor's average rating
      await this.updateVendorRating(review.vendorId.toString());

      return review;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update review", 500);
    }
  }

  // Delete review
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      const review = await VendorReview.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      if (review.userId.toString() !== userId) {
        throw new AppError(
          "Access denied - you can only delete your own reviews",
          403
        );
      }

      await review.deleteOne();

      // Update vendor's average rating
      await this.updateVendorRating(review.vendorId.toString());
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete review", 500);
    }
  }

  // Get vendor rating summary
  async getVendorRatingSummary(vendorId: string): Promise<{
    averageRatings: any;
    ratingDistribution: any[];
    totalReviews: number;
  }> {
    try {
      const [averageRatings, ratingDistribution] = await Promise.all([
        VendorReview.getAverageRatings(vendorId),
        VendorReview.getRatingDistribution(vendorId),
      ]);

      const totalReviews = averageRatings[0]?.totalReviews || 0;

      return {
        averageRatings: averageRatings[0] || {
          averageJobRating: 0,
          averageCommunicationRating: 0,
          averagePunctualityRating: 0,
          averageQualityRating: 0,
          averageOverallRating: 0,
          totalReviews: 0,
        },
        ratingDistribution,
        totalReviews,
      };
    } catch (error) {
      throw new AppError("Failed to retrieve vendor rating summary", 500);
    }
  }

  // Mark review as helpful
  async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      await VendorReview.findByIdAndUpdate(reviewId, {
        $inc: { helpfulCount: 1 },
      });
    } catch (error) {
      throw new AppError("Failed to mark review as helpful", 500);
    }
  }

  // Report review
  async reportReview(reviewId: string, reason: string): Promise<void> {
    try {
      await VendorReview.findByIdAndUpdate(reviewId, {
        $inc: { reportCount: 1 },
      });

      // TODO: Implement admin notification for reported reviews
    } catch (error) {
      throw new AppError("Failed to report review", 500);
    }
  }

  // Private method to update vendor's average rating
  private async updateVendorRating(vendorId: string): Promise<void> {
    try {
      const ratingSummary = await this.getVendorRatingSummary(vendorId);

      // Update user document with new rating
      await User.findByIdAndUpdate(vendorId, {
        $set: {
          averageRating: ratingSummary.averageRatings.averageOverallRating || 0,
          totalReviews: ratingSummary.totalReviews,
        },
      });
    } catch (error) {
      console.error("Failed to update vendor rating:", error);
    }
  }
}
