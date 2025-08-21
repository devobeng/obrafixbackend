import { Booking, IBooking } from "../models/Booking";
import { User } from "../models/User";
import { Service } from "../models/Service";
import { Payment } from "../models/Payment";
import { AppError } from "../utils/AppError";
import { generateInvoicePDF } from "../utils/invoiceGenerator";
import mongoose from "mongoose";

export class EnhancedBookingService {
  // Get comprehensive booking history for a user
  async getUserBookingHistory(
    userId: string,
    filters: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    bookings: IBooking[];
    total: number;
    page: number;
    totalPages: number;
    summary: {
      total: number;
      pending: number;
      confirmed: number;
      inProgress: number;
      completed: number;
      cancelled: number;
      disputed: number;
    };
  }> {
    try {
      const { status, dateFrom, dateTo, page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { userId };

      if (status) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query["bookingDetails.scheduledDate"] = {};
        if (dateFrom) query["bookingDetails.scheduledDate"].$gte = dateFrom;
        if (dateTo) query["bookingDetails.scheduledDate"].$lte = dateTo;
      }

      // Get bookings with pagination
      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .populate("serviceId", "title category basePrice")
          .populate("providerId", "firstName lastName profileImage phone")
          .populate("userId", "firstName lastName email phone")
          .sort({ "bookingDetails.scheduledDate": -1 })
          .skip(skip)
          .limit(limit),
        Booking.countDocuments(query),
      ]);

      // Get summary counts
      const summary = await this.getBookingSummary(userId);

      return {
        bookings,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        summary,
      };
    } catch (error) {
      throw new AppError("Failed to retrieve booking history", 500);
    }
  }

  // Get booking summary statistics
  private async getBookingSummary(userId: string) {
    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ];

    const results = await Booking.aggregate(pipeline);

    const summary = {
      total: 0,
      pending: 0,
      confirmed: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0,
    };

    results.forEach((result) => {
      summary[result._id as keyof typeof summary] = result.count;
      summary.total += result.count;
    });

    return summary;
  }

  // Cancel booking with reason
  async cancelBooking(
    bookingId: string,
    userId: string,
    reason: string,
    cancellationType: "user" | "provider" | "admin" = "user"
  ): Promise<IBooking> {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      // Verify user has permission to cancel
      if (cancellationType === "user" && booking.userId.toString() !== userId) {
        throw new AppError(
          "Access denied - you can only cancel your own bookings",
          403
        );
      }

      if (
        cancellationType === "provider" &&
        booking.providerId.toString() !== userId
      ) {
        throw new AppError(
          "Access denied - you can only cancel your own bookings",
          403
        );
      }

      // Check if booking can be cancelled
      if (!["pending", "confirmed"].includes(booking.status)) {
        throw new AppError(
          "Booking cannot be cancelled in its current status",
          400
        );
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = this.calculateRefundAmount(booking);

      // Update booking status
      booking.status = "cancelled";
      booking.cancellation = {
        cancelledBy: cancellationType,
        reason,
        cancelledAt: new Date(),
        refundAmount,
      };

      // Add to status history
      booking.jobStatus.statusHistory.push({
        status: "cancelled",
        timestamp: new Date(),
        note: `Cancelled by ${cancellationType}: ${reason}`,
        updatedBy: cancellationType,
      });

      await booking.save();

      // Process refund if applicable
      if (refundAmount > 0) {
        await this.processRefund(booking, refundAmount, reason);
      }

      return booking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to cancel booking", 500);
    }
  }

  // Reschedule booking
  async rescheduleBooking(
    bookingId: string,
    userId: string,
    newDate: Date,
    newTime: string,
    reason: string
  ): Promise<IBooking> {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      // Verify user has permission to reschedule
      if (
        booking.userId.toString() !== userId &&
        booking.providerId.toString() !== userId
      ) {
        throw new AppError("Access denied", 403);
      }

      // Check if booking can be rescheduled
      if (!["pending", "confirmed"].includes(booking.status)) {
        throw new AppError(
          "Booking cannot be rescheduled in its current status",
          400
        );
      }

      // Check if new date is in the future
      if (newDate <= new Date()) {
        throw new AppError("New date must be in the future", 400);
      }

      // Check provider availability (basic check)
      const isAvailable = await this.checkProviderAvailability(
        booking.providerId.toString(),
        newDate,
        newTime,
        booking.bookingDetails.duration,
        bookingId
      );

      if (!isAvailable) {
        throw new AppError(
          "Provider is not available at the requested time",
          400
        );
      }

      // Update booking details
      const oldDate = booking.bookingDetails.scheduledDate;
      const oldTime = booking.bookingDetails.scheduledTime;

      booking.bookingDetails.scheduledDate = newDate;
      booking.bookingDetails.scheduledTime = newTime;

      // Add to status history
      booking.jobStatus.statusHistory.push({
        status: "rescheduled",
        timestamp: new Date(),
        note: `Rescheduled from ${oldDate.toDateString()} ${oldTime} to ${newDate.toDateString()} ${newTime}. Reason: ${reason}`,
        updatedBy: userId === booking.userId.toString() ? "user" : "provider",
      });

      await booking.save();

      return booking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to reschedule booking", 500);
    }
  }

  // Generate invoice/receipt
  async generateInvoice(
    bookingId: string,
    userId: string
  ): Promise<{
    pdfBuffer: Buffer;
    filename: string;
    invoiceNumber: string;
  }> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("serviceId", "title category basePrice")
        .populate("providerId", "firstName lastName phone email")
        .populate("userId", "firstName lastName phone email");

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      // Verify user has access to this invoice
      if (
        booking.userId.toString() !== userId &&
        booking.providerId.toString() !== userId
      ) {
        throw new AppError("Access denied", 403);
      }

      // Generate invoice number
      const invoiceNumber = `INV-${booking._id
        .toString()
        .slice(-8)
        .toUpperCase()}-${Date.now().toString().slice(-6)}`;

      // Generate PDF invoice
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber,
        booking,
        generatedAt: new Date(),
      });

      const filename = `invoice-${invoiceNumber}.pdf`;

      return {
        pdfBuffer,
        filename,
        invoiceNumber,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to generate invoice", 500);
    }
  }

  // Get upcoming bookings
  async getUpcomingBookings(
    userId: string,
    limit: number = 5
  ): Promise<IBooking[]> {
    try {
      const now = new Date();

      return await Booking.find({
        userId,
        status: { $in: ["pending", "confirmed"] },
        "bookingDetails.scheduledDate": { $gte: now },
      })
        .populate("serviceId", "title category")
        .populate("providerId", "firstName lastName profileImage phone")
        .sort({ "bookingDetails.scheduledDate": 1 })
        .limit(limit);
    } catch (error) {
      throw new AppError("Failed to retrieve upcoming bookings", 500);
    }
  }

  // Get ongoing bookings
  async getOngoingBookings(userId: string): Promise<IBooking[]> {
    try {
      return await Booking.find({
        userId,
        status: { $in: ["confirmed", "in_progress"] },
      })
        .populate("serviceId", "title category")
        .populate("providerId", "firstName lastName profileImage phone")
        .sort({ "bookingDetails.scheduledDate": 1 });
    } catch (error) {
      throw new AppError("Failed to retrieve ongoing bookings", 500);
    }
  }

  // Calculate refund amount based on cancellation policy
  private calculateRefundAmount(booking: IBooking): number {
    const now = new Date();
    const scheduledDate = new Date(booking.bookingDetails.scheduledDate);
    const hoursUntilBooking =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Cancellation policy: 100% refund if > 24 hours, 50% if > 2 hours, 0% if < 2 hours
    if (hoursUntilBooking > 24) {
      return booking.pricing.totalAmount;
    } else if (hoursUntilBooking > 2) {
      return booking.pricing.totalAmount * 0.5;
    } else {
      return 0;
    }
  }

  // Check provider availability for rescheduling
  private async checkProviderAvailability(
    providerId: string,
    date: Date,
    time: string,
    duration: number,
    excludeBookingId: string
  ): Promise<boolean> {
    try {
      // Check for conflicting bookings
      const conflictingBooking = await Booking.findOne({
        providerId,
        _id: { $ne: excludeBookingId },
        status: { $in: ["pending", "confirmed", "in_progress"] },
        "bookingDetails.scheduledDate": {
          $gte: new Date(date.getTime() - duration * 60 * 60 * 1000),
          $lte: new Date(date.getTime() + duration * 60 * 60 * 1000),
        },
      });

      return !conflictingBooking;
    } catch (error) {
      console.error("Error checking provider availability:", error);
      return false;
    }
  }

  // Process refund
  private async processRefund(
    booking: IBooking,
    amount: number,
    reason: string
  ): Promise<void> {
    try {
      // Update payment status
      if (booking.payment.status === "paid") {
        booking.payment.status = "refunded";
        booking.payment.refundedAt = new Date();
        booking.payment.refundReason = reason;
        await booking.save();
      }

      // TODO: Integrate with payment gateway for actual refund processing
      console.log(
        `Refund processed for booking ${booking._id}: ${amount} ${booking.pricing.currency}`
      );
    } catch (error) {
      console.error("Error processing refund:", error);
    }
  }
}
