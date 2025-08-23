import { ServiceCategory } from "../models/ServiceCategory";
import { Service } from "../models/Service";
import { Booking } from "../models/Booking";
import { User } from "../models/User";
import { BookingPayment } from "../models/BookingPayment";
import { NotificationService } from "./NotificationService";
import { AppError } from "../utils/AppError";
import { IServiceCategory, IBooking, IUser } from "../types";
import mongoose from "mongoose";

export interface ServiceCategoryStats {
  totalCategories: number;
  activeCategories: number;
  categoriesWithServices: number;
  averageCommissionRate: number;
  topCategories: Array<{
    categoryId: string;
    name: string;
    serviceCount: number;
    totalRevenue: number;
  }>;
}

export interface BookingManagementStats {
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  disputedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  recentDisputes: Array<{
    bookingId: string;
    customerName: string;
    providerName: string;
    serviceTitle: string;
    disputeReason: string;
    createdAt: Date;
  }>;
}

export interface DisputeResolution {
  bookingId: string;
  resolution:
    | "resolved"
    | "customer_favored"
    | "provider_favored"
    | "partial_refund";
  adminNotes: string;
  refundAmount?: number;
  penaltyAmount?: number;
  escalatedTo?: string;
}

export class AdminService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // ==================== SERVICE & CATEGORY MANAGEMENT ====================

  /**
   * Create a new service category
   */
  async createServiceCategory(categoryData: {
    name: string;
    description: string;
    icon?: string;
    parentCategory?: string;
    commissionRate: number;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<IServiceCategory> {
    try {
      // Check if category name already exists
      const existingCategory = await ServiceCategory.findOne({
        name: { $regex: new RegExp(`^${categoryData.name}$`, "i") },
      });

      if (existingCategory) {
        throw new AppError("Category with this name already exists", 409);
      }

      // Validate parent category if provided
      if (categoryData.parentCategory) {
        const parentCategory = await ServiceCategory.findById(
          categoryData.parentCategory
        );
        if (!parentCategory) {
          throw new AppError("Parent category not found", 404);
        }
      }

      const category = new ServiceCategory({
        ...categoryData,
        isActive: categoryData.isActive !== false,
        sortOrder: categoryData.sortOrder || 0,
      });

      return await category.save();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create service category", 500);
    }
  }

  /**
   * Update service category
   */
  async updateServiceCategory(
    categoryId: string,
    updateData: Partial<{
      name: string;
      description: string;
      icon: string;
      parentCategory: string;
      commissionRate: number;
      isActive: boolean;
      sortOrder: number;
    }>
  ): Promise<IServiceCategory | null> {
    try {
      // Check if category exists
      const existingCategory = await ServiceCategory.findById(categoryId);
      if (!existingCategory) {
        throw new AppError("Service category not found", 404);
      }

      // Check if new name conflicts with existing category
      if (updateData.name && updateData.name !== existingCategory.name) {
        const nameConflict = await ServiceCategory.findOne({
          name: { $regex: new RegExp(`^${updateData.name}$`, "i") },
          _id: { $ne: categoryId },
        });

        if (nameConflict) {
          throw new AppError("Category with this name already exists", 409);
        }
      }

      // Validate parent category if provided
      if (updateData.parentCategory) {
        if (updateData.parentCategory === categoryId) {
          throw new AppError("Category cannot be its own parent", 400);
        }

        const parentCategory = await ServiceCategory.findById(
          updateData.parentCategory
        );
        if (!parentCategory) {
          throw new AppError("Parent category not found", 404);
        }
      }

      const updatedCategory = await ServiceCategory.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true, runValidators: true }
      );

      return updatedCategory;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update service category", 500);
    }
  }

  /**
   * Delete service category
   */
  async deleteServiceCategory(categoryId: string): Promise<boolean> {
    try {
      // Check if category exists
      const category = await ServiceCategory.findById(categoryId);
      if (!category) {
        throw new AppError("Service category not found", 404);
      }

      // Check if category has subcategories
      const subcategories = await ServiceCategory.find({
        parentCategory: categoryId,
      });
      if (subcategories.length > 0) {
        throw new AppError(
          "Cannot delete category with subcategories. Please delete subcategories first.",
          400
        );
      }

      // Check if category has services
      const servicesCount = await Service.countDocuments({
        category: categoryId,
      });
      if (servicesCount > 0) {
        throw new AppError(
          "Cannot delete category with active services. Please reassign or delete services first.",
          400
        );
      }

      await ServiceCategory.findByIdAndDelete(categoryId);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete service category", 500);
    }
  }

  /**
   * Set commission rate for a service category
   */
  async setCategoryCommissionRate(
    categoryId: string,
    commissionRate: number
  ): Promise<IServiceCategory | null> {
    try {
      if (commissionRate < 0 || commissionRate > 100) {
        throw new AppError("Commission rate must be between 0 and 100", 400);
      }

      const category = await ServiceCategory.findByIdAndUpdate(
        categoryId,
        { commissionRate },
        { new: true, runValidators: true }
      );

      if (!category) {
        throw new AppError("Service category not found", 404);
      }

      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update commission rate", 500);
    }
  }

  /**
   * Get service category statistics
   */
  async getServiceCategoryStats(): Promise<ServiceCategoryStats> {
    try {
      const [
        totalCategories,
        activeCategories,
        categoriesWithServices,
        commissionRates,
        topCategories,
      ] = await Promise.all([
        ServiceCategory.countDocuments(),
        ServiceCategory.countDocuments({ isActive: true }),
        Service.aggregate([
          { $group: { _id: "$category" } },
          { $count: "count" },
        ]),
        ServiceCategory.find({}, "commissionRate"),
        Service.aggregate([
          {
            $group: {
              _id: "$category",
              serviceCount: { $sum: 1 },
              totalRevenue: { $sum: "$basePrice" },
            },
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "servicecategories",
              localField: "_id",
              foreignField: "_id",
              as: "categoryInfo",
            },
          },
          {
            $project: {
              categoryId: "$_id",
              name: { $arrayElemAt: ["$categoryInfo.name", 0] },
              serviceCount: 1,
              totalRevenue: 1,
            },
          },
        ]),
      ]);

      const averageCommissionRate =
        commissionRates.reduce((sum, cat) => sum + cat.commissionRate, 0) /
        commissionRates.length;

      return {
        totalCategories,
        activeCategories,
        categoriesWithServices: categoriesWithServices[0]?.count || 0,
        averageCommissionRate: Math.round(averageCommissionRate * 100) / 100,
        topCategories,
      };
    } catch (error) {
      throw new AppError("Failed to get category statistics", 500);
    }
  }

  // ==================== BOOKING MANAGEMENT ====================

  /**
   * Get live booking statistics
   */
  async getLiveBookingStats(): Promise<BookingManagementStats> {
    try {
      const [
        totalBookings,
        activeBookings,
        pendingBookings,
        disputedBookings,
        cancelledBookings,
        completedBookings,
        revenueStats,
        recentDisputes,
      ] = await Promise.all([
        Booking.countDocuments(),
        Booking.countDocuments({
          status: { $in: ["confirmed", "in_progress"] },
        }),
        Booking.countDocuments({ status: "pending" }),
        Booking.countDocuments({ status: "disputed" }),
        Booking.countDocuments({ status: "cancelled" }),
        Booking.countDocuments({ status: "completed" }),
        Booking.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$pricing.totalAmount" },
              averageBookingValue: { $avg: "$pricing.totalAmount" },
            },
          },
        ]),
        Booking.find({ status: "disputed" })
          .populate("userId", "firstName lastName")
          .populate("providerId", "firstName lastName")
          .populate("serviceId", "title")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

      const revenue = revenueStats[0] || {
        totalRevenue: 0,
        averageBookingValue: 0,
      };

      return {
        totalBookings,
        activeBookings,
        pendingBookings,
        disputedBookings,
        cancelledBookings,
        completedBookings,
        totalRevenue: revenue.totalRevenue,
        averageBookingValue:
          Math.round(revenue.averageBookingValue * 100) / 100,
        recentDisputes: recentDisputes.map((booking) => ({
          bookingId: booking._id.toString(),
          customerName: `${booking.userId.firstName} ${booking.userId.lastName}`,
          providerName: `${booking.providerId.firstName} ${booking.providerId.lastName}`,
          serviceTitle: booking.serviceId.title,
          disputeReason: booking.dispute?.disputeReason || "No reason provided",
          createdAt: booking.createdAt,
        })),
      };
    } catch (error) {
      throw new AppError("Failed to get booking statistics", 500);
    }
  }

  /**
   * Monitor live bookings with real-time updates
   */
  async getLiveBookings(
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
  }> {
    try {
      const { status, dateFrom, dateTo, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query["bookingDetails.scheduledDate"] = {};
        if (dateFrom) query["bookingDetails.scheduledDate"].$gte = dateFrom;
        if (dateTo) query["bookingDetails.scheduledDate"].$lte = dateTo;
      }

      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .populate("serviceId", "title category basePrice")
          .populate("userId", "firstName lastName email phone")
          .populate("providerId", "firstName lastName email phone")
          .sort({ "bookingDetails.scheduledDate": 1 })
          .skip(skip)
          .limit(limit),
        Booking.countDocuments(query),
      ]);

      return {
        bookings,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new AppError("Failed to get live bookings", 500);
    }
  }

  /**
   * Handle booking cancellation with refund processing
   */
  async handleBookingCancellation(
    bookingId: string,
    cancellationData: {
      reason: string;
      refundAmount?: number;
      adminNotes?: string;
      notifyParties?: boolean;
    }
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("userId", "firstName lastName email")
        .populate("providerId", "firstName lastName email");

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (booking.status === "cancelled") {
        throw new AppError("Booking is already cancelled", 400);
      }

      // Calculate refund amount if not provided
      let refundAmount = cancellationData.refundAmount;
      if (!refundAmount && booking.payment.status === "paid") {
        // Full refund for paid bookings
        refundAmount = booking.pricing.totalAmount;
      }

      // Update booking status
      booking.status = "cancelled";
      booking.cancellation = {
        cancelledBy: "admin",
        reason: cancellationData.reason,
        cancelledAt: new Date(),
        refundAmount,
      };

      // Process refund if applicable
      if (refundAmount && refundAmount > 0) {
        booking.payment.status = "refunded";
        booking.payment.refundedAt = new Date();
        booking.payment.refundReason = cancellationData.reason;

        // Create refund record
        await BookingPayment.create({
          bookingId: booking._id,
          amount: refundAmount,
          type: "refund",
          status: "completed",
          paymentMethod: booking.pricing.paymentMethod,
          description: `Refund for cancelled booking - ${cancellationData.reason}`,
        });
      }

      await booking.save();

      // Send notifications if requested
      if (cancellationData.notifyParties !== false) {
        const notifications = [];

        // Notify customer
        if (booking.userId) {
          notifications.push({
            recipient: booking.userId._id.toString(),
            type: "booking_cancelled",
            title: "Booking Cancelled",
            message: `Your booking for ${
              booking.serviceId.title
            } has been cancelled. ${
              refundAmount
                ? `Refund of $${refundAmount} will be processed.`
                : ""
            }`,
            metadata: {
              bookingId: booking._id.toString(),
              reason: cancellationData.reason,
              refundAmount,
            },
          });
        }

        // Notify provider
        if (booking.providerId) {
          notifications.push({
            recipient: booking.providerId._id.toString(),
            type: "booking_cancelled",
            title: "Booking Cancelled",
            message: `A booking for ${booking.serviceId.title} has been cancelled by admin.`,
            metadata: {
              bookingId: booking._id.toString(),
              reason: cancellationData.reason,
            },
          });
        }

        await Promise.all(
          notifications.map((notification) =>
            this.notificationService.sendNotification(notification)
          )
        );
      }

      return booking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to handle booking cancellation", 500);
    }
  }

  /**
   * Process refund for a booking
   */
  async processBookingRefund(
    bookingId: string,
    refundData: {
      amount: number;
      reason: string;
      adminNotes?: string;
      notifyParties?: boolean;
    }
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("userId", "firstName lastName email")
        .populate("providerId", "firstName lastName email");

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (booking.payment.status !== "paid") {
        throw new AppError("Booking payment is not in paid status", 400);
      }

      if (refundData.amount > booking.pricing.totalAmount) {
        throw new AppError("Refund amount cannot exceed booking amount", 400);
      }

      // Update payment status
      booking.payment.status = "refunded";
      booking.payment.refundedAt = new Date();
      booking.payment.refundReason = refundData.reason;

      // Create refund record
      await BookingPayment.create({
        bookingId: booking._id,
        amount: refundData.amount,
        type: "refund",
        status: "completed",
        paymentMethod: booking.pricing.paymentMethod,
        description: `Refund: ${refundData.reason}`,
      });

      await booking.save();

      // Send notifications if requested
      if (refundData.notifyParties !== false) {
        const notifications = [];

        // Notify customer
        if (booking.userId) {
          notifications.push({
            recipient: booking.userId._id.toString(),
            type: "refund_processed",
            title: "Refund Processed",
            message: `Your refund of $${refundData.amount} has been processed for booking #${booking._id}.`,
            metadata: {
              bookingId: booking._id.toString(),
              refundAmount: refundData.amount,
              reason: refundData.reason,
            },
          });
        }

        // Notify provider
        if (booking.providerId) {
          notifications.push({
            recipient: booking.providerId._id.toString(),
            type: "refund_processed",
            title: "Refund Processed",
            message: `A refund of $${refundData.amount} has been processed for booking #${booking._id}.`,
            metadata: {
              bookingId: booking._id.toString(),
              refundAmount: refundData.amount,
              reason: refundData.reason,
            },
          });
        }

        await Promise.all(
          notifications.map((notification) =>
            this.notificationService.sendNotification(notification)
          )
        );
      }

      return booking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to process refund", 500);
    }
  }

  /**
   * Escalate dispute to higher authority
   */
  async escalateDispute(
    bookingId: string,
    escalationData: {
      escalatedTo: string;
      reason: string;
      adminNotes?: string;
      priority: "low" | "medium" | "high" | "urgent";
    }
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("userId", "firstName lastName email")
        .populate("providerId", "firstName lastName email");

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (!booking.dispute?.isDisputed) {
        throw new AppError("No dispute found for this booking", 400);
      }

      // Update dispute with escalation details
      booking.dispute.escalatedTo = escalationData.escalatedTo;
      booking.dispute.escalationReason = escalationData.reason;
      booking.dispute.escalationDate = new Date();
      booking.dispute.priority = escalationData.priority;
      booking.dispute.adminNotes = escalationData.adminNotes;

      await booking.save();

      // Send escalation notification
      const notifications = [];

      // Notify customer
      if (booking.userId) {
        notifications.push({
          recipient: booking.userId._id.toString(),
          type: "dispute_escalated",
          title: "Dispute Escalated",
          message: `Your dispute for booking #${booking._id} has been escalated for further review.`,
          metadata: {
            bookingId: booking._id.toString(),
            escalatedTo: escalationData.escalatedTo,
            priority: escalationData.priority,
          },
        });
      }

      // Notify provider
      if (booking.providerId) {
        notifications.push({
          recipient: booking.providerId._id.toString(),
          type: "dispute_escalated",
          title: "Dispute Escalated",
          message: `The dispute for booking #${booking._id} has been escalated for further review.`,
          metadata: {
            bookingId: booking._id.toString(),
            escalatedTo: escalationData.escalatedTo,
            priority: escalationData.priority,
          },
        });
      }

      await Promise.all(
        notifications.map((notification) =>
          this.notificationService.sendNotification(notification)
        )
      );

      return booking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to escalate dispute", 500);
    }
  }

  /**
   * Resolve dispute with final decision
   */
  async resolveDispute(
    bookingId: string,
    resolutionData: DisputeResolution
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findById(bookingId)
        .populate("userId", "firstName lastName email")
        .populate("providerId", "firstName lastName email");

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (!booking.dispute?.isDisputed) {
        throw new AppError("No dispute found for this booking", 400);
      }

      // Update dispute resolution
      booking.dispute.resolution = resolutionData.resolution;
      booking.dispute.resolvedAt = new Date();
      booking.dispute.adminNotes = resolutionData.adminNotes;
      booking.dispute.refundAmount = resolutionData.refundAmount;
      booking.dispute.penaltyAmount = resolutionData.penaltyAmount;

      // Process refund if applicable
      if (resolutionData.refundAmount && resolutionData.refundAmount > 0) {
        booking.payment.status = "refunded";
        booking.payment.refundedAt = new Date();
        booking.payment.refundReason = `Dispute resolution: ${resolutionData.resolution}`;

        // Create refund record
        await BookingPayment.create({
          bookingId: booking._id,
          amount: resolutionData.refundAmount,
          type: "refund",
          status: "completed",
          paymentMethod: booking.pricing.paymentMethod,
          description: `Dispute resolution refund: ${resolutionData.resolution}`,
        });
      }

      await booking.save();

      // Send resolution notifications
      const notifications = [];

      // Notify customer
      if (booking.userId) {
        notifications.push({
          recipient: booking.userId._id.toString(),
          type: "dispute_resolved",
          title: "Dispute Resolved",
          message: `Your dispute for booking #${booking._id} has been resolved. Resolution: ${resolutionData.resolution}`,
          metadata: {
            bookingId: booking._id.toString(),
            resolution: resolutionData.resolution,
            refundAmount: resolutionData.refundAmount,
          },
        });
      }

      // Notify provider
      if (booking.providerId) {
        notifications.push({
          recipient: booking.providerId._id.toString(),
          type: "dispute_resolved",
          title: "Dispute Resolved",
          message: `The dispute for booking #${booking._id} has been resolved. Resolution: ${resolutionData.resolution}`,
          metadata: {
            bookingId: booking._id.toString(),
            resolution: resolutionData.resolution,
            penaltyAmount: resolutionData.penaltyAmount,
          },
        });
      }

      await Promise.all(
        notifications.map((notification) =>
          this.notificationService.sendNotification(notification)
        )
      );

      return booking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to resolve dispute", 500);
    }
  }

  /**
   * Get dispute statistics and trends
   */
  async getDisputeStats(): Promise<{
    totalDisputes: number;
    resolvedDisputes: number;
    pendingDisputes: number;
    escalatedDisputes: number;
    averageResolutionTime: number;
    disputeReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
    resolutionOutcomes: Array<{
      resolution: string;
      count: number;
      percentage: number;
    }>;
  }> {
    try {
      const [
        totalDisputes,
        resolvedDisputes,
        pendingDisputes,
        escalatedDisputes,
        disputeReasons,
        resolutionOutcomes,
        resolutionTimes,
      ] = await Promise.all([
        Booking.countDocuments({ "dispute.isDisputed": true }),
        Booking.countDocuments({
          "dispute.isDisputed": true,
          "dispute.resolvedAt": { $exists: true },
        }),
        Booking.countDocuments({
          "dispute.isDisputed": true,
          "dispute.resolvedAt": { $exists: false },
        }),
        Booking.countDocuments({
          "dispute.isDisputed": true,
          "dispute.escalatedTo": { $exists: true },
        }),
        Booking.aggregate([
          { $match: { "dispute.isDisputed": true } },
          {
            $group: {
              _id: "$dispute.disputeReason",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Booking.aggregate([
          {
            $match: {
              "dispute.isDisputed": true,
              "dispute.resolvedAt": { $exists: true },
            },
          },
          {
            $group: {
              _id: "$dispute.resolution",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
        Booking.aggregate([
          {
            $match: {
              "dispute.isDisputed": true,
              "dispute.resolvedAt": { $exists: true },
            },
          },
          {
            $project: {
              resolutionTime: {
                $divide: [
                  { $subtract: ["$dispute.resolvedAt", "$dispute.createdAt"] },
                  1000 * 60 * 60 * 24, // Convert to days
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              averageTime: { $avg: "$resolutionTime" },
            },
          },
        ]),
      ]);

      const totalDisputesCount = totalDisputes || 1; // Avoid division by zero

      return {
        totalDisputes,
        resolvedDisputes,
        pendingDisputes,
        escalatedDisputes,
        averageResolutionTime:
          Math.round((resolutionTimes[0]?.averageTime || 0) * 100) / 100,
        disputeReasons: disputeReasons.map((item) => ({
          reason: item._id || "Unknown",
          count: item.count,
          percentage: Math.round((item.count / totalDisputesCount) * 100),
        })),
        resolutionOutcomes: resolutionOutcomes.map((item) => ({
          resolution: item._id,
          count: item.count,
          percentage: Math.round((item.count / resolvedDisputes) * 100),
        })),
      };
    } catch (error) {
      throw new AppError("Failed to get dispute statistics", 500);
    }
  }
}
