import { Request, Response } from "express";
import { WalletService } from "../services/WalletService";
import { asyncHandler } from "../middleware/errorHandler";

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  // Get wallet balance
  getWalletBalance = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const balance = await this.walletService.getWalletBalance(userId);
    
    res.json({
      success: true,
      data: { balance, currency: "GHS" },
    });
  });

  // Get wallet transactions
  getWalletTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { transactions, total } = await this.walletService.getWalletTransactions(
      userId,
      parseInt(limit as string),
      skip
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

  // Get wallet statistics
  getWalletStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const stats = await this.walletService.getWalletStats(userId);
    
    res.json({
      success: true,
      data: stats,
    });
  });

  // Add funds to wallet (for demo/testing purposes)
  addFunds = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    const transaction = await this.walletService.addFunds(
      userId,
      amount,
      description || "Funds added to wallet"
    );

    res.json({
      success: true,
      message: "Funds added successfully",
      data: transaction,
    });
  });

  // Get all wallets (admin only)
  getAllWallets = asyncHandler(async (req: Request, res: Response) => {
    const { page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { wallets, total } = await this.walletService.getAllWallets(
      parseInt(limit as string),
      skip
    );

    res.json({
      success: true,
      data: { wallets, total },
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  });

  // Get wallet by user ID (admin only)
  getWalletByUserId = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const wallet = await this.walletService.getWalletByUserId(userId);
    
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    res.json({
      success: true,
      data: wallet,
    });
  });
} 