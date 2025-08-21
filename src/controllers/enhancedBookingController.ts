import { Request, Response } from "express";
import { EnhancedBookingService } from "../services/EnhancedBookingService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { IAuthRequest } from "../types";

export class EnhancedBookingController {
  private enhancedBookingService: EnhancedBookingService;

  constructor() {
    this.enhancedBookingService = new EnhancedBookingService();
  }

  // Get comprehensive booking history
  getBookingHistory = catchAsync(async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { status, dateFrom, dateTo, page, limit } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await this.enhancedBookingService.getUserBookingHistory(
      userId,
      filters
    );

    res.status(200).json({
      success: true,
      message: "Booking history retrieved successfully",
      data: result,
    });
  });

  // Get upcoming bookings
  getUpcomingBookings = catchAsync(async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { limit = 5 } = req.query;

    const bookings = await this.enhancedBookingService.getUpcomingBookings(
      userId,
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      message: "Upcoming bookings retrieved successfully",
      data: bookings,
    });
  });

  // Get ongoing bookings
  getOngoingBookings = catchAsync(async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;

    const bookings = await this.enhancedBookingService.getOngoingBookings(
      userId
    );

    res.status(200).json({
      success: true,
      message: "Ongoing bookings retrieved successfully",
      data: bookings,
    });
  });

  // Cancel booking
  cancelBooking = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    const booking = await this.enhancedBookingService.cancelBooking(
      bookingId,
      userId,
      reason,
      "user"
    );

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        bookingId: booking._id,
        status: booking.status,
        cancellation: booking.cancellation,
      },
    });
  });

  // Reschedule booking
  rescheduleBooking = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId } = req.params;
    const { newDate, newTime, reason } = req.body;
    const userId = req.user!.id;

    const booking = await this.enhancedBookingService.rescheduleBooking(
      bookingId,
      userId,
      new Date(newDate),
      newTime,
      reason
    );

    res.status(200).json({
      success: true,
      message: "Booking rescheduled successfully",
      data: {
        bookingId: booking._id,
        newDate: booking.bookingDetails.scheduledDate,
        newTime: booking.bookingDetails.scheduledTime,
        statusHistory: booking.jobStatus.statusHistory,
      },
    });
  });

  // Generate invoice/receipt
  generateInvoice = catchAsync(async (req: IAuthRequest, res: Response) => {
    const { bookingId } = req.params;
    const userId = req.user!.id;

    const invoice = await this.enhancedBookingService.generateInvoice(
      bookingId,
      userId
    );

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.filename}"`
    );
    res.setHeader("Content-Length", invoice.pdfBuffer.length);

    res.status(200).send(invoice.pdfBuffer);
  });

  // Get booking summary statistics
  getBookingSummary = catchAsync(async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;

    // Get a single booking to extract summary
    const result = await this.enhancedBookingService.getUserBookingHistory(
      userId,
      { limit: 1 }
    );

    res.status(200).json({
      success: true,
      message: "Booking summary retrieved successfully",
      data: {
        summary: result.summary,
      },
    });
  });

  // Get booking by status
  getBookingsByStatus = catchAsync(async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const filters: any = { status };
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await this.enhancedBookingService.getUserBookingHistory(
      userId,
      filters
    );

    res.status(200).json({
      success: true,
      message: `${status} bookings retrieved successfully`,
      data: {
        bookings: result.bookings,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  });

  // Get recent bookings
  getRecentBookings = catchAsync(async (req: IAuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { limit = 10 } = req.query;

    const result = await this.enhancedBookingService.getUserBookingHistory(
      userId,
      { limit: parseInt(limit as string) }
    );

    res.status(200).json({
      success: true,
      message: "Recent bookings retrieved successfully",
      data: {
        bookings: result.bookings,
        total: result.total,
      },
    });
  });
}
