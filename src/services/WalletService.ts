import { IWallet, IWalletTransaction, IUser } from "../types";
import { Wallet } from "../models/Wallet";
import { WalletTransaction } from "../models/WalletTransaction";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

export interface WalletStats {
  totalBalance: number;
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  totalWithdrawals: number;
  totalFees: number;
}

export class WalletService {
  // Create or get user wallet
  async getOrCreateWallet(userId: string): Promise<IWallet> {
    let wallet = await Wallet["findByUser"](userId);
    
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0,
        currency: "GHS",
        isActive: true,
        lastTransactionAt: new Date(),
      });
      await wallet.save();
    }
    
    return wallet;
  }

  // Get wallet balance
  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await Wallet["findByUser"](userId);
    return wallet ? wallet.balance : 0;
  }

  // Add funds to wallet
  async addFunds(
    userId: string,
    amount: number,
    description: string,
    metadata?: any
  ): Promise<IWalletTransaction> {
    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = wallet.balance;
    
    // Add funds to wallet
    await wallet["addFunds"](amount);
    
    // Create transaction record
    const transaction = new WalletTransaction({
      walletId: wallet._id,
      userId,
      type: "credit",
      amount,
      currency: wallet.currency,
      description,
      reference: this.generateReference(),
      status: "completed",
      metadata,
      balanceBefore,
      balanceAfter: wallet.balance,
      processedAt: new Date(),
    });
    
    await transaction.save();
    return transaction;
  }

  // Deduct funds from wallet
  async deductFunds(
    userId: string,
    amount: number,
    description: string,
    metadata?: any
  ): Promise<IWalletTransaction> {
    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = wallet.balance;
    
    // Deduct funds from wallet
    await wallet["deductFunds"](amount);
    
    // Create transaction record
    const transaction = new WalletTransaction({
      walletId: wallet._id,
      userId,
      type: "debit",
      amount,
      currency: wallet.currency,
      description,
      reference: this.generateReference(),
      status: "completed",
      metadata,
      balanceBefore,
      balanceAfter: wallet.balance,
      processedAt: new Date(),
    });
    
    await transaction.save();
    return transaction;
  }

  // Hold funds (escrow for bookings)
  async holdFunds(
    userId: string,
    amount: number,
    description: string,
    metadata?: any
  ): Promise<IWalletTransaction> {
    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = wallet.balance;
    
    // Hold funds in wallet
    await wallet["holdFunds"](amount);
    
    // Create transaction record
    const transaction = new WalletTransaction({
      walletId: wallet._id,
      userId,
      type: "hold",
      amount,
      currency: wallet.currency,
      description,
      reference: this.generateReference(),
      status: "completed",
      metadata,
      balanceBefore,
      balanceAfter: wallet.balance,
      processedAt: new Date(),
    });
    
    await transaction.save();
    return transaction;
  }

  // Release held funds
  async releaseFunds(
    userId: string,
    amount: number,
    description: string,
    metadata?: any
  ): Promise<IWalletTransaction> {
    const wallet = await this.getOrCreateWallet(userId);
    const balanceBefore = wallet.balance;
    
    // Release funds back to wallet
    await wallet["releaseFunds"](amount);
    
    // Create transaction record
    const transaction = new WalletTransaction({
      walletId: wallet._id,
      userId,
      type: "release",
      amount,
      currency: wallet.currency,
      description,
      reference: this.generateReference(),
      status: "completed",
      metadata,
      balanceBefore,
      balanceAfter: wallet.balance,
      processedAt: new Date(),
    });
    
    await transaction.save();
    return transaction;
  }

  // Process booking payment with escrow
  async processBookingPayment(
    userId: string,
    amount: number,
    bookingId: string,
    paymentMethod: string,
    transactionId: string
  ): Promise<IWalletTransaction> {
    // Hold funds in escrow
    const transaction = await this.holdFunds(
      userId,
      amount,
      `Payment held for booking ${bookingId}`,
      {
        bookingId,
        paymentMethod,
        transactionId,
        type: "booking_payment",
      }
    );
    
    return transaction;
  }

  // Release payment to provider after job completion
  async releasePaymentToProvider(
    providerId: string,
    amount: number,
    bookingId: string,
    platformFee: number = 0
  ): Promise<IWalletTransaction> {
    const netAmount = amount - platformFee;
    
    // Add funds to provider wallet
    const transaction = await this.addFunds(
      providerId,
      netAmount,
      `Payment received for completed booking ${bookingId}`,
      {
        bookingId,
        platformFee,
        netAmount,
        type: "provider_payment",
      }
    );
    
    return transaction;
  }

  // Get wallet transactions
  async getWalletTransactions(
    userId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<{ transactions: IWalletTransaction[]; total: number }> {
    const [transactions, total] = await Promise.all([
      WalletTransaction["findByUser"](userId, limit, skip),
      WalletTransaction.countDocuments({ userId }),
    ]);
    
    return { transactions, total };
  }

  // Get wallet statistics
  async getWalletStats(userId: string): Promise<WalletStats> {
    const transactions = await WalletTransaction["findByUser"](userId, 1000, 0);
    
    const stats: WalletStats = {
      totalBalance: await this.getWalletBalance(userId),
      totalTransactions: transactions.length,
      totalCredits: 0,
      totalDebits: 0,
      totalWithdrawals: 0,
      totalFees: 0,
    };
    
    transactions.forEach((tx: IWalletTransaction) => {
      if (tx.type === "credit") {
        stats.totalCredits += tx.amount;
      } else if (tx.type === "debit") {
        stats.totalDebits += tx.amount;
      } else if (tx.type === "withdrawal") {
        stats.totalWithdrawals += tx.amount;
      }
      
      if (tx.metadata?.platformFee) {
        stats.totalFees += tx.metadata.platformFee;
      }
    });
    
    return stats;
  }

  // Get all wallets (admin only)
  async getAllWallets(
    limit: number = 50,
    skip: number = 0
  ): Promise<{ wallets: IWallet[]; total: number }> {
    const [wallets, total] = await Promise.all([
      Wallet["findActiveWallets"]().skip(skip).limit(limit),
      Wallet.countDocuments({ isActive: true }),
    ]);
    
    return { wallets, total };
  }

  // Get wallet by user ID
  async getWalletByUserId(userId: string): Promise<IWallet | null> {
    return await Wallet["findByUser"](userId);
  }

  // Generate unique reference
  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `WAL_${timestamp}_${random}`.toUpperCase();
  }
} 