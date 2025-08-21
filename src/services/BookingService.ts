import { IBooking } from "../types";
import { Booking } from "../models/Booking";
import { Service } from "../models/Service";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { NotificationService } from "./NotificationService";

export interface BookingFilters {
  status?: string;
  "jobStatus.currentStatus"?: string;
  "payment.status"?: string;
  "payment.paymentMethod"?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  page?: number;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageRating: number;
}

export class BookingService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Create a new booking
  async createBooking(
    bookingData: Partial<IBooking>,
    userId: string
  ): Promise<IBooking> {
    // Validate service exists and is active
    const service = await Service.findById(bookingData.serviceId);
    if (!service) {
      throw new AppError("Service not found", 404);
    }
    if (service.status !== "active") {
      throw new AppError("Service is not available", 400);
    }

    // Validate provider exists and is active
    const provider = await User.findById(bookingData.providerId);
    if (!provider || provider.role !== "provider") {
      throw new AppError("Provider not found", 404);
    }
    if (provider.accountStatus !== "active") {
      throw new AppError("Provider account is not active", 400);
    }

    // Calculate total amount
    const totalAmount =
      (bookingData.pricing?.basePrice || 0) +
      (bookingData.pricing?.additionalFees || 0);

    // Create booking with initial status
    const booking = new Booking({
      ...bookingData,
      userId,
      status: "pending",
      "jobStatus.currentStatus": "pending",
      "payment.status": "pending",
      pricing: {
        ...bookingData.pricing,
        totalAmount,
        currency: "GHS",
      },
      "jobStatus.statusHistory": [
        {
          status: "pending",
          timestamp: new Date(),
          updatedBy: "user",
        },
      ],
      communication: {
        messages: [],
        lastMessageAt: new Date(),
      },
    });

    const savedBooking = await booking.save();

    // Send notification to provider about new booking request
    try {
      await this.notificationService.sendBookingRequestToProvider(savedBooking);
    } catch (error) {
      console.error("Failed to send booking notification:", error);
    }

    return savedBooking;
  }

  // Get bookings by user
  async getBookingsByUser(
    userId: string,
    filters: BookingFilters = {}
  ): Promise<{ bookings: IBooking[]; total: number }> {
    const { limit = 10, page = 1, ...queryFilters } = filters;
    const skip = (page - 1) * limit;

    const query: any = { userId };

    // Apply filters
    if (queryFilters.status) query.status = queryFilters.status;
    if (queryFilters["jobStatus.currentStatus"])
      query["jobStatus.currentStatus"] =
        queryFilters["jobStatus.currentStatus"];
    if (queryFilters["payment.status"])
      query["payment.status"] = queryFilters["payment.status"];
    if (queryFilters.startDate || queryFilters.endDate) {
      query["bookingDetails.scheduledDate"] = {};
      if (queryFilters.startDate)
        query["bookingDetails.scheduledDate"].$gte = queryFilters.startDate;
      if (queryFilters.endDate)
        query["bookingDetails.scheduledDate"].$lte = queryFilters.endDate;
    }
    if (queryFilters.minAmount || queryFilters.maxAmount) {
      query["pricing.totalAmount"] = {};
      if (queryFilters.minAmount)
        query["pricing.totalAmount"].$gte = queryFilters.minAmount;
      if (queryFilters.maxAmount)
        query["pricing.totalAmount"].$lte = queryFilters.maxAmount;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("serviceId", "title description category pricing images")
        .populate("providerId", "firstName lastName email phone profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return { bookings, total };
  }

  // Get bookings by provider
  async getBookingsByProvider(
    providerId: string,
    filters: BookingFilters = {}
  ): Promise<{ bookings: IBooking[]; total: number }> {
    const { limit = 10, page = 1, ...queryFilters } = filters;
    const skip = (page - 1) * limit;

    const query: any = { providerId };

    // Apply filters
    if (queryFilters.status) query.status = queryFilters.status;
    if (queryFilters["jobStatus.currentStatus"])
      query["jobStatus.currentStatus"] =
        queryFilters["jobStatus.currentStatus"];
    if (queryFilters["payment.status"])
      query["payment.status"] = queryFilters["payment.status"];
    if (queryFilters.startDate || queryFilters.endDate) {
      query["bookingDetails.scheduledDate"] = {};
      if (queryFilters.startDate)
        query["bookingDetails.scheduledDate"].$gte = queryFilters.startDate;
      if (queryFilters.endDate)
        query["bookingDetails.scheduledDate"].$lte = queryFilters.endDate;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("serviceId", "title description category pricing images")
        .populate("userId", "firstName lastName email phone profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return { bookings, total };
  }



  // Update job status
  async updateJobStatus(
    bookingId: string,
    status: string,
    note: string,
    updatedBy: string
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Validate status transition
    const validTransitions: { [key: string]: string[] } = {
      pending: ["accepted", "cancelled"],
      accepted: ["on_way", "cancelled"],
      on_way: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    const currentStatus = booking.jobStatus.currentStatus;
    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${status}`,
        400
      );
    }

    // Update status
    await booking.updateJobStatus(status, note, updatedBy);

    // Update main booking status if needed
    if (status === "accepted") {
      booking.status = "confirmed";
    } else if (status === "completed") {
      booking.status = "completed";
    }

    const savedBooking = await booking.save();

    // Send notification about status update
    try {
      await this.notificationService.sendJobStatusUpdate(
        savedBooking,
        status,
        note
      );
    } catch (error) {
      console.error("Failed to send status update notification:", error);
    }

    return savedBooking;
  }

  // Add message to booking
  async addMessage(
    bookingId: string,
    senderId: string,
    senderType: string,
    message: string
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check if user has access to this booking
    if (
      booking.userId.toString() !== senderId &&
      booking.providerId.toString() !== senderId
    ) {
      throw new AppError("Access denied", 403);
    }

    const updatedBooking = await booking.addMessage(
      senderId,
      senderType,
      message
    );

    // Send notification about new message
    try {
      await this.notificationService.sendNewMessageNotification(
        updatedBooking,
        senderId,
        message
      );
    } catch (error) {
      console.error("Failed to send message notification:", error);
    }

    return updatedBooking;
  }

  // Mark messages as read
  async markMessagesAsRead(
    bookingId: string,
    userId: string
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    return await booking.markMessagesAsRead(userId);
  }

  // Cancel booking
  async cancelBooking(
    bookingId: string,
    userId: string,
    reason: string,
    refundAmount?: number
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check if user can cancel this booking
    if (
      booking.userId.toString() !== userId &&
      booking.providerId.toString() !== userId
    ) {
      throw new AppError("Access denied", 403);
    }

    // Check if booking can be cancelled
    if (["cancelled", "completed"].includes(booking.status)) {
      throw new AppError("Booking cannot be cancelled", 400);
    }

    // Determine who cancelled
    let cancelledBy: "user" | "provider" | "admin" = "user";
    if (booking.providerId.toString() === userId) {
      cancelledBy = "provider";
    }

    booking.status = "cancelled";
    booking.cancellation = {
      cancelledBy,
      reason,
      cancelledAt: new Date(),
      refundAmount,
    };

    // Update job status
    await booking.updateJobStatus(
      "cancelled",
      "Booking cancelled",
      cancelledBy
    );

    const savedBooking = await booking.save();

    // Send cancellation notification
    try {
      await this.notificationService.sendCancellationNotification(
        savedBooking,
        cancelledBy,
        reason
      );
    } catch (error) {
      console.error("Failed to send cancellation notification:", error);
    }

    return savedBooking;
  }

  // Create dispute
  async createDispute(
    bookingId: string,
    userId: string,
    reason: string,
    escalateToAdmin: boolean = false
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check if user has access to this booking
    if (
      booking.userId.toString() !== userId &&
      booking.providerId.toString() !== userId
    ) {
      throw new AppError("Access denied", 403);
    }

    // Check if dispute already exists
    if (booking.dispute?.isDisputed) {
      throw new AppError("Dispute already exists for this booking", 400);
    }

    // Determine who is creating the dispute
    const disputedBy =
      booking.userId.toString() === userId ? "user" : "provider";

    booking.dispute = {
      isDisputed: true,
      disputeReason: reason,
      disputedAt: new Date(),
      escalateToAdmin,
    };

    const savedBooking = await booking.save();

    // Send dispute notification
    try {
      await this.notificationService.sendDisputeNotification(
        savedBooking,
        disputedBy,
        reason,
        escalateToAdmin
      );
    } catch (error) {
      console.error("Failed to send dispute notification:", error);
    }

    return savedBooking;
  }

  // Get booking statistics
  async getBookingStats(userId?: string, role?: string): Promise<BookingStats> {
    const query: any = {};

    if (userId && role === "user") {
      query.userId = userId;
    } else if (userId && role === "provider") {
      query.providerId = userId;
    }

    const [
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      averageRating,
    ] = await Promise.all([
      Booking.countDocuments(query),
      Booking.countDocuments({ ...query, status: "pending" }),
      Booking.countDocuments({
        ...query,
        status: { $in: ["confirmed", "in_progress"] },
      }),
      Booking.countDocuments({ ...query, status: "completed" }),
      Booking.countDocuments({ ...query, status: "cancelled" }),
      Booking.aggregate([
        { $match: { ...query, "payment.status": "paid" } },
        { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
      ]).then((result: any[]) => result[0]?.total || 0),
      Booking.aggregate([
        { $match: { ...query, "rating.userRating": { $exists: true } } },
        { $group: { _id: null, average: { $avg: "$rating.userRating" } } },
      ]).then((result: any[]) => result[0]?.average || 0),
    ]);

    return {
      totalBookings,
      pendingBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  // Get all bookings (admin only)
  async getAllBookings(
    page: number,
    limit: number,
    filters: any = {},
    sort: any = { createdAt: -1 }
  ): Promise<{ bookings: IBooking[]; total: number }> {
    const skip = (page - 1) * limit;

    const query: any = {};

    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters["jobStatus.currentStatus"])
      query["jobStatus.currentStatus"] = filters["jobStatus.currentStatus"];
    if (filters["payment.status"])
      query["payment.status"] = filters["payment.status"];
    if (filters["payment.paymentMethod"])
      query["pricing.paymentMethod"] = filters["payment.paymentMethod"];
    if (filters.startDate || filters.endDate) {
      query["bookingDetails.scheduledDate"] = {};
      if (filters.startDate)
        query["bookingDetails.scheduledDate"].$gte = filters.startDate;
      if (filters.endDate)
        query["bookingDetails.scheduledDate"].$lte = filters.endDate;
    }
    if (filters.minAmount || filters.maxAmount) {
      query["pricing.totalAmount"] = {};
      if (filters.minAmount)
        query["pricing.totalAmount"].$gte = filters.minAmount;
      if (filters.maxAmount)
        query["pricing.totalAmount"].$lte = filters.maxAmount;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("serviceId", "title description category")
        .populate("userId", "firstName lastName email")
        .populate("providerId", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);

    return { bookings, total };
  }

  // Get booking by ID (admin version)
  async getBookingById(bookingId: string): Promise<IBooking | null> {
    try {
      return await Booking.findById(bookingId)
        .populate("serviceId", "title description category pricing")
        .populate("userId", "firstName lastName email phone address")
        .populate("providerId", "firstName lastName email phone address");
    } catch (error) {
      throw new AppError("Failed to fetch booking", 500);
    }
  }

  // Resolve booking dispute (admin only)
  async resolveDispute(
    bookingId: string,
    resolution: string,
    adminNotes: string,
    refundAmount?: number,
    penaltyAmount?: number
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return null;
      }

      // Update dispute resolution
      const updateData: any = {
        "dispute.isResolved": true,
        "dispute.resolution": resolution,
        "dispute.resolvedAt": new Date(),
        "dispute.adminNotes": adminNotes,
        "dispute.resolvedBy": "admin", // This would be the admin ID in a real implementation
      };

      if (refundAmount) {
        updateData["dispute.refundAmount"] = refundAmount;
      }

      if (penaltyAmount) {
        updateData["dispute.penaltyAmount"] = penaltyAmount;
      }

      // Update booking status based on resolution
      switch (resolution) {
        case "customer_favored":
          updateData.status = "cancelled";
          updateData["payment.status"] = "refunded";
          break;
        case "provider_favored":
          updateData.status = "completed";
          updateData["payment.status"] = "paid";
          break;
        case "partial_refund":
          updateData.status = "completed";
          updateData["payment.status"] = "partially_refunded";
          break;
        case "resolved":
          updateData.status = "completed";
          break;
      }

      return await Booking.findByIdAndUpdate(
        bookingId,
        updateData,
        { new: true, runValidators: true }
      ).populate("serviceId", "title description category")
        .populate("userId", "firstName lastName email")
        .populate("providerId", "firstName lastName email");
    } catch (error) {
      throw new AppError("Failed to resolve dispute", 500);
    }
  }
}
