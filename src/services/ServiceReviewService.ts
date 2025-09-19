import { ServiceReview } from "../models/ServiceReview";
import { Service } from "../models/Service";
import { IServiceReview } from "../types";
import { AppError } from "../utils/AppError";

export class ServiceReviewService {
  // Create a new review
  async createReview(
    reviewData: Partial<IServiceReview>
  ): Promise<IServiceReview> {
    try {
      // Check if user already reviewed this service
      const existingReview = await ServiceReview.findOne({
        serviceId: reviewData.serviceId,
        userId: reviewData.userId,
      });

      if (existingReview) {
        throw new AppError("You have already reviewed this service", 400);
      }

      const review = new ServiceReview(reviewData);
      await review.save();

      // Update service rating
      await this.updateServiceRating(reviewData.serviceId!);

      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create review", 500);
    }
  }

  // Get reviews by service
  async getReviewsByService(
    serviceId: string,
    pagination: { page: number; limit: number }
  ): Promise<{ reviews: IServiceReview[]; pagination: any }> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        ServiceReview["findByService"](serviceId).skip(skip).limit(limit),
        ServiceReview.countDocuments({ serviceId }),
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
      throw new AppError("Failed to fetch reviews", 500);
    }
  }

  // Get reviews by user
  async getReviewsByUser(
    userId: string,
    pagination: { page: number; limit: number }
  ): Promise<{ reviews: IServiceReview[]; pagination: any }> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        ServiceReview["findByUser"](userId).skip(skip).limit(limit),
        ServiceReview.countDocuments({ userId }),
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
      throw new AppError("Failed to fetch user reviews", 500);
    }
  }

  // Update review
  async updateReview(
    reviewId: string,
    userId: string,
    updateData: Partial<IServiceReview>
  ): Promise<IServiceReview | null> {
    try {
      const review = await ServiceReview.findById(reviewId);

      if (!review) {
        throw new AppError("Review not found", 404);
      }

      if (review.userId.toString() !== userId) {
        throw new AppError("Not authorized to update this review", 403);
      }

      const updatedReview = await ServiceReview.findByIdAndUpdate(
        reviewId,
        updateData,
        { new: true, runValidators: true }
      );

      // Update service rating
      await this.updateServiceRating(review.serviceId.toString());

      return updatedReview;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update review", 500);
    }
  }

  // Delete review
  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    try {
      const review = await ServiceReview.findById(reviewId);

      if (!review) {
        return false;
      }

      if (review.userId.toString() !== userId) {
        throw new AppError("Not authorized to delete this review", 403);
      }

      const serviceId = review.serviceId.toString();
      await ServiceReview.findByIdAndDelete(reviewId);

      // Update service rating
      await this.updateServiceRating(serviceId);

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete review", 500);
    }
  }

  // Get review by ID
  async getReviewById(reviewId: string): Promise<IServiceReview | null> {
    try {
      return await ServiceReview.findById(reviewId);
    } catch (error) {
      throw new AppError("Failed to fetch review", 500);
    }
  }

  // Verify review (admin only)
  async verifyReview(reviewId: string): Promise<IServiceReview | null> {
    try {
      return await ServiceReview.findByIdAndUpdate(
        reviewId,
        { isVerified: true },
        { new: true }
      );
    } catch (error) {
      throw new AppError("Failed to verify review", 500);
    }
  }

  // Get review statistics
  async getReviewStats(): Promise<any> {
    try {
      const [totalReviews, verifiedReviews, averageRating, ratingDistribution] =
        await Promise.all([
          ServiceReview.countDocuments(),
          ServiceReview.countDocuments({ isVerified: true }),
          ServiceReview.aggregate([
            { $group: { _id: null, avgRating: { $avg: "$rating" } } },
          ]).then((result) => result[0]?.avgRating || 0),
          ServiceReview.aggregate([
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),
        ]);

      return {
        totalReviews,
        verifiedReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingDistribution,
      };
    } catch (error) {
      throw new AppError("Failed to fetch review statistics", 500);
    }
  }

  // Like a review
  async likeReview(
    reviewId: string,
    userId: string
  ): Promise<IServiceReview | null> {
    try {
      const review = await ServiceReview.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      // Increment likes count
      review.likes += 1;
      await review.save();

      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to like review", 500);
    }
  }

  // Unlike a review
  async unlikeReview(
    reviewId: string,
    userId: string
  ): Promise<IServiceReview | null> {
    try {
      const review = await ServiceReview.findById(reviewId);
      if (!review) {
        throw new AppError("Review not found", 404);
      }

      // Decrement likes count (ensure it doesn't go below 0)
      if (review.likes > 0) {
        review.likes -= 1;
        await review.save();
      }

      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to unlike review", 500);
    }
  }

  // Update service rating after review changes
  private async updateServiceRating(serviceId: string): Promise<void> {
    try {
      const ratingData = await ServiceReview["getAverageRating"](serviceId);

      if (ratingData.length > 0) {
        const { averageRating, totalReviews } = ratingData[0];

        await Service.findByIdAndUpdate(serviceId, {
          "rating.average": Math.round(averageRating * 100) / 100,
          "rating.count": totalReviews,
        });
      } else {
        // No reviews, reset to defaults
        await Service.findByIdAndUpdate(serviceId, {
          "rating.average": 0,
          "rating.count": 0,
        });
      }
    } catch (error) {
      console.error("Failed to update service rating:", error);
    }
  }
}
