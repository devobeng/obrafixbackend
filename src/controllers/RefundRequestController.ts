import { Request, Response, NextFunction } from "express";
import { RefundRequestService } from "../services/RefundRequestService";
import { AppError } from "../utils/AppError";

export class RefundRequestController {
  private refundRequestService: RefundRequestService;

  constructor() {
    this.refundRequestService = new RefundRequestService();
  }

  // Create refund request
  createRefundRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const requestData = req.body;

      const refundRequest = await this.refundRequestService.createRefundRequest(
        userId,
        requestData
      );

      res.status(201).json({
        success: true,
        data: refundRequest,
        message: "Refund request created successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user's refund requests
  getUserRefundRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { status, page = "1", limit = "10" } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const result = await this.refundRequestService.getUserRefundRequests(
        userId,
        status as string,
        pageNum,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get refund request by ID
  getRefundRequestById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { requestId } = req.params;

      const refundRequest =
        await this.refundRequestService.getRefundRequestById(requestId, userId);

      res.status(200).json({
        success: true,
        data: refundRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update refund request
  updateRefundRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { requestId } = req.params;
      const updateData = req.body;

      const refundRequest = await this.refundRequestService.updateRefundRequest(
        requestId,
        userId,
        updateData
      );

      res.status(200).json({
        success: true,
        data: refundRequest,
        message: "Refund request updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Cancel refund request
  cancelRefundRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { requestId } = req.params;

      const refundRequest = await this.refundRequestService.cancelRefundRequest(
        requestId,
        userId
      );

      res.status(200).json({
        success: true,
        data: refundRequest,
        message: "Refund request cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Process refund (admin function)
  processRefund = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = (req as any).user.id;
      const { requestId } = req.params;
      const { action, notes, rejectionReason } = req.body;

      if (!action || !["approve", "reject"].includes(action)) {
        throw new AppError("Valid action (approve/reject) is required", 400);
      }

      if (action === "reject" && !rejectionReason) {
        throw new AppError(
          "Rejection reason is required when rejecting a refund",
          400
        );
      }

      const refundRequest = await this.refundRequestService.processRefund(
        requestId,
        adminId,
        action,
        notes,
        rejectionReason
      );

      res.status(200).json({
        success: true,
        data: refundRequest,
        message: `Refund request ${action}ed successfully`,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get refund request statistics
  getRefundStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id; // Optional for admin access

      const statistics = await this.refundRequestService.getRefundStatistics(
        userId
      );

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get urgent refund requests
  getUrgentRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requests = await this.refundRequestService.getUrgentRequests();

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  };

  // Search refund requests
  searchRefundRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { q: searchTerm, page = "1", limit = "10" } = req.query;

      if (!searchTerm || typeof searchTerm !== "string") {
        throw new AppError("Search term is required", 400);
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const result = await this.refundRequestService.searchRefundRequests(
        userId,
        searchTerm,
        pageNum,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
