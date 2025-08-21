import { Request, Response } from "express";
import { ServiceReviewService } from "../services/ServiceReviewService";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";

export class ServiceReviewController {
  private reviewService: ServiceReviewService;

  constructor() {
    this.reviewService = new ServiceReviewService();
  }

  // Create a new review (authenticated users only)
  public createReview = asyncHandler(async (req: Request, res: Response) => {
    const { serviceId, rating, comment } = req.body;
    const userId = (req as any).user?.id;

    if (!serviceId || !rating || !comment) {
      throw new AppError("Service ID, rating, and comment are required", 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const review = await this.reviewService.createReview({
      serviceId,
      userId,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: { review },
    });
  });

  // Get reviews by service (public)
  public getReviewsByService = asyncHandler(
    async (req: Request, res: Response) => {
      const { serviceId } = req.params;
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 10;

      const result = await this.reviewService.getReviewsByService(serviceId, {
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Get reviews by user (authenticated users only)
  public getReviewsByUser = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 10;

      const result = await this.reviewService.getReviewsByUser(userId, {
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    }
  );

  // Update review (authenticated users only)
  public updateReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = (req as any).user?.id;

    if (!rating && !comment) {
      throw new AppError("At least one field to update is required", 400);
    }

    if (rating && (rating < 1 || rating > 5)) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const updateData: any = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    const review = await this.reviewService.updateReview(
      id,
      userId,
      updateData
    );

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    res.json({
      success: true,
      message: "Review updated successfully",
      data: { review },
    });
  });

  // Delete review (authenticated users only)
  public deleteReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const result = await this.reviewService.deleteReview(id, userId);

    if (!result) {
      throw new AppError("Review not found", 404);
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  });

  // Get review by ID (public)
  public getReviewById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const review = await this.reviewService.getReviewById(id);

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    res.json({
      success: true,
      data: { review },
    });
  });

  // Verify review (admin only)
  public verifyReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const review = await this.reviewService.verifyReview(id);

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    res.json({
      success: true,
      message: "Review verified successfully",
      data: { review },
    });
  });

  // Get review statistics (admin only)
  public getReviewStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.reviewService.getReviewStats();

    res.json({
      success: true,
      data: { stats },
    });
  });
}

export default new ServiceReviewController();
