import { Request, Response } from "express";
import { VendorReviewService } from "../services/VendorReviewService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { IAuthRequest } from "../types";

export class VendorReviewController {
  private vendorReviewService: VendorReviewService;

  constructor() {
    this.vendorReviewService = new VendorReviewService();
  }

  // Create a new vendor review
  createReview = catchAsync(async (req: IAuthRequest, res: Response) => {
    const {
      vendorId,
      bookingId,
      jobRating,
      communicationRating,
      punctualityRating,
      qualityRating,
      comment,
      images,
    } = req.body;
    const userId = req.user!.id;

    const review = await this.vendorReviewService.createReview(
      vendorId,
      userId,
      bookingId,
      {
        jobRating,
        communicationRating,
        punctualityRating,
        qualityRating,
        comment,
        images,
      }
    );

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  });

  // Get reviews for a specific vendor
  getVendorReviews = catchAsync(async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await this.vendorReviewService.getVendorReviews(
      vendorId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      message: "Vendor reviews retrieved successfully",
      data: result,
    });
  });

  // Get user's reviews
  getUserReviews = catchAsync(async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;

    const reviews = await this.vendorReviewService.getUserReviews(userId);

    res.status(200).json({
      success: true,
      message: "User reviews retrieved successfully",
      data: reviews,
    });
  });

  // Get review by ID
  getReviewById = catchAsync(async (req: Request, res: Response) => {
    const { reviewId } = req.params;

    const review = await this.vendorReviewService.getReviewById(reviewId);

    res.status(200).json({
      success: true,
      message: "Review retrieved successfully",
      data: review,
    });
  });

  // Update review
  updateReview = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { reviewId } = req.params;
    const userId = req.user!.id;
    const updateData = req.body;

    const review = await this.vendorReviewService.updateReview(
      reviewId,
      userId,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  });

  // Delete review
  deleteReview = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { reviewId } = req.params;
    const userId = req.user!.id;

    await this.vendorReviewService.deleteReview(reviewId, userId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  });

  // Get vendor rating summary
  getVendorRatingSummary = catchAsync(async (req: Request, res: Response) => {
    const { vendorId } = req.params;

    const summary = await this.vendorReviewService.getVendorRatingSummary(
      vendorId
    );

    res.status(200).json({
      success: true,
      message: "Vendor rating summary retrieved successfully",
      data: summary,
    });
  });

  // Mark review as helpful
  markReviewHelpful = catchAsync(async (req: Request, res: Response) => {
    const { reviewId } = req.params;

    await this.vendorReviewService.markReviewHelpful(reviewId);

    res.status(200).json({
      success: true,
      message: "Review marked as helpful",
    });
  });

  // Report review
  reportReview = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { reviewId } = req.params;
    const { reason } = req.body;

    await this.vendorReviewService.reportReview(reviewId, reason);

    res.status(200).json({
      success: true,
      message: "Review reported successfully",
    });
  });
}
