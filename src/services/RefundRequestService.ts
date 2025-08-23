import { RefundRequest, IRefundRequest } from "../models/RefundRequest";
import { User } from "../models/User";
import { Booking } from "../models/Booking";
import { AppError } from "../utils/AppError";

export class RefundRequestService {
  // Create refund request
  async createRefundRequest(
    userId: string,
    requestData: {
      bookingId: string;
      reason: string;
      description: string;
      amount: number;
      currency: string;
      refundMethod: string;
      evidence?: string[];
    }
  ): Promise<IRefundRequest> {
    try {
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Verify booking exists and belongs to user
      const booking = await Booking.findOne({
        _id: requestData.bookingId,
        userId,
      });

      if (!booking) {
        throw new AppError("Booking not found or access denied", 404);
      }

      // Check if booking is eligible for refund
      if (!this.isBookingEligibleForRefund(booking)) {
        throw new AppError("Booking is not eligible for refund", 400);
      }

      // Check if refund request already exists
      const existingRequest = await RefundRequest.findOne({
        userId,
        bookingId: requestData.bookingId,
        status: { $in: ["pending", "approved", "processing"] },
      });

      if (existingRequest) {
        throw new AppError(
          "Refund request already exists for this booking",
          400
        );
      }

      // Create refund request
      const refundRequest = new RefundRequest({
        userId,
        ...requestData,
        status: "pending",
        priority: this.calculatePriority(requestData.reason),
      });

      await refundRequest.save();
      return refundRequest;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create refund request", 500);
    }
  }

  // Get user's refund requests
  async getUserRefundRequests(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    requests: IRefundRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const query: any = { userId };
      if (status) {
        query.status = status;
      }

      const [requests, total] = await Promise.all([
        RefundRequest.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("bookingId", "serviceName scheduledDate totalAmount")
          .lean(),
        RefundRequest.countDocuments(query),
      ]);

      return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new AppError("Failed to retrieve refund requests", 500);
    }
  }

  // Get refund request by ID
  async getRefundRequestById(
    requestId: string,
    userId?: string
  ): Promise<IRefundRequest> {
    try {
      const query: any = { _id: requestId };
      if (userId) {
        query.userId = userId; // Ensure user can only access their own requests
      }

      const request = await RefundRequest.findOne(query)
        .populate("userId", "firstName lastName email phone")
        .populate(
          "bookingId",
          "serviceName scheduledDate totalAmount vendorId"
        );

      if (!request) {
        throw new AppError("Refund request not found", 404);
      }

      return request;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve refund request", 500);
    }
  }

  // Update refund request
  async updateRefundRequest(
    requestId: string,
    userId: string,
    updateData: {
      reason?: string;
      description?: string;
      amount?: number;
      refundMethod?: string;
      evidence?: string[];
    }
  ): Promise<IRefundRequest> {
    try {
      const request = await RefundRequest.findOne({
        _id: requestId,
        userId,
      });

      if (!request) {
        throw new AppError("Refund request not found", 404);
      }

      // Only allow updates if request is pending
      if (request.status !== "pending") {
        throw new AppError("Cannot update non-pending refund request", 400);
      }

      // Update request
      Object.assign(request, updateData);
      await request.save();

      return request;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update refund request", 500);
    }
  }

  // Cancel refund request
  async cancelRefundRequest(
    requestId: string,
    userId: string
  ): Promise<IRefundRequest> {
    try {
      const request = await RefundRequest.findOne({
        _id: requestId,
        userId,
      });

      if (!request) {
        throw new AppError("Refund request not found", 404);
      }

      if (request.status !== "pending") {
        throw new AppError("Cannot cancel non-pending refund request", 400);
      }

      request.status = "cancelled";
      request.cancelledAt = new Date();
      await request.save();

      return request;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to cancel refund request", 500);
    }
  }

  // Process refund (admin function)
  async processRefund(
    requestId: string,
    adminId: string,
    action: "approve" | "reject",
    notes?: string,
    rejectionReason?: string
  ): Promise<IRefundRequest> {
    try {
      const request = await RefundRequest.findById(requestId);
      if (!request) {
        throw new AppError("Refund request not found", 404);
      }

      if (request.status !== "pending") {
        throw new AppError("Refund request is not pending", 400);
      }

      if (action === "approve") {
        request.status = "approved";
        request.approvedAt = new Date();
        request.approvedBy = adminId;
        request.adminNotes = notes;

        // Set processing time based on refund method
        request.estimatedProcessingTime = this.getProcessingTime(
          request.refundMethod
        );
      } else {
        request.status = "rejected";
        request.rejectedAt = new Date();
        request.rejectedBy = adminId;
        request.rejectionReason = rejectionReason || "Request rejected";
        request.adminNotes = notes;
      }

      await request.save();
      return request;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to process refund request", 500);
    }
  }

  // Get refund request statistics
  async getRefundStatistics(userId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    processing: number;
    completed: number;
    totalAmount: number;
    byReason: any[];
  }> {
    try {
      const query: any = {};
      if (userId) {
        query.userId = userId;
      }

      const [total, pending, approved, rejected, processing, completed] =
        await Promise.all([
          RefundRequest.countDocuments(query),
          RefundRequest.countDocuments({ ...query, status: "pending" }),
          RefundRequest.countDocuments({ ...query, status: "approved" }),
          RefundRequest.countDocuments({ ...query, status: "rejected" }),
          RefundRequest.countDocuments({ ...query, status: "processing" }),
          RefundRequest.countDocuments({ ...query, status: "completed" }),
        ]);

      // Get total amount
      const totalAmountResult = await RefundRequest.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      const totalAmount = totalAmountResult[0]?.totalAmount || 0;

      // Get requests by reason
      const byReason = await RefundRequest.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$reason",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return {
        total,
        pending,
        approved,
        rejected,
        processing,
        completed,
        totalAmount,
        byReason,
      };
    } catch (error) {
      throw new AppError("Failed to retrieve refund statistics", 500);
    }
  }

  // Get urgent refund requests
  async getUrgentRequests(): Promise<IRefundRequest[]> {
    try {
      return await RefundRequest.findUrgent();
    } catch (error) {
      throw new AppError("Failed to retrieve urgent refund requests", 500);
    }
  }

  // Search refund requests
  async searchRefundRequests(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    requests: IRefundRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(
          "Search term must be at least 2 characters long",
          400
        );
      }

      const query = {
        userId,
        $or: [
          { reason: { $regex: searchTerm.trim(), $options: "i" } },
          { description: { $regex: searchTerm.trim(), $options: "i" } },
          { requestNumber: { $regex: searchTerm.trim(), $options: "i" } },
        ],
      };

      const [requests, total] = await Promise.all([
        RefundRequest.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("bookingId", "serviceName scheduledDate totalAmount")
          .lean(),
        RefundRequest.countDocuments(query),
      ]);

      return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to search refund requests", 500);
    }
  }

  // Check if booking is eligible for refund
  private isBookingEligibleForRefund(booking: any): boolean {
    const now = new Date();
    const scheduledDate = new Date(booking.scheduledDate);

    // Allow refunds for cancelled bookings
    if (booking.status === "cancelled") {
      return true;
    }

    // Allow refunds for completed bookings within 7 days
    if (booking.status === "completed") {
      const daysSinceCompletion =
        (now.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCompletion <= 7;
    }

    // Allow refunds for upcoming bookings (more than 24 hours away)
    if (booking.status === "confirmed" || booking.status === "pending") {
      const hoursUntilScheduled =
        (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilScheduled > 24;
    }

    return false;
  }

  // Calculate priority based on reason
  private calculatePriority(reason: string): string {
    const highPriorityReasons = [
      "service_not_provided",
      "safety_concern",
      "fraud",
    ];
    const mediumPriorityReasons = ["poor_quality", "late_arrival", "damage"];

    if (highPriorityReasons.includes(reason)) {
      return "high";
    } else if (mediumPriorityReasons.includes(reason)) {
      return "medium";
    } else {
      return "low";
    }
  }

  // Get processing time based on refund method
  private getProcessingTime(refundMethod: string): number {
    switch (refundMethod) {
      case "bank_transfer":
        return 3; // 3 business days
      case "mobile_money":
        return 1; // 1 business day
      case "credit_card":
        return 5; // 5-7 business days
      case "cash":
        return 1; // 1 business day
      default:
        return 3; // Default 3 business days
    }
  }
}
