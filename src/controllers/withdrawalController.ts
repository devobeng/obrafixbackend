import { Request, Response } from "express";
import { WithdrawalService } from "../services/WithdrawalService";
import { asyncHandler } from "../middleware/errorHandler";

export class WithdrawalController {
  private withdrawalService: WithdrawalService;

  constructor() {
    this.withdrawalService = new WithdrawalService();
  }

  // Create withdrawal request
  createWithdrawalRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { amount, withdrawalMethod, withdrawalDetails } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!withdrawalMethod || !["bank_transfer", "mobile_money"].includes(withdrawalMethod)) {
      return res.status(400).json({ success: false, message: "Valid withdrawal method is required" });
    }

    if (!withdrawalDetails) {
      return res.status(400).json({ success: false, message: "Withdrawal details are required" });
    }

    const withdrawalRequest = await this.withdrawalService.createWithdrawalRequest(
      userId,
      amount,
      withdrawalMethod,
      withdrawalDetails
    );

    res.json({
      success: true,
      message: "Withdrawal request created successfully",
      data: withdrawalRequest,
    });
  });

  // Get withdrawal requests by user
  getWithdrawalRequestsByUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { requests, total } = await this.withdrawalService.getWithdrawalRequestsByUser(
      userId,
      parseInt(limit as string),
      skip
    );

    res.json({
      success: true,
      data: { requests, total },
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  });

  // Get withdrawal request by ID
  getWithdrawalRequestById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { withdrawalId } = req.params;

    const withdrawalRequest = await this.withdrawalService.getWithdrawalRequestById(
      withdrawalId,
      userId
    );

    res.json({
      success: true,
      data: withdrawalRequest,
    });
  });

  // Cancel withdrawal request
  cancelWithdrawalRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { withdrawalId } = req.params;

    const withdrawalRequest = await this.withdrawalService.cancelWithdrawalRequest(
      withdrawalId,
      userId
    );

    res.json({
      success: true,
      message: "Withdrawal request cancelled successfully",
      data: withdrawalRequest,
    });
  });

  // Get withdrawal statistics
  getWithdrawalStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const stats = await this.withdrawalService.getWithdrawalStats(userId);
    
    res.json({
      success: true,
      data: stats,
    });
  });

  // Admin: Get withdrawal requests by status
  getWithdrawalRequestsByStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const { requests, total } = await this.withdrawalService.getWithdrawalRequestsByStatus(
      status as string,
      parseInt(limit as string),
      skip
    );

    res.json({
      success: true,
      data: { requests, total },
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  });

  // Admin: Get pending withdrawal requests
  getPendingWithdrawalRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await this.withdrawalService.getPendingWithdrawalRequests();

    res.json({
      success: true,
      data: { requests, total: requests.length },
    });
  });

  // Admin: Process withdrawal request
  processWithdrawalRequest = asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Admin not authenticated" });
    }

    const { withdrawalId } = req.params;
    const { action, notes } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Valid action is required" });
    }

    const withdrawalRequest = await this.withdrawalService.processWithdrawalRequest(
      withdrawalId,
      adminId,
      action,
      notes
    );

    res.json({
      success: true,
      message: `Withdrawal request ${action}ed successfully`,
      data: withdrawalRequest,
    });
  });

  // Admin: Get all withdrawal statistics
  getAllWithdrawalStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.withdrawalService.getWithdrawalStats();
    
    res.json({
      success: true,
      data: stats,
    });
  });
} 