import { Request, Response } from "express";
import { PaymentGatewayService } from "../services/PaymentGatewayService";
import { WalletService } from "../services/WalletService";
import { asyncHandler } from "../middleware/errorHandler";

export class PaymentController {
  private paymentGatewayService: PaymentGatewayService;
  private walletService: WalletService;

  constructor() {
    // Initialize with demo configuration
    const config = {
      paystackSecretKey: process.env["PAYSTACK_SECRET_KEY"] || "demo_secret_key",
      paystackPublicKey: process.env["PAYSTACK_PUBLIC_KEY"] || "demo_public_key",
      mobileMoneyConfig: {
        mtn: {
          apiKey: process.env["MTN_API_KEY"] || "demo_mtn_key",
          merchantId: process.env["MTN_MERCHANT_ID"] || "demo_mtn_merchant",
        },
        vodafone: {
          apiKey: process.env["VODAFONE_API_KEY"] || "demo_vodafone_key",
          merchantId: process.env["VODAFONE_MERCHANT_ID"] || "demo_vodafone_merchant",
        },
        airtelTigo: {
          apiKey: process.env["AIRTELTIGO_API_KEY"] || "demo_airteltigo_key",
          merchantId: process.env["AIRTELTIGO_MERCHANT_ID"] || "demo_airteltigo_merchant",
        },
      },
    };

    this.paymentGatewayService = new PaymentGatewayService(config);
    this.walletService = new WalletService();
  }

  // Initialize Paystack payment
  initializePaystackPayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { amount, currency = "GHS", email, callbackUrl, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!callbackUrl) {
      return res.status(400).json({ success: false, message: "Callback URL is required" });
    }

    const reference = this.generateReference();
    
    const paymentRequest = {
      amount,
      currency,
      email,
      reference,
      callbackUrl,
      metadata: { ...metadata, userId },
    };

    const response = await this.paymentGatewayService.initializePaystackPayment(paymentRequest);

    res.json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        ...response,
        reference,
        amount,
        currency,
      },
    });
  });

  // Verify Paystack payment
  verifyPaystackPayment = asyncHandler(async (req: Request, res: Response) => {
    const { reference, transactionId } = req.body;
    
    if (!reference) {
      return res.status(400).json({ success: false, message: "Reference is required" });
    }

    const verifyRequest = { reference, transactionId };
    const response = await this.paymentGatewayService.verifyPaystackPayment(verifyRequest);

    if (response.success && response.status === "success") {
      // Add funds to user's wallet
      const userId = req.user?.id;
      if (userId) {
        await this.walletService.addFunds(
          userId,
          response.amount,
          `Payment received via Paystack: ${reference}`,
          {
            reference,
            transactionId,
            paymentMethod: "paystack",
            type: "external_payment",
          }
        );
      }
    }

    res.json({
      success: true,
      message: "Payment verification completed",
      data: response,
    });
  });

  // Process mobile money payment
  processMobileMoneyPayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { amount, currency = "GHS", email, phoneNumber, provider, callbackUrl, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    if (!provider || !["mtn", "vodafone", "airtelTigo"].includes(provider)) {
      return res.status(400).json({ success: false, message: "Valid mobile money provider is required" });
    }

    const reference = this.generateReference();
    
    const paymentRequest = {
      amount,
      currency,
      email: email || `${userId}@example.com`,
      reference,
      callbackUrl: callbackUrl || "https://example.com/callback",
      metadata: { ...metadata, userId, provider, phoneNumber },
    };

    const response = await this.paymentGatewayService.processMobileMoneyPayment(
      paymentRequest,
      provider,
      phoneNumber
    );

    if (response.success && response.status === "success") {
      // Add funds to user's wallet
      await this.walletService.addFunds(
        userId,
        amount,
        `Payment received via ${provider.toUpperCase()}: ${reference}`,
        {
          reference,
          transactionId: response.transactionId,
          paymentMethod: "mobile_money",
          provider,
          phoneNumber,
          type: "external_payment",
        }
      );
    }

    res.json({
      success: true,
      message: `Mobile money payment ${response.status}`,
      data: {
        ...response,
        reference,
        amount,
        currency,
        provider,
        phoneNumber,
      },
    });
  });

  // Process bank transfer
  processBankTransfer = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { amount, currency = "GHS", email, bankDetails, callbackUrl, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.accountName || !bankDetails.bankName) {
      return res.status(400).json({ success: false, message: "Complete bank details are required" });
    }

    const reference = this.generateReference();
    
    const paymentRequest = {
      amount,
      currency,
      email: email || `${userId}@example.com`,
      reference,
      callbackUrl: callbackUrl || "https://example.com/callback",
      metadata: { ...metadata, userId, bankDetails },
    };

    const response = await this.paymentGatewayService.processBankTransfer(
      paymentRequest,
      bankDetails
    );

    if (response.success && response.status === "pending") {
      // Add funds to user's wallet (pending until confirmed)
      await this.walletService.addFunds(
        userId,
        amount,
        `Bank transfer initiated: ${reference}`,
        {
          reference,
          transactionId: response.transactionId,
          paymentMethod: "bank_transfer",
          bankDetails,
          type: "external_payment",
          status: "pending",
        }
      );
    }

    res.json({
      success: true,
      message: "Bank transfer initiated",
      data: {
        ...response,
        reference,
        amount,
        currency,
        bankDetails,
      },
    });
  });

  // Process card payment
  processCardPayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { amount, currency = "GHS", email, cardDetails, callbackUrl, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!cardDetails || !cardDetails.cardNumber || !cardDetails.expiryMonth || 
        !cardDetails.expiryYear || !cardDetails.cvv) {
      return res.status(400).json({ success: false, message: "Complete card details are required" });
    }

    const reference = this.generateReference();
    
    const paymentRequest = {
      amount,
      currency,
      email: email || `${userId}@example.com`,
      reference,
      callbackUrl: callbackUrl || "https://example.com/callback",
      metadata: { ...metadata, userId },
    };

    const response = await this.paymentGatewayService.processCardPayment(
      paymentRequest,
      cardDetails
    );

    if (response.success && response.status === "success") {
      // Add funds to user's wallet
      await this.walletService.addFunds(
        userId,
        amount,
        `Payment received via card: ${reference}`,
        {
          reference,
          transactionId: response.transactionId,
          paymentMethod: "card",
          type: "external_payment",
        }
      );
    }

    res.json({
      success: true,
      message: "Card payment processed",
      data: {
        ...response,
        reference,
        amount,
        currency,
      },
    });
  });

  // Process booking payment with escrow
  processBookingPayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const { amount, bookingId, paymentMethod, paymentDetails } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    if (!paymentMethod || !["mobile_money", "bank_transfer", "cash", "wallet"].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Valid payment method is required" });
    }

    let transaction;
    
    if (paymentMethod === "wallet") {
      // Use wallet balance
      transaction = await this.walletService.processBookingPayment(
        userId,
        amount,
        bookingId,
        paymentMethod,
        "wallet_payment"
      );
    } else {
      // External payment method
      const reference = this.generateReference();
      
      if (paymentMethod === "mobile_money") {
        const { provider, phoneNumber } = paymentDetails;
        if (!provider || !phoneNumber) {
          return res.status(400).json({ success: false, message: "Provider and phone number required for mobile money" });
        }
        
        transaction = await this.paymentGatewayService.processMobileMoneyPayment(
          { amount, currency: "GHS", email: `${userId}@example.com`, reference, callbackUrl: "https://example.com/callback" },
          provider,
          phoneNumber
        );
      } else if (paymentMethod === "bank_transfer") {
        const { accountNumber, accountName, bankName } = paymentDetails;
        if (!accountNumber || !accountName || !bankName) {
          return res.status(400).json({ success: false, message: "Complete bank details required" });
        }
        
        transaction = await this.paymentGatewayService.processBankTransfer(
          { amount, currency: "GHS", email: `${userId}@example.com`, reference, callbackUrl: "https://example.com/callback" },
          { accountNumber, accountName, bankName }
        );
      } else {
        // Cash payment
        transaction = {
          success: true,
          transactionId: `CASH_${reference}`,
          message: "Cash payment confirmed",
          status: "success" as const,
        };
      }

      if (transaction.success && transaction.status === "success") {
        // Hold funds in escrow
        await this.walletService.processBookingPayment(
          userId,
          amount,
          bookingId,
          paymentMethod,
          transaction.transactionId
        );
      }
    }

    res.json({
      success: true,
      message: "Booking payment processed successfully",
      data: {
        transaction,
        bookingId,
        amount,
        paymentMethod,
      },
    });
  });

  // Refund payment
  refundPayment = asyncHandler(async (req: Request, res: Response) => {
    const { transactionId, amount, reason } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ success: false, message: "Transaction ID is required" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: "Refund reason is required" });
    }

    const response = await this.paymentGatewayService.refundPayment(
      transactionId,
      amount,
      reason
    );

    res.json({
      success: true,
      message: "Refund processed",
      data: response,
    });
  });

  // Generate unique reference
  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `PAY_${timestamp}_${random}`.toUpperCase();
  }
}
