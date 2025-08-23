import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";
import { ServiceService } from "../services/ServiceService";
import { BookingService } from "../services/BookingService";
import { PaymentService } from "../services/PaymentService";
import { NotificationService } from "../services/NotificationService";
import { AnalyticsService } from "../services/AnalyticsService";
import { AdminService } from "../services/AdminService";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { validateObjectId } from "../utils/validation";

export class AdminController {
  private userService: UserService;
  private serviceService: ServiceService;
  private bookingService: BookingService;
  private paymentService: PaymentService;
  private notificationService: NotificationService;
  private analyticsService: AnalyticsService;
  private adminService: AdminService;

  constructor() {
    this.userService = new UserService();
    this.serviceService = new ServiceService();
    this.bookingService = new BookingService();
    this.paymentService = new PaymentService();
    this.notificationService = new NotificationService();
    this.analyticsService = new AnalyticsService();
    this.adminService = new AdminService();
  }

  // ==================== SERVICE & CATEGORY MANAGEMENT ====================

  /**
   * Create a new service category
   */
  createServiceCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        name,
        description,
        icon,
        parentCategory,
        commissionRate,
        isActive = true,
        sortOrder = 0,
      } = req.body;

      if (!name || !description) {
        return next(new AppError("Name and description are required", 400));
      }

      const category = await this.adminService.createServiceCategory({
        name,
        description,
        icon,
        parentCategory,
        commissionRate: parseFloat(commissionRate) || 10,
        isActive,
        sortOrder,
      });

      res.status(201).json({
        status: "success",
        message: "Service category created successfully",
        data: category,
      });
    }
  );

  /**
   * Update service category
   */
  updateServiceCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid category ID", 400));
      }

      const category = await this.adminService.updateServiceCategory(
        id,
        updateData
      );
      if (!category) {
        return next(new AppError("Service category not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Service category updated successfully",
        data: category,
      });
    }
  );

  /**
   * Delete service category
   */
  deleteServiceCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid category ID", 400));
      }

      const result = await this.adminService.deleteServiceCategory(id);
      if (!result) {
        return next(new AppError("Service category not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Service category deleted successfully",
      });
    }
  );

  /**
   * Set commission rate for a service category
   */
  setCategoryCommissionRate = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { commissionRate } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid category ID", 400));
      }

      if (
        commissionRate === undefined ||
        commissionRate < 0 ||
        commissionRate > 100
      ) {
        return next(
          new AppError("Commission rate must be between 0 and 100", 400)
        );
      }

      const category = await this.adminService.setCategoryCommissionRate(
        id,
        commissionRate
      );
      if (!category) {
        return next(new AppError("Service category not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Commission rate updated successfully",
        data: category,
      });
    }
  );

  /**
   * Get service category statistics
   */
  getServiceCategoryStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await this.adminService.getServiceCategoryStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  // ==================== BOOKING MANAGEMENT ====================

  /**
   * Get live booking statistics
   */
  getLiveBookingStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await this.adminService.getLiveBookingStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  /**
   * Monitor live bookings with real-time updates
   */
  getLiveBookings = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await this.adminService.getLiveBookings(filters);

      res.status(200).json({
        status: "success",
        data: result,
      });
    }
  );

  /**
   * Handle booking cancellation with refund processing
   */
  handleBookingCancellation = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const {
        reason,
        refundAmount,
        adminNotes,
        notifyParties = true,
      } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid booking ID", 400));
      }

      if (!reason) {
        return next(new AppError("Cancellation reason is required", 400));
      }

      const booking = await this.adminService.handleBookingCancellation(id, {
        reason,
        ...(refundAmount && { refundAmount: parseFloat(refundAmount) }),
        ...(adminNotes && { adminNotes }),
        ...(notifyParties !== undefined && { notifyParties }),
      });

      if (!booking) {
        return next(new AppError("Booking not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Booking cancelled successfully",
        data: booking,
      });
    }
  );

  /**
   * Process refund for a booking
   */
  processBookingRefund = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { amount, reason, adminNotes, notifyParties = true } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid booking ID", 400));
      }

      if (!amount || amount <= 0) {
        return next(new AppError("Valid refund amount is required", 400));
      }

      if (!reason) {
        return next(new AppError("Refund reason is required", 400));
      }

      const booking = await this.adminService.processBookingRefund(id, {
        amount: parseFloat(amount),
        reason,
        adminNotes,
        notifyParties,
      });

      if (!booking) {
        return next(new AppError("Booking not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Refund processed successfully",
        data: booking,
      });
    }
  );

  /**
   * Escalate dispute to higher authority
   */
  escalateDispute = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { escalatedTo, reason, adminNotes, priority = "medium" } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid booking ID", 400));
      }

      if (!escalatedTo || !reason) {
        return next(
          new AppError("Escalation target and reason are required", 400)
        );
      }

      if (!["low", "medium", "high", "urgent"].includes(priority)) {
        return next(new AppError("Invalid priority level", 400));
      }

      const booking = await this.adminService.escalateDispute(id, {
        escalatedTo,
        reason,
        adminNotes,
        priority: priority as "low" | "medium" | "high" | "urgent",
      });

      if (!booking) {
        return next(new AppError("Booking not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Dispute escalated successfully",
        data: booking,
      });
    }
  );

  /**
   * Resolve dispute with final decision
   */
  resolveDispute = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { resolution, adminNotes, refundAmount, penaltyAmount } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid booking ID", 400));
      }

      if (
        !resolution ||
        ![
          "resolved",
          "customer_favored",
          "provider_favored",
          "partial_refund",
        ].includes(resolution)
      ) {
        return next(new AppError("Valid resolution is required", 400));
      }

      if (!adminNotes) {
        return next(new AppError("Admin notes are required", 400));
      }

      const booking = await this.adminService.resolveDispute(id, {
        bookingId: id,
        resolution: resolution as
          | "resolved"
          | "customer_favored"
          | "provider_favored"
          | "partial_refund",
        adminNotes,
        ...(refundAmount && { refundAmount: parseFloat(refundAmount) }),
        ...(penaltyAmount && { penaltyAmount: parseFloat(penaltyAmount) }),
      });

      if (!booking) {
        return next(new AppError("Booking not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Dispute resolved successfully",
        data: booking,
      });
    }
  );

  /**
   * Get dispute statistics and trends
   */
  getDisputeStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await this.adminService.getDisputeStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  // ==================== EXISTING METHODS (KEPT FOR COMPATIBILITY) ====================

  // User Management
  getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        page = 1,
        limit = 10,
        role,
        status,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const filters: any = {};
      if (role) filters.role = role;
      if (status) filters.status = status;
      if (search) {
        filters.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      const sort: any = {};
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const result = await this.userService.getAllUsers(
        parseInt(page as string),
        parseInt(limit as string),
        filters,
        sort
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    }
  );

  getUserById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid user ID", 400));
      }

      const user = await this.userService.getUserById(id);
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      res.status(200).json({
        status: "success",
        data: user,
      });
    }
  );

  updateUserStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid user ID", 400));
      }

      const user = await this.userService.updateUserStatus(id, status, reason);
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "User status updated successfully",
        data: user,
      });
    }
  );

  verifyProviderDocuments = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { isVerified, reason } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid user ID", 400));
      }

      const user = await this.userService.verifyProviderDocuments(
        id,
        isVerified,
        reason
      );
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: `Provider verification ${
          isVerified ? "approved" : "rejected"
        }`,
        data: user,
      });
    }
  );

  // Service Management
  getAllServices = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        page = 1,
        limit = 10,
        status,
        category,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const sort: any = {};
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const result = await this.serviceService.getAllServices(
        parseInt(page as string),
        parseInt(limit as string),
        filters,
        sort
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    }
  );

  updateServiceStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid service ID", 400));
      }

      const service = await this.serviceService.updateServiceStatus(
        id,
        status,
        reason
      );
      if (!service) {
        return next(new AppError("Service not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Service status updated successfully",
        data: service,
      });
    }
  );

  // Booking Management (Legacy methods)
  getAllBookings = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        page = 1,
        limit = 10,
        status,
        dateFrom,
        dateTo,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (dateFrom || dateTo) {
        filters.createdAt = {};
        if (dateFrom) filters.createdAt.$gte = new Date(dateFrom as string);
        if (dateTo) filters.createdAt.$lte = new Date(dateTo as string);
      }
      if (search) {
        filters.$or = [
          { "service.title": { $regex: search, $options: "i" } },
          { "customer.firstName": { $regex: search, $options: "i" } },
          { "provider.firstName": { $regex: search, $options: "i" } },
        ];
      }

      const sort: any = {};
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const result = await this.bookingService.getAllBookings(
        parseInt(page as string),
        parseInt(limit as string),
        filters,
        sort
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    }
  );

  getBookingById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid booking ID", 400));
      }

      const booking = await this.bookingService.getBookingById(id);
      if (!booking) {
        return next(new AppError("Booking not found", 404));
      }

      res.status(200).json({
        status: "success",
        data: booking,
      });
    }
  );

  handleBookingDispute = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { resolution, adminNotes, refundAmount, penaltyAmount } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid booking ID", 400));
      }

      if (
        ![
          "resolved",
          "customer_favored",
          "provider_favored",
          "partial_refund",
        ].includes(resolution)
      ) {
        return next(new AppError("Invalid resolution", 400));
      }

      const booking = await this.bookingService.resolveDispute(
        id,
        resolution,
        adminNotes,
        refundAmount,
        penaltyAmount
      );

      if (!booking) {
        return next(new AppError("Booking not found", 404));
      }

      // Send notifications to both parties
      const notifications = [];

      if (booking.userId) {
        notifications.push({
          recipient: booking.userId.toString(),
          type: "dispute_resolved",
          title: "Dispute Resolved",
          message: `Your dispute for booking #${booking._id} has been resolved. Resolution: ${resolution}`,
          metadata: { bookingId: id, resolution, adminNotes },
        });
      }

      if (booking.providerId) {
        notifications.push({
          recipient: booking.providerId.toString(),
          type: "dispute_resolved",
          title: "Dispute Resolved",
          message: `The dispute for booking #${booking._id} has been resolved. Resolution: ${resolution}`,
          metadata: { bookingId: id, resolution, adminNotes },
        });
      }

      await Promise.all(
        notifications.map((notification) =>
          this.notificationService.sendNotification(notification)
        )
      );

      res.status(200).json({
        status: "success",
        message: "Dispute resolved successfully",
        data: booking,
      });
    }
  );

  // Payment Management
  getAllWithdrawalRequests = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        page = 1,
        limit = 10,
        status,
        dateFrom,
        dateTo,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (dateFrom || dateTo) {
        filters.createdAt = {};
        if (dateFrom) filters.createdAt.$gte = new Date(dateFrom as string);
        if (dateTo) filters.createdAt.$lte = new Date(dateTo as string);
      }

      const sort: any = {};
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const result = await this.paymentService.getAllWithdrawalRequests(
        parseInt(page as string),
        parseInt(limit as string),
        filters,
        sort
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    }
  );

  approveWithdrawalRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { adminNotes } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid withdrawal request ID", 400));
      }

      const withdrawal = await this.paymentService.approveWithdrawalRequest(
        id,
        adminNotes
      );

      if (!withdrawal) {
        return next(new AppError("Withdrawal request not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Withdrawal request approved successfully",
        data: withdrawal,
      });
    }
  );

  rejectWithdrawalRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { reason, adminNotes } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid withdrawal request ID", 400));
      }

      if (!reason) {
        return next(new AppError("Rejection reason is required", 400));
      }

      const withdrawal = await this.paymentService.rejectWithdrawalRequest(
        id,
        reason,
        adminNotes
      );

      if (!withdrawal) {
        return next(new AppError("Withdrawal request not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Withdrawal request rejected successfully",
        data: withdrawal,
      });
    }
  );

  // Analytics and Reports
  getDashboardOverview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // Placeholder implementation - replace with actual analytics service method
      const overview = {
        totalUsers: 0,
        totalServices: 0,
        totalBookings: 0,
        totalRevenue: 0,
        activeProviders: 0,
        pendingBookings: 0,
      };

      res.status(200).json({
        status: "success",
        data: overview,
      });
    }
  );

  getRevenueReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period } = req.query;

      // Placeholder implementation - replace with actual analytics service method
      const report = {
        period: period as string,
        totalRevenue: 0,
        revenueByPeriod: [],
        growthRate: 0,
      };

      res.status(200).json({
        status: "success",
        data: report,
      });
    }
  );

  getUserReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period } = req.query;

      // Placeholder implementation - replace with actual analytics service method
      const report = {
        period: period as string,
        totalUsers: 0,
        newUsers: 0,
        activeUsers: 0,
        userGrowth: 0,
      };

      res.status(200).json({
        status: "success",
        data: report,
      });
    }
  );

  getServiceReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period } = req.query;

      // Placeholder implementation - replace with actual analytics service method
      const report = {
        period: period as string,
        totalServices: 0,
        activeServices: 0,
        popularCategories: [],
        serviceGrowth: 0,
      };

      res.status(200).json({
        status: "success",
        data: report,
      });
    }
  );

  generateAnalytics = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { type, filters, dateRange } = req.body;

      // Placeholder implementation - replace with actual analytics service method
      const analytics = {
        type,
        filters,
        dateRange,
        data: [],
        summary: {},
      };

      res.status(200).json({
        status: "success",
        data: analytics,
      });
    }
  );

  // System Settings
  getSystemSettings = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // Placeholder implementation - replace with actual system settings service
      const settings = {
        platformFee: 0.1,
        minimumWithdrawal: 10,
        maximumWithdrawal: 10000,
        autoApprovalThreshold: 100,
        currency: "USD",
        timezone: "UTC",
        defaultCommissionRate: 10,
        disputeResolutionTime: 72,
        maxCancellationTime: 24,
      };

      res.status(200).json({
        status: "success",
        data: settings,
      });
    }
  );

  updateSystemSettings = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { settings } = req.body;

      // Placeholder implementation - replace with actual system settings service
      const updatedSettings = {
        ...settings,
        updatedAt: new Date(),
      };

      res.status(200).json({
        status: "success",
        message: "System settings updated successfully",
        data: updatedSettings,
      });
    }
  );
}
