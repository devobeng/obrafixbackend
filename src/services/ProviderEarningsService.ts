import { IWalletTransaction, IWithdrawalRequest, IUser } from "../types";
import { WalletTransaction } from "../models/WalletTransaction";
import { WithdrawalRequest } from "../models/WithdrawalRequest";
import { User } from "../models/User";
import { Booking } from "../models/Booking";
import { AppError } from "../utils/AppError";
import { WalletService } from "./WalletService";

export interface EarningsReport {
  period: string;
  totalEarnings: number;
  netEarnings: number;
  platformFees: number;
  commissionRate: number;
  totalJobs: number;
  averagePerJob: number;
  currency: string;
  breakdown: {
    daily?: { [date: string]: number };
    weekly?: { [week: string]: number };
    monthly?: { [month: string]: number };
  };
}

export interface CommissionConfig {
  rate: number; // Percentage (e.g., 0.15 for 15%)
  minimumAmount: number;
  maximumAmount?: number;
  tieredRates?: Array<{
    minAmount: number;
    maxAmount?: number;
    rate: number;
  }>;
}

export class ProviderEarningsService {
  private walletService: WalletService;
  private commissionConfig: CommissionConfig;

  constructor() {
    this.walletService = new WalletService();
    // Default commission configuration
    this.commissionConfig = {
      rate: 0.15, // 15% platform fee
      minimumAmount: 0,
      tieredRates: [
        { minAmount: 0, maxAmount: 1000, rate: 0.2 }, // 20% for first 1000
        { minAmount: 1000, maxAmount: 5000, rate: 0.15 }, // 15% for 1000-5000
        { minAmount: 5000, rate: 0.1 }, // 10% for 5000+
      ],
    };
  }

  // Calculate commission for a given amount
  calculateCommission(amount: number): {
    commission: number;
    netAmount: number;
    rate: number;
  } {
    let rate = this.commissionConfig.rate;

    // Apply tiered rates if configured
    if (this.commissionConfig.tieredRates) {
      for (const tier of this.commissionConfig.tieredRates) {
        if (
          amount >= tier.minAmount &&
          (!tier.maxAmount || amount <= tier.maxAmount)
        ) {
          rate = tier.rate;
          break;
        }
      }
    }

    const commission = amount * rate;
    const netAmount = amount - commission;

    return { commission, netAmount, rate };
  }

  // Process payment to provider after job completion
  async processJobPayment(
    providerId: string,
    bookingId: string,
    amount: number,
    jobDetails?: any
  ): Promise<IWalletTransaction> {
    // Validate provider
    const provider = await User.findById(providerId);
    if (!provider || provider.role !== "provider") {
      throw new AppError("Invalid provider", 400);
    }

    // Calculate commission
    const { commission, netAmount, rate } = this.calculateCommission(amount);

    // Add funds to provider wallet
    const transaction = await this.walletService.addFunds(
      providerId,
      netAmount,
      `Payment for completed job - Booking #${bookingId}`,
      {
        bookingId,
        type: "job_payment",
        platformFee: commission,
        commissionRate: rate,
        grossAmount: amount,
        netAmount,
        jobDetails,
      }
    );

    return transaction;
  }

  // Get provider earnings report
  async getEarningsReport(
    providerId: string,
    period: "daily" | "weekly" | "monthly" | "yearly",
    startDate?: Date,
    endDate?: Date
  ): Promise<EarningsReport> {
    // Validate provider
    const provider = await User.findById(providerId);
    if (!provider || provider.role !== "provider") {
      throw new AppError("Invalid provider", 400);
    }

    // Set default date range if not provided
    const now = new Date();
    if (!endDate) endDate = now;
    if (!startDate) {
      switch (period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          startDate = new Date(
            weekStart.getFullYear(),
            weekStart.getMonth(),
            weekStart.getDate()
          );
          break;
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "yearly":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
    }

    // Get all credit transactions for the provider in the date range
    const transactions = await WalletTransaction.find({
      userId: providerId,
      type: "credit",
      status: "completed",
      createdAt: { $gte: startDate, $lte: endDate },
      "metadata.type": "job_payment",
    }).sort({ createdAt: 1 });

    // Calculate totals
    let totalEarnings = 0;
    let totalFees = 0;
    let totalJobs = transactions.length;
    const breakdown: any = {};

    transactions.forEach((tx) => {
      const grossAmount = tx.metadata?.grossAmount || tx.amount;
      const fees = tx.metadata?.platformFee || 0;

      totalEarnings += grossAmount;
      totalFees += fees;

      // Build breakdown based on period
      const date = new Date(tx.createdAt);
      let key: string;

      switch (period) {
        case "daily":
          key = date.toISOString().split("T")[0];
          break;
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
          break;
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
          break;
        case "yearly":
          key = date.getFullYear().toString();
          break;
      }

      if (!breakdown[key]) breakdown[key] = 0;
      breakdown[key] += grossAmount;
    });

    const netEarnings = totalEarnings - totalFees;
    const averagePerJob = totalJobs > 0 ? totalEarnings / totalJobs : 0;

    return {
      period,
      totalEarnings,
      netEarnings,
      platformFees: totalFees,
      commissionRate: this.commissionConfig.rate,
      totalJobs,
      averagePerJob,
      currency: "GHS",
      breakdown,
    };
  }

  // Get detailed earnings breakdown
  async getEarningsBreakdown(
    providerId: string,
    startDate: Date,
    endDate: Date,
    groupBy: "day" | "week" | "month" = "day"
  ): Promise<any[]> {
    const matchStage = {
      userId: providerId,
      type: "credit",
      status: "completed",
      createdAt: { $gte: startDate, $lte: endDate },
      "metadata.type": "job_payment",
    };

    let groupStage: any;
    switch (groupBy) {
      case "day":
        groupStage = {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
        };
        break;
      case "week":
        groupStage = {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" },
          },
        };
        break;
      case "month":
        groupStage = {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
        };
        break;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          ...groupStage,
          totalEarnings: { $sum: "$metadata.grossAmount" },
          netEarnings: { $sum: "$amount" },
          platformFees: { $sum: "$metadata.platformFee" },
          jobCount: { $sum: 1 },
          transactions: { $push: "$$ROOT" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
    ];

    return await WalletTransaction.aggregate(pipeline);
  }

  // Get provider wallet summary
  async getWalletSummary(providerId: string): Promise<any> {
    const wallet = await this.walletService.getWalletByUserId(providerId);
    const stats = await this.walletService.getWalletStats(providerId);

    // Get recent transactions
    const { transactions } = await this.walletService.getWalletTransactions(
      providerId,
      10,
      0
    );

    // Get pending withdrawal requests
    const pendingWithdrawals = await WithdrawalRequest.find({
      userId: providerId,
      status: "pending",
    });

    return {
      wallet,
      stats,
      recentTransactions: transactions,
      pendingWithdrawals: pendingWithdrawals.length,
      pendingAmount: pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
    };
  }

  // Get provider payment history
  async getPaymentHistory(
    providerId: string,
    limit: number = 50,
    skip: number = 0,
    filters?: {
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ transactions: IWalletTransaction[]; total: number }> {
    const query: any = { userId: providerId };

    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("metadata.bookingId", "title totalAmount"),
      WalletTransaction.countDocuments(query),
    ]);

    return { transactions, total };
  }

  // Get withdrawal history
  async getWithdrawalHistory(
    providerId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ withdrawals: IWithdrawalRequest[]; total: number }> {
    const [withdrawals, total] = await Promise.all([
      WithdrawalRequest.find({ userId: providerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WithdrawalRequest.countDocuments({ userId: providerId }),
    ]);

    return { withdrawals, total };
  }

  // Update commission configuration (admin only)
  updateCommissionConfig(config: Partial<CommissionConfig>): void {
    this.commissionConfig = { ...this.commissionConfig, ...config };
  }

  // Get current commission configuration
  getCommissionConfig(): CommissionConfig {
    return { ...this.commissionConfig };
  }

  // Calculate estimated earnings for a job
  calculateEstimatedEarnings(amount: number): {
    grossAmount: number;
    commission: number;
    netAmount: number;
    rate: number;
  } {
    const { commission, netAmount, rate } = this.calculateCommission(amount);

    return {
      grossAmount: amount,
      commission,
      netAmount,
      rate,
    };
  }

  // Get provider performance metrics
  async getPerformanceMetrics(
    providerId: string,
    period: "week" | "month" | "year"
  ): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Get completed bookings
    const completedBookings = await Booking.find({
      providerId,
      status: "completed",
      createdAt: { $gte: startDate, $lte: now },
    });

    // Calculate metrics
    const totalJobs = completedBookings.length;
    const totalRevenue = completedBookings.reduce(
      (sum, booking) => sum + booking.totalAmount,
      0
    );
    const averageJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;

    // Get ratings (if available)
    const averageRating =
      completedBookings.reduce((sum, booking) => {
        return sum + (booking.rating || 0);
      }, 0) / totalJobs;

    return {
      period,
      totalJobs,
      totalRevenue,
      averageJobValue,
      averageRating: isNaN(averageRating) ? 0 : averageRating,
      completionRate: totalJobs > 0 ? 100 : 0, // Simplified for now
    };
  }
}
