import { Request, Response } from "express";
import { ProviderEarningsService } from "../services/ProviderEarningsService";
import { asyncHandler } from "../middleware/errorHandler";

export class ProviderEarningsController {
  private earningsService: ProviderEarningsService;

  constructor() {
    this.earningsService = new ProviderEarningsService();
  }

  // Get provider earnings report
  getEarningsReport = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { period = "monthly", startDate, endDate } = req.query;

    if (!["daily", "weekly", "monthly", "yearly"].includes(period as string)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid period" });
    }

    const report = await this.earningsService.getEarningsReport(
      providerId,
      period as "daily" | "weekly" | "monthly" | "yearly",
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: report,
    });
  });

  // Get earnings breakdown
  getEarningsBreakdown = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { startDate, endDate, groupBy = "day" } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Start date and end date are required",
        });
    }

    if (!["day", "week", "month"].includes(groupBy as string)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid groupBy parameter" });
    }

    const breakdown = await this.earningsService.getEarningsBreakdown(
      providerId,
      new Date(startDate as string),
      new Date(endDate as string),
      groupBy as "day" | "week" | "month"
    );

    res.json({
      success: true,
      data: breakdown,
    });
  });

  // Get wallet summary
  getWalletSummary = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const summary = await this.earningsService.getWalletSummary(providerId);

    res.json({
      success: true,
      data: summary,
    });
  });

  // Get payment history
  getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const {
      page = "1",
      limit = "50",
      type,
      status,
      startDate,
      endDate,
    } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const { transactions, total } =
      await this.earningsService.getPaymentHistory(
        providerId,
        parseInt(limit as string),
        skip,
        filters
      );

    res.json({
      success: true,
      data: { transactions, total },
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  });

  // Get withdrawal history
  getWithdrawalHistory = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { withdrawals, total } =
      await this.earningsService.getWithdrawalHistory(
        providerId,
        parseInt(limit as string),
        skip
      );

    res.json({
      success: true,
      data: { withdrawals, total },
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  });

  // Calculate estimated earnings for a job
  calculateEstimatedEarnings = asyncHandler(
    async (req: Request, res: Response) => {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Valid amount is required" });
      }

      const estimatedEarnings =
        this.earningsService.calculateEstimatedEarnings(amount);

      res.json({
        success: true,
        data: estimatedEarnings,
      });
    }
  );

  // Get performance metrics
  getPerformanceMetrics = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { period = "month" } = req.query;

    if (!["week", "month", "year"].includes(period as string)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid period" });
    }

    const metrics = await this.earningsService.getPerformanceMetrics(
      providerId,
      period as "week" | "month" | "year"
    );

    res.json({
      success: true,
      data: metrics,
    });
  });

  // Get commission configuration (admin only)
  getCommissionConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = this.earningsService.getCommissionConfig();

    res.json({
      success: true,
      data: config,
    });
  });

  // Update commission configuration (admin only)
  updateCommissionConfig = asyncHandler(async (req: Request, res: Response) => {
    const { rate, minimumAmount, maximumAmount, tieredRates } = req.body;

    // Validate input
    if (rate !== undefined && (rate < 0 || rate > 1)) {
      return res
        .status(400)
        .json({ success: false, message: "Rate must be between 0 and 1" });
    }

    if (minimumAmount !== undefined && minimumAmount < 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Minimum amount must be non-negative",
        });
    }

    if (maximumAmount !== undefined && maximumAmount < 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Maximum amount must be non-negative",
        });
    }

    if (tieredRates && !Array.isArray(tieredRates)) {
      return res
        .status(400)
        .json({ success: false, message: "Tiered rates must be an array" });
    }

    // Update configuration
    this.earningsService.updateCommissionConfig({
      rate,
      minimumAmount,
      maximumAmount,
      tieredRates,
    });

    const updatedConfig = this.earningsService.getCommissionConfig();

    res.json({
      success: true,
      message: "Commission configuration updated successfully",
      data: updatedConfig,
    });
  });

  // Process job payment (called when job is completed)
  processJobPayment = asyncHandler(async (req: Request, res: Response) => {
    const { providerId, bookingId, amount, jobDetails } = req.body;

    if (!providerId || !bookingId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Provider ID, booking ID, and valid amount are required",
      });
    }

    const transaction = await this.earningsService.processJobPayment(
      providerId,
      bookingId,
      amount,
      jobDetails
    );

    res.json({
      success: true,
      message: "Job payment processed successfully",
      data: transaction,
    });
  });

  // Get earnings dashboard data
  getEarningsDashboard = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.user?.id;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Get multiple reports for dashboard
    const [
      dailyReport,
      weeklyReport,
      monthlyReport,
      walletSummary,
      performanceMetrics,
    ] = await Promise.all([
      this.earningsService.getEarningsReport(providerId, "daily"),
      this.earningsService.getEarningsReport(providerId, "weekly"),
      this.earningsService.getEarningsReport(providerId, "monthly"),
      this.earningsService.getWalletSummary(providerId),
      this.earningsService.getPerformanceMetrics(providerId, "month"),
    ]);

    res.json({
      success: true,
      data: {
        dailyReport,
        weeklyReport,
        monthlyReport,
        walletSummary,
        performanceMetrics,
      },
    });
  });
}
