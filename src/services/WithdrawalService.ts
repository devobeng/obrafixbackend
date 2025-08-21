import { IWithdrawalRequest, IWallet, IUser } from "../types";
import { WithdrawalRequest } from "../models/WithdrawalRequest";
import { Wallet } from "../models/Wallet";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { WalletService } from "./WalletService";

export interface WithdrawalStats {
  totalWithdrawals: number;
  totalAmount: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  failedWithdrawals: number;
  totalFees: number;
}

export class WithdrawalService {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  // Create withdrawal request
  async createWithdrawalRequest(
    userId: string,
    amount: number,
    withdrawalMethod: "bank_transfer" | "mobile_money",
    withdrawalDetails: any
  ): Promise<IWithdrawalRequest> {
    // Validate user is a provider
    const user = await User.findById(userId);
    if (!user || user.role !== "provider") {
      throw new AppError("Only providers can request withdrawals", 403);
    }

    // Check wallet balance
    const wallet = await this.walletService.getWalletByUserId(userId);
    if (!wallet || wallet.balance < amount) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    // Calculate platform fee (5% for demo)
    const platformFee = amount * 0.05;
    const netAmount = amount - platformFee;

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      userId,
      walletId: wallet._id,
      amount,
      currency: wallet.currency,
      withdrawalMethod,
      withdrawalDetails,
      platformFee,
      netAmount,
      reference: this.generateReference(),
      status: "pending",
    });

    await withdrawalRequest.save();
    return withdrawalRequest;
  }

  // Process withdrawal request (admin only)
  async processWithdrawalRequest(
    withdrawalId: string,
    adminId: string,
    action: "approve" | "reject",
    notes?: string
  ): Promise<IWithdrawalRequest> {
    const withdrawal = await WithdrawalRequest.findById(withdrawalId);
    if (!withdrawal) {
      throw new AppError("Withdrawal request not found", 404);
    }

    if (withdrawal.status !== "pending") {
      throw new AppError("Withdrawal request is not pending", 400);
    }

    if (action === "approve") {
      // Mark as processing
      await withdrawal["markAsProcessing"]();
      
      // Simulate processing (in real app, this would integrate with payment gateways)
      const isSuccessful = Math.random() > 0.1; // 90% success rate for demo
      
      if (isSuccessful) {
        // Deduct funds from wallet
        await this.walletService.deductFunds(
          withdrawal.userId.toString(),
          withdrawal.amount,
          `Withdrawal processed: ${withdrawal.reference}`,
          {
            withdrawalId: withdrawal._id,
            withdrawalMethod: withdrawal.withdrawalMethod,
            platformFee: withdrawal.platformFee,
            netAmount: withdrawal.netAmount,
          }
        );

        // Mark as completed
        await withdrawal["markAsCompleted"](adminId);
      } else {
        // Mark as failed
        await withdrawal["markAsFailed"]("Processing failed", adminId);
      }
    } else {
      // Mark as failed
      await withdrawal["markAsFailed"]("Rejected by admin", adminId);
    }

    if (notes) {
      withdrawal.adminNotes = notes;
      await withdrawal.save();
    }

    return withdrawal;
  }

  // Get withdrawal requests by user
  async getWithdrawalRequestsByUser(
    userId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ requests: IWithdrawalRequest[]; total: number }> {
    const [requests, total] = await Promise.all([
      WithdrawalRequest["findByUser"](userId, limit, skip),
      WithdrawalRequest.countDocuments({ userId }),
    ]);

    return { requests, total };
  }

  // Get withdrawal requests by status (admin only)
  async getWithdrawalRequestsByStatus(
    status: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ requests: IWithdrawalRequest[]; total: number }> {
    const [requests, total] = await Promise.all([
      WithdrawalRequest["findByStatus"](status).skip(skip).limit(limit),
      WithdrawalRequest.countDocuments({ status }),
    ]);

    return { requests, total };
  }

  // Get pending withdrawal requests (admin only)
  async getPendingWithdrawalRequests(): Promise<IWithdrawalRequest[]> {
    return await WithdrawalRequest["findPendingRequests"]();
  }

  // Get withdrawal statistics
  async getWithdrawalStats(userId?: string): Promise<WithdrawalStats> {
    const query: any = {};
    if (userId) query.userId = userId;

    const [
      totalWithdrawals,
      totalAmount,
      pendingWithdrawals,
      completedWithdrawals,
      failedWithdrawals,
      totalFees,
    ] = await Promise.all([
      WithdrawalRequest.countDocuments(query),
      WithdrawalRequest.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).then((result: any[]) => result[0]?.total || 0),
      WithdrawalRequest.countDocuments({ ...query, status: "pending" }),
      WithdrawalRequest.countDocuments({ ...query, status: "completed" }),
      WithdrawalRequest.countDocuments({ ...query, status: "failed" }),
      WithdrawalRequest.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$platformFee" } } },
      ]).then((result: any[]) => result[0]?.total || 0),
    ]);

    return {
      totalWithdrawals,
      totalAmount,
      pendingWithdrawals,
      completedWithdrawals,
      failedWithdrawals,
      totalFees,
    };
  }

  // Cancel withdrawal request
  async cancelWithdrawalRequest(
    withdrawalId: string,
    userId: string
  ): Promise<IWithdrawalRequest> {
    const withdrawal = await WithdrawalRequest.findById(withdrawalId);
    if (!withdrawal) {
      throw new AppError("Withdrawal request not found", 404);
    }

    if (withdrawal.userId.toString() !== userId) {
      throw new AppError("Access denied", 403);
    }

    if (withdrawal.status !== "pending") {
      throw new AppError("Cannot cancel non-pending withdrawal request", 400);
    }

    await withdrawal["cancel"]();
    return withdrawal;
  }

  // Get withdrawal request by ID
  async getWithdrawalRequestById(
    withdrawalId: string,
    userId?: string
  ): Promise<IWithdrawalRequest> {
    const withdrawal = await WithdrawalRequest.findById(withdrawalId);
    if (!withdrawal) {
      throw new AppError("Withdrawal request not found", 404);
    }

    // Check access (user can only see their own, admin can see all)
    if (userId && withdrawal.userId.toString() !== userId) {
      const user = await User.findById(userId);
      if (!user || user.role !== "admin") {
        throw new AppError("Access denied", 403);
      }
    }

    return withdrawal;
  }

  // Generate unique reference
  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `WDR_${timestamp}_${random}`.toUpperCase();
  }
} 