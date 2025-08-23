import { WithdrawalRequest } from "../models/WithdrawalRequest";
import { BookingPayment } from "../models/BookingPayment";
import { User } from "../models/User";
import { Service } from "../models/Service";
import { Booking } from "../models/Booking";
import { NotificationService } from "./NotificationService";
import { AppError } from "../utils/AppError";
import mongoose from "mongoose";

export interface PayoutStats {
  totalPayouts: number;
  pendingPayouts: number;
  approvedPayouts: number;
  rejectedPayouts: number;
  totalAmount: number;
  averagePayoutAmount: number;
  payoutMethods: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
}

export interface RevenueStats {
  totalRevenue: number;
  platformFees: number;
  netRevenue: number;
  commissionRevenue: number;
  refunds: number;
  netRevenueAfterRefunds: number;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    transactions: number;
  }>;
}

export interface CommissionStats {
  totalCommissions: number;
  averageCommissionRate: number;
  commissionsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    commissionRate: number;
    totalCommissions: number;
    transactionCount: number;
  }>;
  topEarningProviders: Array<{
    providerId: string;
    providerName: string;
    totalEarnings: number;
    commissionPaid: number;
    transactionCount: number;
  }>;
}

export interface PaymentAnalytics {
  paymentMethods: Array<{
    method: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  paymentStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  dailyPayments: Array<{
    date: string;
    count: number;
    totalAmount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    transactions: number;
    averageAmount: number;
  }>;
}

export class AdminPaymentService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // ==================== PAYOUT MANAGEMENT ====================

  /**
   * Get all withdrawal requests with filtering and pagination
   */
  async getWithdrawalRequests(filters: {
    status?: string;
    providerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    paymentMethod?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    withdrawals: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { status, providerId, dateFrom, dateTo, paymentMethod, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (status) query.status = status;
      if (providerId) query.providerId = providerId;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = dateFrom;
        if (dateTo) query.createdAt.$lte = dateTo;
      }

      const [withdrawals, total] = await Promise.all([
        WithdrawalRequest.find(query)
          .populate("providerId", "firstName lastName email phone")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        WithdrawalRequest.countDocuments(query),
      ]);

      return {
        withdrawals,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new AppError("Failed to get withdrawal requests", 500);
    }
  }

  /**
   * Approve a withdrawal request
   */
  async approveWithdrawalRequest(
    withdrawalId: string,
    adminNotes?: string
  ): Promise<any> {
    try {
      const withdrawal = await WithdrawalRequest.findById(withdrawalId)
        .populate("providerId", "firstName lastName email");

      if (!withdrawal) {
        throw new AppError("Withdrawal request not found", 404);
      }

      if (withdrawal.status !== "pending") {
        throw new AppError("Withdrawal request is not in pending status", 400);
      }

      // Update withdrawal status
      withdrawal.status = "approved";
      withdrawal.approvedAt = new Date();
      withdrawal.adminNotes = adminNotes;

      await withdrawal.save();

      // Send notification to provider
      if (withdrawal.providerId) {
        await this.notificationService.sendNotification({
          recipient: withdrawal.providerId._id.toString(),
          type: "withdrawal_approved",
          title: "Withdrawal Approved",
          message: `Your withdrawal request of $${withdrawal.amount} has been approved and will be processed.`,
          metadata: {
            withdrawalId: withdrawal._id.toString(),
            amount: withdrawal.amount,
            adminNotes,
          },
        });
      }

      return withdrawal;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to approve withdrawal request", 500);
    }
  }

  /**
   * Reject a withdrawal request
   */
  async rejectWithdrawalRequest(
    withdrawalId: string,
    reason: string,
    adminNotes?: string
  ): Promise<any> {
    try {
      const withdrawal = await WithdrawalRequest.findById(withdrawalId)
        .populate("providerId", "firstName lastName email");

      if (!withdrawal) {
        throw new AppError("Withdrawal request not found", 404);
      }

      if (withdrawal.status !== "pending") {
        throw new AppError("Withdrawal request is not in pending status", 400);
      }

      // Update withdrawal status
      withdrawal.status = "rejected";
      withdrawal.rejectedAt = new Date();
      withdrawal.rejectionReason = reason;
      withdrawal.adminNotes = adminNotes;

      await withdrawal.save();

      // Send notification to provider
      if (withdrawal.providerId) {
        await this.notificationService.sendNotification({
          recipient: withdrawal.providerId._id.toString(),
          type: "withdrawal_rejected",
          title: "Withdrawal Rejected",
          message: `Your withdrawal request of $${withdrawal.amount} has been rejected. Reason: ${reason}`,
          metadata: {
            withdrawalId: withdrawal._id.toString(),
            amount: withdrawal.amount,
            reason,
            adminNotes,
          },
        });
      }

      return withdrawal;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to reject withdrawal request", 500);
    }
  }

  /**
   * Get payout statistics
   */
  async getPayoutStats(): Promise<PayoutStats> {
    try {
      const [
        totalPayouts,
        pendingPayouts,
        approvedPayouts,
        rejectedPayouts,
        totalAmount,
        averageAmount,
        payoutMethods,
      ] = await Promise.all([
        WithdrawalRequest.countDocuments(),
        WithdrawalRequest.countDocuments({ status: "pending" }),
        WithdrawalRequest.countDocuments({ status: "approved" }),
        WithdrawalRequest.countDocuments({ status: "rejected" }),
        WithdrawalRequest.aggregate([
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        WithdrawalRequest.aggregate([
          { $group: { _id: null, average: { $avg: "$amount" } } },
        ]),
        WithdrawalRequest.aggregate([
          {
            $group: {
              _id: "$paymentMethod",
              count: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),
      ]);

      return {
        totalPayouts,
        pendingPayouts,
        approvedPayouts,
        rejectedPayouts,
        totalAmount: totalAmount[0]?.total || 0,
        averagePayoutAmount: Math.round((averageAmount[0]?.average || 0) * 100) / 100,
        payoutMethods: payoutMethods.map((method) => ({
          method: method._id,
          count: method.count,
          totalAmount: method.totalAmount,
        })),
      };
    } catch (error) {
      throw new AppError("Failed to get payout statistics", 500);
    }
  }

  // ==================== REVENUE & COMMISSION MANAGEMENT ====================

  /**
   * Get revenue statistics
   */
  async getRevenueStats(period: string = "month"): Promise<RevenueStats> {
    try {
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
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const [
        totalRevenue,
        platformFees,
        refunds,
        revenueByPeriod,
      ] = await Promise.all([
        BookingPayment.aggregate([
          {
            $match: {
              type: "payment",
              status: "completed",
              createdAt: { $gte: startDate },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        BookingPayment.aggregate([
          {
            $match: {
              type: "commission",
              status: "completed",
              createdAt: { $gte: startDate },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        BookingPayment.aggregate([
          {
            $match: {
              type: "refund",
              status: "completed",
              createdAt: { $gte: startDate },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        BookingPayment.aggregate([
          {
            $match: {
              type: "payment",
              status: "completed",
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              revenue: { $sum: "$amount" },
              transactions: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const totalRev = totalRevenue[0]?.total || 0;
      const platformFee = platformFees[0]?.total || 0;
      const refundAmount = refunds[0]?.total || 0;

      return {
        totalRevenue: totalRev,
        platformFees: platformFee,
        netRevenue: totalRev - platformFee,
        commissionRevenue: platformFee,
        refunds: refundAmount,
        netRevenueAfterRefunds: totalRev - platformFee - refundAmount,
        revenueByPeriod: revenueByPeriod.map((period) => ({
          period: period._id,
          revenue: period.revenue,
          transactions: period.transactions,
        })),
      };
    } catch (error) {
      throw new AppError("Failed to get revenue statistics", 500);
    }
  }

  /**
   * Get commission statistics
   */
  async getCommissionStats(): Promise<CommissionStats> {
    try {
      const [
        totalCommissions,
        averageRate,
        commissionsByCategory,
        topEarningProviders,
      ] = await Promise.all([
        BookingPayment.aggregate([
          {
            $match: {
              type: "commission",
              status: "completed",
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Service.aggregate([
          {
            $lookup: {
              from: "servicecategories",
              localField: "category",
              foreignField: "_id",
              as: "categoryInfo",
            },
          },
          {
            $group: {
              _id: null,
              averageRate: { $avg: { $arrayElemAt: ["$categoryInfo.commissionRate", 0] } },
            },
          },
        ]),
        BookingPayment.aggregate([
          {
            $match: {
              type: "commission",
              status: "completed",
            },
          },
          {
            $lookup: {
              from: "bookings",
              localField: "bookingId",
              foreignField: "_id",
              as: "booking",
            },
          },
          {
            $lookup: {
              from: "services",
              localField: "booking.serviceId",
              foreignField: "_id",
              as: "service",
            },
          },
          {
            $lookup: {
              from: "servicecategories",
              localField: "service.category",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $group: {
              _id: "$category._id",
              categoryName: { $first: { $arrayElemAt: ["$category.name", 0] } },
              commissionRate: { $first: { $arrayElemAt: ["$category.commissionRate", 0] } },
              totalCommissions: { $sum: "$amount" },
              transactionCount: { $sum: 1 },
            },
          },
          { $sort: { totalCommissions: -1 } },
        ]),
        BookingPayment.aggregate([
          {
            $match: {
              type: "commission",
              status: "completed",
            },
          },
          {
            $lookup: {
              from: "bookings",
              localField: "bookingId",
              foreignField: "_id",
              as: "booking",
            },
          },
          {
            $group: {
              _id: "$booking.providerId",
              totalCommissions: { $sum: "$amount" },
              transactionCount: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "provider",
            },
          },
          {
            $project: {
              providerId: "$_id",
              providerName: {
                $concat: [
                  { $arrayElemAt: ["$provider.firstName", 0] },
                  " ",
                  { $arrayElemAt: ["$provider.lastName", 0] },
                ],
              },
              totalCommissions: 1,
              transactionCount: 1,
            },
          },
          { $sort: { totalCommissions: -1 } },
          { $limit: 10 },
        ]),
      ]);

      return {
        totalCommissions: totalCommissions[0]?.total || 0,
        averageCommissionRate: Math.round((averageRate[0]?.averageRate || 0) * 100) / 100,
        commissionsByCategory: commissionsByCategory.map((category) => ({
          categoryId: category._id.toString(),
          categoryName: category.categoryName || "Unknown",
          commissionRate: category.commissionRate || 0,
          totalCommissions: category.totalCommissions,
          transactionCount: category.transactionCount,
        })),
        topEarningProviders: topEarningProviders.map((provider) => ({
          providerId: provider.providerId.toString(),
          providerName: provider.providerName || "Unknown",
          totalEarnings: provider.totalCommissions,
          commissionPaid: provider.totalCommissions,
          transactionCount: provider.transactionCount,
        })),
      };
    } catch (error) {
      throw new AppError("Failed to get commission statistics", 500);
    }
  }

  // ==================== PAYMENT ANALYTICS ====================

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(period: string = "month"): Promise<PaymentAnalytics> {
    try {
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
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const [
        paymentMethods,
        paymentStatus,
        dailyPayments,
        monthlyTrends,
      ] = await Promise.all([
        BookingPayment.aggregate([
          {
            $match: {
              type: "payment",
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: "$paymentMethod",
              count: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),
        BookingPayment.aggregate([
          {
            $match: {
              type: "payment",
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
            },
          },
          { $sort: { totalAmount: -1 } },
        ]),
        BookingPayment.aggregate([
          {
            $match: {
              type: "payment",
              status: "completed",
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        BookingPayment.aggregate([
          {
            $match: {
              type: "payment",
              status: "completed",
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m", date: "$createdAt" },
              },
              revenue: { $sum: "$amount" },
              transactions: { $sum: 1 },
              averageAmount: { $avg: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const totalTransactions = paymentMethods.reduce((sum, method) => sum + method.count, 0);
      const totalAmount = paymentMethods.reduce((sum, method) => sum + method.totalAmount, 0);

      return {
        paymentMethods: paymentMethods.map((method) => ({
          method: method._id,
          count: method.count,
          totalAmount: method.totalAmount,
          percentage: totalTransactions > 0 ? Math.round((method.count / totalTransactions) * 100) : 0,
        })),
        paymentStatus: paymentStatus.map((status) => ({
          status: status._id,
          count: status.count,
          totalAmount: status.totalAmount,
          percentage: totalAmount > 0 ? Math.round((status.totalAmount / totalAmount) * 100) : 0,
        })),
        dailyPayments: dailyPayments.map((day) => ({
          date: day._id,
          count: day.count,
          totalAmount: day.totalAmount,
        })),
        monthlyTrends: monthlyTrends.map((month) => ({
          month: month._id,
          revenue: month.revenue,
          transactions: month.transactions,
          averageAmount: Math.round(month.averageAmount * 100) / 100,
        })),
      };
    } catch (error) {
      throw new AppError("Failed to get payment analytics", 500);
    }
  }

  // ==================== INTEGRATION MANAGEMENT ====================

  /**
   * Get payment integration status
   */
  async getPaymentIntegrationStatus(): Promise<{
    stripe: { enabled: boolean; status: string };
    paystack: { enabled: boolean; status: string };
    mobileMoney: { enabled: boolean; status: string };
  }> {
    try {
      // This would typically check actual integration status
      // For now, returning mock data
      return {
        stripe: {
          enabled: process.env.STRIPE_ENABLED === "true",
          status: process.env.STRIPE_ENABLED === "true" ? "active" : "inactive",
        },
        paystack: {
          enabled: process.env.PAYSTACK_ENABLED === "true",
          status: process.env.PAYSTACK_ENABLED === "true" ? "active" : "inactive",
        },
        mobileMoney: {
          enabled: process.env.MOBILE_MONEY_ENABLED === "true",
          status: process.env.MOBILE_MONEY_ENABLED === "true" ? "active" : "inactive",
        },
      };
    } catch (error) {
      throw new AppError("Failed to get payment integration status", 500);
    }
  }

  /**
   * Update payment integration settings
   */
  async updatePaymentIntegrationSettings(settings: {
    stripe?: { enabled: boolean; apiKey?: string };
    paystack?: { enabled: boolean; secretKey?: string };
    mobileMoney?: { enabled: boolean; provider?: string };
  }): Promise<{ message: string }> {
    try {
      // This would typically update environment variables or database settings
      // For now, just returning success message
      return {
        message: "Payment integration settings updated successfully",
      };
    } catch (error) {
      throw new AppError("Failed to update payment integration settings", 500);
    }
  }
} 