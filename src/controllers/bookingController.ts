import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { BookingService } from "../services/BookingService";
import { AppError } from "../utils/AppError";
import { IAuthRequest } from "../types";

const bookingService = new BookingService();

export class BookingController {
  // Create a new booking
  createBooking = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const booking = await bookingService.createBooking(req.body, userId);

    res.status(201).json({
      success: true,
      data: booking,
      message: "Booking created successfully",
    });
  });

  // Get user's bookings
  getUserBookings = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { limit, page, ...filters } = req.query;
    const parsedFilters = {
      ...filters,
      limit: limit ? parseInt(limit as string) : 10,
      page: page ? parseInt(page as string) : 1,
    };

    const result = await bookingService.getBookingsByUser(
      userId,
      parsedFilters
    );

    res.status(200).json({
      success: true,
      data: result.bookings,
      pagination: {
        total: result.total,
        page: parsedFilters.page,
        limit: parsedFilters.limit,
        pages: Math.ceil(result.total / parsedFilters.limit),
      },
    });
  });

  // Get provider's bookings
  getProviderBookings = asyncHandler(
    async (req: IAuthRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }

      const { limit, page, ...filters } = req.query;
      const parsedFilters = {
        ...filters,
        limit: limit ? parseInt(limit as string) : 10,
        page: page ? parseInt(page as string) : 1,
      };

      const result = await bookingService.getBookingsByProvider(
        userId,
        parsedFilters
      );

      res.status(200).json({
        success: true,
        data: result.bookings,
        pagination: {
          total: result.total,
          page: parsedFilters.page,
          limit: parsedFilters.limit,
          pages: Math.ceil(result.total / parsedFilters.limit),
        },
      });
    }
  );

  // Get booking by ID
  getBookingById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;
    const booking = await bookingService.getBookingById(id, userId);

    res.status(200).json({
      success: true,
      data: booking,
    });
  });

  // Update job status
  updateJobStatus = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;
    const { status, note, estimatedStartTime, actualStartTime, actualEndTime } =
      req.body;

    // Determine who is updating the status
    let updatedBy: "user" | "provider" | "admin" = "user";
    if (req.user?.role === "provider") {
      updatedBy = "provider";
    } else if (req.user?.role === "admin") {
      updatedBy = "admin";
    }

    const booking = await bookingService.updateJobStatus(
      id,
      status,
      note || "",
      updatedBy
    );

    res.status(200).json({
      success: true,
      data: booking,
      message: "Job status updated successfully",
    });
  });

  // Add message to booking
  addMessage = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;
    const { message } = req.body;

    // Determine sender type
    const senderType = req.user?.role === "provider" ? "provider" : "user";

    const booking = await bookingService.addMessage(
      id,
      userId,
      senderType,
      message
    );

    res.status(200).json({
      success: true,
      data: booking,
      message: "Message added successfully",
    });
  });

  // Mark messages as read
  markMessagesAsRead = asyncHandler(
    async (req: IAuthRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }

      const { id } = req.params;
      const booking = await bookingService.markMessagesAsRead(id, userId);

      res.status(200).json({
        success: true,
        data: booking,
        message: "Messages marked as read",
      });
    }
  );

  // Cancel booking
  cancelBooking = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;
    const { reason, refundAmount } = req.body;

    const booking = await bookingService.cancelBooking(
      id,
      userId,
      reason,
      refundAmount
    );

    res.status(200).json({
      success: true,
      data: booking,
      message: "Booking cancelled successfully",
    });
  });

  // Create dispute
  createDispute = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;
    const { reason, escalateToAdmin } = req.body;

    const booking = await bookingService.createDispute(
      id,
      userId,
      reason,
      escalateToAdmin
    );

    res.status(200).json({
      success: true,
      data: booking,
      message: "Dispute created successfully",
    });
  });

  // Get booking statistics
  getBookingStats = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const role = req.user?.role;
    const stats = await bookingService.getBookingStats(userId, role);

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  // Get all bookings (admin only)
  getAllBookings = asyncHandler(async (req: Request, res: Response) => {
    const { limit, page, ...filters } = req.query;
    const parsedFilters = {
      ...filters,
      limit: limit ? parseInt(limit as string) : 10,
      page: page ? parseInt(page as string) : 1,
    };

    const result = await bookingService.getAllBookings(parsedFilters);

    res.status(200).json({
      success: true,
      data: result.bookings,
      pagination: {
        total: result.total,
        page: parsedFilters.page,
        limit: parsedFilters.limit,
        pages: Math.ceil(result.total / parsedFilters.limit),
      },
    });
  });

  // Get admin booking statistics
  getAdminBookingStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await bookingService.getBookingStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  // Resolve dispute (admin only)
  resolveDispute = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { resolution } = req.body;

    const booking = await bookingService.getBookingById(id, "admin");

    if (!booking.dispute?.isDisputed) {
      throw new AppError("No dispute found for this booking", 400);
    }

    booking.dispute.resolvedAt = new Date();
    booking.dispute.resolution = resolution;
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: "Dispute resolved successfully",
    });
  });

  // Process refund (admin only)
  processRefund = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { refundAmount, reason } = req.body;

    const booking = await bookingService.getBookingById(id, "admin");

    if (booking.payment.status !== "paid") {
      throw new AppError("Payment has not been made for this booking", 400);
    }

    booking.payment.status = "refunded";
    booking.payment.refundedAt = new Date();
    booking.payment.refundReason = reason;

    if (refundAmount) {
      booking.cancellation = {
        ...booking.cancellation,
        refundAmount,
      };
    }

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: "Refund processed successfully",
    });
  });
}
