import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";
import { ServiceService } from "../services/ServiceService";
import { BookingService } from "../services/BookingService";
import { PaymentService } from "../services/PaymentService";
import { NotificationService } from "../services/NotificationService";
import { AnalyticsService } from "../services/AnalyticsService";
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

  constructor() {
    this.userService = new UserService();
    this.serviceService = new ServiceService();
    this.bookingService = new BookingService();
    this.paymentService = new PaymentService();
    this.notificationService = new NotificationService();
    this.analyticsService = new AnalyticsService();
  }

  // User Management
  // Get all users with pagination and filters
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

  // Get user by ID
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

  // Update user status
  updateUserStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid user ID", 400));
      }

      if (!["active", "suspended", "blocked"].includes(status)) {
        return next(new AppError("Invalid status", 400));
      }

      const user = await this.userService.updateUserStatus(id, status, reason);
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      // Send notification to user
      await this.notificationService.sendNotification({
        recipient: id,
        type: "account_status_change",
        title: "Account Status Updated",
        message: `Your account status has been updated to ${status}. ${
          reason ? `Reason: ${reason}` : ""
        }`,
        metadata: { status, reason },
      });

      res.status(200).json({
        status: "success",
        message: "User status updated successfully",
        data: user,
      });
    }
  );

  // Verify provider documents
  verifyProviderDocuments = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { verificationStatus, rejectionReason, adminNotes } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid provider ID", 400));
      }

      if (!["approved", "rejected", "pending"].includes(verificationStatus)) {
        return next(new AppError("Invalid verification status", 400));
      }

      const provider = await this.userService.verifyProviderDocuments(
        id,
        verificationStatus,
        rejectionReason,
        adminNotes
      );

      if (!provider) {
        return next(new AppError("Provider not found", 404));
      }

      // Send notification to provider
      const notificationType =
        verificationStatus === "approved"
          ? "verification_approved"
          : "verification_rejected";
      const title =
        verificationStatus === "approved"
          ? "Verification Approved"
          : "Verification Rejected";
      const message =
        verificationStatus === "approved"
          ? "Your account verification has been approved. You can now start providing services."
          : `Your account verification has been rejected. Reason: ${rejectionReason}`;

      await this.notificationService.sendNotification({
        recipient: id,
        type: notificationType,
        title,
        message,
        metadata: { verificationStatus, rejectionReason, adminNotes },
      });

      res.status(200).json({
        status: "success",
        message: "Provider verification status updated successfully",
        data: provider,
      });
    }
  );

  // Service Management
  // Get all services with pagination and filters
  getAllServices = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const filters: any = {};
      if (category) filters.category = category;
      if (status) filters.status = status;
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

  // Update service status
  updateServiceStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid service ID", 400));
      }

      if (!["active", "inactive", "suspended"].includes(status)) {
        return next(new AppError("Invalid status", 400));
      }

      const service = await this.serviceService.updateServiceStatus(
        id,
        status,
        reason
      );
      if (!service) {
        return next(new AppError("Service not found", 404));
      }

      // Send notification to provider
      await this.notificationService.sendNotification({
        recipient: service.provider.toString(),
        type: "service_status_change",
        title: "Service Status Updated",
        message: `Your service "${
          service.title
        }" status has been updated to ${status}. ${
          reason ? `Reason: ${reason}` : ""
        }`,
        metadata: { serviceId: id, status, reason },
      });

      res.status(200).json({
        status: "success",
        message: "Service status updated successfully",
        data: service,
      });
    }
  );

  // Service Category Management
  // Create service category
  createServiceCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        name,
        description,
        icon,
        commissionRate,
        isActive = true,
      } = req.body;

      if (!name) {
        return next(new AppError("Category name is required", 400));
      }

      const category = await this.serviceService.createServiceCategory({
        name,
        description,
        icon,
        commissionRate: parseFloat(commissionRate) || 0,
        isActive,
      });

      res.status(201).json({
        status: "success",
        message: "Service category created successfully",
        data: category,
      });
    }
  );

  // Update service category
  updateServiceCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid category ID", 400));
      }

      const category = await this.serviceService.updateServiceCategory(
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

  // Delete service category
  deleteServiceCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid category ID", 400));
      }

      const result = await this.serviceService.deleteServiceCategory(id);
      if (!result) {
        return next(new AppError("Service category not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Service category deleted successfully",
      });
    }
  );

  // Booking Management
  // Get all bookings with pagination and filters
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

  // Get booking by ID
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

  // Handle booking dispute
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
  // Get all withdrawal requests
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

  // Approve withdrawal request
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

      // Send notification to provider
      await this.notificationService.sendNotification({
        recipient: withdrawal.provider.toString(),
        type: "withdrawal_approved",
        title: "Withdrawal Approved",
        message: `Your withdrawal request for ${withdrawal.amount} GHS has been approved and processed.`,
        metadata: { withdrawalId: id, amount: withdrawal.amount, adminNotes },
      });

      res.status(200).json({
        status: "success",
        message: "Withdrawal request approved successfully",
        data: withdrawal,
      });
    }
  );

  // Reject withdrawal request
  rejectWithdrawalRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { rejectionReason, adminNotes } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid withdrawal request ID", 400));
      }

      if (!rejectionReason) {
        return next(new AppError("Rejection reason is required", 400));
      }

      const withdrawal = await this.paymentService.rejectWithdrawalRequest(
        id,
        rejectionReason,
        adminNotes
      );
      if (!withdrawal) {
        return next(new AppError("Withdrawal request not found", 404));
      }

      // Send notification to provider
      await this.notificationService.sendNotification({
        recipient: withdrawal.provider.toString(),
        type: "withdrawal_rejected",
        title: "Withdrawal Rejected",
        message: `Your withdrawal request for ${withdrawal.amount} GHS has been rejected. Reason: ${rejectionReason}`,
        metadata: {
          withdrawalId: id,
          amount: withdrawal.amount,
          rejectionReason,
          adminNotes,
        },
      });

      res.status(200).json({
        status: "success",
        message: "Withdrawal request rejected successfully",
        data: withdrawal,
      });
    }
  );

  // Analytics and Reports
  // Get dashboard overview
  getDashboardOverview = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period = "monthly" } = req.query;

      const [revenueReport, userReport, serviceReport, latestAnalytics] =
        await Promise.all([
          this.analyticsService.getRevenueReport({ period: period as any }),
          this.analyticsService.getUserReport({ period: period as any }),
          this.analyticsService.getServiceReport({ period: period as any }),
          this.analyticsService.getLatestAnalytics(period as string),
        ]);

      res.status(200).json({
        status: "success",
        data: {
          revenueReport,
          userReport,
          serviceReport,
          latestAnalytics,
        },
      });
    }
  );

  // Get revenue report
  getRevenueReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period, startDate, endDate, categoryId, location } = req.query;

      const filters: any = {};
      if (period) filters.period = period;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (categoryId) filters.categoryId = categoryId;
      if (location) filters.location = location;

      const report = await this.analyticsService.getRevenueReport(filters);

      res.status(200).json({
        status: "success",
        data: report,
      });
    }
  );

  // Get user report
  getUserReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period, startDate, endDate } = req.query;

      const filters: any = {};
      if (period) filters.period = period;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const report = await this.analyticsService.getUserReport(filters);

      res.status(200).json({
        status: "success",
        data: report,
      });
    }
  );

  // Get service report
  getServiceReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period, startDate, endDate, categoryId } = req.query;

      const filters: any = {};
      if (period) filters.period = period;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (categoryId) filters.categoryId = categoryId;

      const report = await this.analyticsService.getServiceReport(filters);

      res.status(200).json({
        status: "success",
        data: report,
      });
    }
  );

  // Generate analytics
  generateAnalytics = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period, date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      let analytics;
      switch (period) {
        case "daily":
          analytics = await this.analyticsService.generateDailyAnalytics(
            targetDate
          );
          break;
        case "weekly":
          analytics = await this.analyticsService.generateWeeklyAnalytics(
            targetDate
          );
          break;
        case "monthly":
          analytics = await this.analyticsService.generateMonthlyAnalytics(
            targetDate
          );
          break;
        default:
          return next(
            new AppError(
              "Invalid period. Must be daily, weekly, or monthly",
              400
            )
          );
      }

      res.status(200).json({
        status: "success",
        message: `${period} analytics generated successfully`,
        data: analytics,
      });
    }
  );

  // System Settings
  // Update system settings
  updateSystemSettings = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        platformFee,
        minimumWithdrawal,
        maximumWithdrawal,
        autoApprovalThreshold,
      } = req.body;

      // This would typically update a settings collection or environment variables
      // For now, we'll just return a success message
      const settings = {
        platformFee: parseFloat(platformFee) || 0.05,
        minimumWithdrawal: parseFloat(minimumWithdrawal) || 50,
        maximumWithdrawal: parseFloat(maximumWithdrawal) || 10000,
        autoApprovalThreshold: parseFloat(autoApprovalThreshold) || 1000,
        updatedAt: new Date(),
      };

      res.status(200).json({
        status: "success",
        message: "System settings updated successfully",
        data: settings,
      });
    }
  );

  // Get system settings
  getSystemSettings = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // This would typically fetch from a settings collection
      // For now, we'll return default values
      const settings = {
        platformFee: 0.05,
        minimumWithdrawal: 50,
        maximumWithdrawal: 10000,
        autoApprovalThreshold: 1000,
        currency: "GHS",
        timezone: "Africa/Accra",
        updatedAt: new Date(),
      };

      res.status(200).json({
        status: "success",
        data: settings,
      });
    }
  );
}
