import { Request, Response, NextFunction } from "express";
import { AdminPaymentService } from "../services/AdminPaymentService";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { validateObjectId } from "../utils/validation";

export class AdminPaymentController {
  private adminPaymentService: AdminPaymentService;

  constructor() {
    this.adminPaymentService = new AdminPaymentService();
  }

  // ==================== PAYOUT MANAGEMENT ====================

  /**
   * Get all withdrawal requests with filtering
   */
  getWithdrawalRequests = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        status,
        providerId,
        dateFrom,
        dateTo,
        paymentMethod,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (providerId) filters.providerId = providerId;
      if (paymentMethod) filters.paymentMethod = paymentMethod;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);

      const result = await this.adminPaymentService.getWithdrawalRequests(filters);

      res.status(200).json({
        status: "success",
        data: result,
      });
    }
  );

  /**
   * Approve a withdrawal request
   */
  approveWithdrawalRequest = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { adminNotes } = req.body;

      if (!id || !validateObjectId(id)) {
        return next(new AppError("Invalid withdrawal request ID", 400));
      }

      const withdrawal = await this.adminPaymentService.approveWithdrawalRequest(
        id,
        adminNotes
      );

      res.status(200).json({
        status: "success",
        message: "Withdrawal request approved successfully",
        data: withdrawal,
      });
    }
  );

  /**
   * Reject a withdrawal request
   */
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

      const withdrawal = await this.adminPaymentService.rejectWithdrawalRequest(
        id,
        reason,
        adminNotes
      );

      res.status(200).json({
        status: "success",
        message: "Withdrawal request rejected successfully",
        data: withdrawal,
      });
    }
  );

  /**
   * Get payout statistics
   */
  getPayoutStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await this.adminPaymentService.getPayoutStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  // ==================== REVENUE & COMMISSION MANAGEMENT ====================

  /**
   * Get revenue statistics
   */
  getRevenueStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period = "month" } = req.query;

      const stats = await this.adminPaymentService.getRevenueStats(period as string);

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  /**
   * Get commission statistics
   */
  getCommissionStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await this.adminPaymentService.getCommissionStats();

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  // ==================== PAYMENT ANALYTICS ====================

  /**
   * Get payment analytics
   */
  getPaymentAnalytics = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period = "month" } = req.query;

      const analytics = await this.adminPaymentService.getPaymentAnalytics(period as string);

      res.status(200).json({
        status: "success",
        data: analytics,
      });
    }
  );

  // ==================== INTEGRATION MANAGEMENT ====================

  /**
   * Get payment integration status
   */
  getPaymentIntegrationStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const status = await this.adminPaymentService.getPaymentIntegrationStatus();

      res.status(200).json({
        status: "success",
        data: status,
      });
    }
  );

  /**
   * Update payment integration settings
   */
  updatePaymentIntegrationSettings = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { settings } = req.body;

      const result = await this.adminPaymentService.updatePaymentIntegrationSettings(settings);

      res.status(200).json({
        status: "success",
        message: result.message,
      });
    }
  );

  // ==================== REPORTS & ANALYTICS ====================

  /**
   * Get daily revenue report
   */
  getDailyRevenueReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      // This would typically call a more detailed daily report method
      const stats = await this.adminPaymentService.getRevenueStats("day");

      res.status(200).json({
        status: "success",
        data: {
          date: targetDate.toISOString().split('T')[0],
          ...stats,
        },
      });
    }
  );

  /**
   * Get weekly revenue report
   */
  getWeeklyRevenueReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await this.adminPaymentService.getRevenueStats("week");

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  /**
   * Get monthly revenue report
   */
  getMonthlyRevenueReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await this.adminPaymentService.getRevenueStats("month");

      res.status(200).json({
        status: "success",
        data: stats,
      });
    }
  );

  /**
   * Get top services report
   */
  getTopServicesReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period = "month", limit = 10 } = req.query;

      // Placeholder implementation - would typically aggregate from bookings/payments
      const topServices = [
        {
          serviceId: "1",
          serviceName: "House Cleaning",
          totalRevenue: 15000,
          totalBookings: 150,
          averageRating: 4.5,
        },
        {
          serviceId: "2",
          serviceName: "Plumbing",
          totalRevenue: 12000,
          totalBookings: 80,
          averageRating: 4.3,
        },
        {
          serviceId: "3",
          serviceName: "Electrical",
          totalRevenue: 10000,
          totalBookings: 60,
          averageRating: 4.7,
        },
      ];

      res.status(200).json({
        status: "success",
        data: {
          period: period as string,
          topServices: topServices.slice(0, parseInt(limit as string)),
        },
      });
    }
  );

  /**
   * Get top vendors report
   */
  getTopVendorsReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period = "month", limit = 10 } = req.query;

      // Get top earning providers from commission stats
      const commissionStats = await this.adminPaymentService.getCommissionStats();

      res.status(200).json({
        status: "success",
        data: {
          period: period as string,
          topVendors: commissionStats.topEarningProviders.slice(0, parseInt(limit as string)),
        },
      });
    }
  );

  /**
   * Get customer activity report
   */
  getCustomerActivityReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period = "month" } = req.query;

      // Placeholder implementation - would typically aggregate from bookings/users
      const customerActivity = {
        totalCustomers: 1250,
        activeCustomers: 850,
        newCustomers: 120,
        repeatCustomers: 730,
        averageBookingsPerCustomer: 2.5,
        customerRetentionRate: 68.5,
        topCustomerSegments: [
          { segment: "Premium", count: 250, revenue: 45000 },
          { segment: "Regular", count: 600, revenue: 35000 },
          { segment: "Occasional", count: 400, revenue: 20000 },
        ],
      };

      res.status(200).json({
        status: "success",
        data: {
          period: period as string,
          ...customerActivity,
        },
      });
    }
  );

  /**
   * Get usage analytics
   */
  getUsageAnalytics = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { period = "month" } = req.query;

      // Placeholder implementation - would typically aggregate from various sources
      const usageAnalytics = {
        totalBookings: 2500,
        completedBookings: 2300,
        cancelledBookings: 150,
        disputedBookings: 50,
        averageBookingValue: 85.50,
        peakBookingHours: [
          { hour: "09:00", bookings: 180 },
          { hour: "10:00", bookings: 220 },
          { hour: "14:00", bookings: 200 },
          { hour: "15:00", bookings: 190 },
        ],
        popularServiceCategories: [
          { category: "Cleaning", bookings: 800, revenue: 68000 },
          { category: "Repairs", bookings: 600, revenue: 72000 },
          { category: "Installation", bookings: 400, revenue: 48000 },
        ],
        platformUsage: {
          mobileApp: 65,
          webApp: 30,
          phone: 5,
        },
      };

      res.status(200).json({
        status: "success",
        data: {
          period: period as string,
          ...usageAnalytics,
        },
      });
    }
  );
} 