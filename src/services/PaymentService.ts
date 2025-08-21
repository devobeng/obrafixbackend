import { IBookingPayment } from "../types";
import { BookingPayment } from "../models/BookingPayment";
import { Booking } from "../models/Booking";
import { AppError } from "../utils/AppError";

export interface PaymentDetails {
  mobileMoneyProvider?: "mtn" | "vodafone" | "airtelTigo";
  phoneNumber?: string;
  bankAccount?: string;
  bankName?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: "pending" | "authorized" | "paid" | "failed" | "refunded";
  message: string;
}

export class PaymentService {
  // Process payment for a booking
  async processPayment(
    bookingId: string,
    amount: number,
    paymentMethod: "mobile_money" | "bank_transfer" | "cash",
    paymentDetails?: PaymentDetails
  ): Promise<PaymentResult> {
    // Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Validate amount matches booking total
    if (amount !== booking.pricing.totalAmount) {
      throw new AppError("Payment amount does not match booking total", 400);
    }

    // Validate payment method
    if (booking.pricing.paymentMethod !== paymentMethod) {
      throw new AppError(
        "Payment method does not match booking payment method",
        400
      );
    }

    // Generate transaction ID
    const transactionId = this.generateTransactionId();

    // Create payment record
    const payment = new BookingPayment({
      bookingId,
      amount,
      currency: "GHS",
      paymentMethod,
      status: "pending",
      transactionId,
      paymentDetails,
    });

    await payment.save();

    // Process payment based on method
    let paymentResult: PaymentResult;

    switch (paymentMethod) {
      case "mobile_money":
        paymentResult = await this.processMobileMoneyPayment(
          payment,
          paymentDetails
        );
        break;
      case "bank_transfer":
        paymentResult = await this.processBankTransferPayment(
          payment,
          paymentDetails
        );
        break;
      case "cash":
        paymentResult = await this.processCashPayment(payment);
        break;
      default:
        throw new AppError("Invalid payment method", 400);
    }

    // Update payment record
    payment.status = paymentResult.status;
    if (paymentResult.status === "paid") {
      payment.paidAt = new Date();
    }
    await payment.save();

    // Update booking payment status
    booking.payment.status = paymentResult.status;
    booking.payment.transactionId = transactionId;
    if (paymentResult.status === "paid") {
      booking.payment.paidAt = new Date();
    }
    await booking.save();

    return paymentResult;
  }

  // Process mobile money payment
  private async processMobileMoneyPayment(
    payment: IBookingPayment,
    paymentDetails?: PaymentDetails
  ): Promise<PaymentResult> {
    if (!paymentDetails?.phoneNumber || !paymentDetails?.mobileMoneyProvider) {
      throw new AppError("Mobile money details are required", 400);
    }

    // Simulate mobile money payment processing
    // In a real application, this would integrate with mobile money APIs
    const isSuccessful = Math.random() > 0.1; // 90% success rate for demo

    if (isSuccessful) {
      return {
        success: true,
        transactionId: payment.transactionId || "",
        status: "paid",
        message: `Payment successful via ${paymentDetails.mobileMoneyProvider}`,
      };
    } else {
      return {
        success: false,
        transactionId: payment.transactionId || "",
        status: "failed",
        message: "Mobile money payment failed",
      };
    }
  }

  // Process bank transfer payment
  private async processBankTransferPayment(
    payment: IBookingPayment,
    paymentDetails?: PaymentDetails
  ): Promise<PaymentResult> {
    if (!paymentDetails?.bankAccount || !paymentDetails?.bankName) {
      throw new AppError("Bank account details are required", 400);
    }

    // Simulate bank transfer processing
    // In a real application, this would integrate with banking APIs
    const isSuccessful = Math.random() > 0.05; // 95% success rate for demo

    if (isSuccessful) {
      return {
        success: true,
        transactionId: payment.transactionId || "",
        status: "authorized",
        message: "Bank transfer authorized",
      };
    } else {
      return {
        success: false,
        transactionId: payment.transactionId || "",
        status: "failed",
        message: "Bank transfer failed",
      };
    }
  }

  // Process cash payment
  private async processCashPayment(
    payment: IBookingPayment
  ): Promise<PaymentResult> {
    // Cash payments are always successful (marked as pending until confirmed)
    return {
      success: true,
      transactionId: payment.transactionId || "",
      status: "pending",
      message: "Cash payment pending confirmation",
    };
  }

  // Confirm cash payment
  async confirmCashPayment(bookingId: string): Promise<PaymentResult> {
    const payment = await BookingPayment.findOne({ bookingId });
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.paymentMethod !== "cash") {
      throw new AppError("Payment is not a cash payment", 400);
    }

    if (payment.status !== "pending") {
      throw new AppError("Payment is not pending", 400);
    }

    // Mark payment as paid
    payment.status = "paid";
    payment.paidAt = new Date();
    await payment.save();

    // Update booking payment status
    const booking = await Booking.findById(bookingId);
    if (booking) {
      booking.payment.status = "paid";
      booking.payment.paidAt = new Date();
      await booking.save();
    }

    return {
      success: true,
      transactionId: payment.transactionId || "",
      status: "paid",
      message: "Cash payment confirmed",
    };
  }

  // Process refund
  async processRefund(
    bookingId: string,
    refundAmount: number,
    reason: string
  ): Promise<PaymentResult> {
    const payment = await BookingPayment.findOne({ bookingId });
    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== "paid") {
      throw new AppError("Payment has not been made", 400);
    }

    if (refundAmount > payment.amount) {
      throw new AppError("Refund amount cannot exceed payment amount", 400);
    }

    // Process refund based on payment method
    let refundResult: PaymentResult;

    switch (payment.paymentMethod) {
      case "mobile_money":
        refundResult = await this.processMobileMoneyRefund(
          payment,
          refundAmount
        );
        break;
      case "bank_transfer":
        refundResult = await this.processBankTransferRefund(
          payment,
          refundAmount
        );
        break;
      case "cash":
        refundResult = await this.processCashRefund(payment, refundAmount);
        break;
      default:
        throw new AppError("Invalid payment method", 400);
    }

    if (refundResult.success) {
      // Update payment record
      payment.status = "refunded";
      payment.refundedAt = new Date();
      payment.refundReason = reason;
      await payment.save();

      // Update booking payment status
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.payment.status = "refunded";
        booking.payment.refundedAt = new Date();
        booking.payment.refundReason = reason;
        await booking.save();
      }
    }

    return refundResult;
  }

  // Process mobile money refund
  private async processMobileMoneyRefund(
    payment: IBookingPayment,
    _refundAmount: number
  ): Promise<PaymentResult> {
    // Simulate mobile money refund processing
    const isSuccessful = Math.random() > 0.1; // 90% success rate for demo

    if (isSuccessful) {
      return {
        success: true,
        transactionId: payment.transactionId || "",
        status: "refunded",
        message: "Mobile money refund processed successfully",
      };
    } else {
      return {
        success: false,
        transactionId: payment.transactionId || "",
        status: "failed",
        message: "Mobile money refund failed",
      };
    }
  }

  // Process bank transfer refund
  private async processBankTransferRefund(
    payment: IBookingPayment,
    _refundAmount: number
  ): Promise<PaymentResult> {
    // Simulate bank transfer refund processing
    const isSuccessful = Math.random() > 0.05; // 95% success rate for demo

    if (isSuccessful) {
      return {
        success: true,
        transactionId: payment.transactionId || "",
        status: "refunded",
        message: "Bank transfer refund processed successfully",
      };
    } else {
      return {
        success: false,
        transactionId: payment.transactionId || "",
        status: "failed",
        message: "Bank transfer refund failed",
      };
    }
  }

  // Process cash refund
  private async processCashRefund(
    payment: IBookingPayment,
    _refundAmount: number
  ): Promise<PaymentResult> {
    // Cash refunds are always successful (marked as pending until confirmed)
    return {
      success: true,
      transactionId: payment.transactionId || "",
      status: "refunded",
      message: "Cash refund pending confirmation",
    };
  }

  // Get payment by transaction ID
  async getPaymentByTransactionId(
    transactionId: string
  ): Promise<IBookingPayment | null> {
    return await BookingPayment.findOne({ transactionId }).populate(
      "bookingId"
    );
  }

  // Get payment by booking ID
  async getPaymentByBookingId(
    bookingId: string
  ): Promise<IBookingPayment | null> {
    return await BookingPayment.findOne({ bookingId });
  }

  // Get payment statistics
  async getPaymentStats(): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
  }> {
    const [
      totalPayments,
      totalAmount,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
    ] = await Promise.all([
      BookingPayment.countDocuments(),
      BookingPayment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).then((result: any[]) => result[0]?.total || 0),
      BookingPayment.countDocuments({ status: "paid" }),
      BookingPayment.countDocuments({ status: "failed" }),
      BookingPayment.countDocuments({ status: "pending" }),
      BookingPayment.countDocuments({ status: "refunded" }),
    ]);

    return {
      totalPayments,
      totalAmount,
      successfulPayments,
      failedPayments,
      pendingPayments,
      refundedPayments,
    };
  }

  // Generate unique transaction ID
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TXN_${timestamp}_${random}`.toUpperCase();
  }

  // Get all withdrawal requests (admin only)
  async getAllWithdrawalRequests(
    page: number,
    limit: number,
    filters: any = {},
    sort: any = { createdAt: -1 }
  ): Promise<{ withdrawals: any[]; total: number }> {
    try {
      const { WithdrawalRequest } = await import("../models/WithdrawalRequest");

      const skip = (page - 1) * limit;
      const query: any = {};

      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
        if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
      }

      const [withdrawals, total] = await Promise.all([
        WithdrawalRequest.find(query)
          .populate("provider", "firstName lastName email phone")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        WithdrawalRequest.countDocuments(query),
      ]);

      return { withdrawals, total };
    } catch (error) {
      throw new AppError("Failed to fetch withdrawal requests", 500);
    }
  }

  // Approve withdrawal request (admin only)
  async approveWithdrawalRequest(
    withdrawalId: string,
    adminNotes?: string
  ): Promise<any> {
    try {
      const { WithdrawalRequest } = await import("../models/WithdrawalRequest");

      const withdrawal = await WithdrawalRequest.findById(withdrawalId);
      if (!withdrawal) {
        return null;
      }

      if (withdrawal.status !== "pending") {
        throw new AppError("Withdrawal request is not pending", 400);
      }

      // Update withdrawal status
      withdrawal.status = "approved";
      withdrawal.approvedAt = new Date();
      withdrawal.adminNotes = adminNotes;

      // Process the actual withdrawal (this would integrate with payment gateway)
      // For now, we'll just mark it as approved
      const updatedWithdrawal = await withdrawal.save();

      return updatedWithdrawal.populate(
        "provider",
        "firstName lastName email phone"
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to approve withdrawal request", 500);
    }
  }

  // Reject withdrawal request (admin only)
  async rejectWithdrawalRequest(
    withdrawalId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<any> {
    try {
      const { WithdrawalRequest } = await import("../models/WithdrawalRequest");

      const withdrawal = await WithdrawalRequest.findById(withdrawalId);
      if (!withdrawal) {
        return null;
      }

      if (withdrawal.status !== "pending") {
        throw new AppError("Withdrawal request is not pending", 400);
      }

      // Update withdrawal status
      withdrawal.status = "rejected";
      withdrawal.rejectedAt = new Date();
      withdrawal.rejectionReason = rejectionReason;
      withdrawal.adminNotes = adminNotes;

      // Refund the amount back to provider's wallet
      // This would integrate with the wallet service
      const updatedWithdrawal = await withdrawal.save();

      return updatedWithdrawal.populate(
        "provider",
        "firstName lastName email phone"
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to reject withdrawal request", 500);
    }
  }
}
