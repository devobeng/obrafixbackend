import {
  IAnalytics,
  IUser,
  IBooking,
  IService,
  IServiceCategory,
} from "../types";
import { Analytics } from "../models/Analytics";
import { User } from "../models/User";
import { Booking } from "../models/Booking";
import { Service } from "../models/Service";
import { ServiceCategory } from "../models/ServiceCategory";
import { WalletTransaction } from "../models/WalletTransaction";
import { WithdrawalRequest } from "../models/WithdrawalRequest";
import { AppError } from "../utils/AppError";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsFilters {
  period?: "daily" | "weekly" | "monthly" | "yearly";
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  location?: string;
}

export interface RevenueReport {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  revenueByCategory: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByLocation: Array<{
    city: string;
    state: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByTime: Array<{
    period: string;
    revenue: number;
    bookings: number;
  }>;
}

export interface UserReport {
  totalUsers: number;
  totalProviders: number;
  totalAdmins: number;
  newRegistrations: number;
  activeUsers: number;
  userGrowth: number;
  topProviders: Array<{
    providerId: string;
    providerName: string;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
  }>;
}

export interface ServiceReport {
  totalServices: number;
  activeServices: number;
  servicesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    averageRating: number;
  }>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
  }>;
}

export class AnalyticsService {
  // Generate daily analytics
  async generateDailyAnalytics(date: Date = new Date()): Promise<IAnalytics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const metrics = await this.calculateMetrics(startOfDay, endOfDay);
    const breakdowns = await this.calculateBreakdowns(startOfDay, endOfDay);

    const analytics = new Analytics({
      date: startOfDay,
      period: "daily",
      year: startOfDay.getFullYear(),
      month: startOfDay.getMonth() + 1,
      day: startOfDay.getDate(),
      metrics,
      ...breakdowns,
      isProcessed: true,
      lastUpdated: new Date(),
    });

    await analytics.save();
    return analytics;
  }

  // Generate weekly analytics
  async generateWeeklyAnalytics(date: Date = new Date()): Promise<IAnalytics> {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const metrics = await this.calculateMetrics(startOfWeek, endOfWeek);
    const breakdowns = await this.calculateBreakdowns(startOfWeek, endOfWeek);

    const analytics = new Analytics({
      date: startOfWeek,
      period: "weekly",
      year: startOfWeek.getFullYear(),
      month: startOfWeek.getMonth() + 1,
      week: this.getWeekNumber(startOfWeek),
      metrics,
      ...breakdowns,
      isProcessed: true,
      lastUpdated: new Date(),
    });

    await analytics.save();
    return analytics;
  }

  // Generate monthly analytics
  async generateMonthlyAnalytics(date: Date = new Date()): Promise<IAnalytics> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const metrics = await this.calculateMetrics(startOfMonth, endOfMonth);
    const breakdowns = await this.calculateBreakdowns(startOfMonth, endOfMonth);

    const analytics = new Analytics({
      date: startOfMonth,
      period: "monthly",
      year: startOfMonth.getFullYear(),
      month: startOfMonth.getMonth() + 1,
      metrics,
      ...breakdowns,
      isProcessed: true,
      lastUpdated: new Date(),
    });

    await analytics.save();
    return analytics;
  }

  // Calculate metrics for a date range
  private async calculateMetrics(startDate: Date, endDate: Date) {
    const [
      totalRevenue,
      totalBookings,
      totalServices,
      totalUsers,
      totalProviders,
      totalAdmins,
      platformFees,
      totalWithdrawals,
      pendingWithdrawals,
      activeServices,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      newRegistrations,
      activeUsers,
      totalReviews,
      averageRating,
    ] = await Promise.all([
      // Revenue calculations
      WalletTransaction.aggregate([
        {
          $match: {
            type: "credit",
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).then((result: any[]) => result[0]?.total || 0),

      // Booking counts
      Booking.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),

      // Service counts
      Service.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),

      // User counts
      User.countDocuments({
        role: "user",
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      User.countDocuments({
        role: "provider",
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      User.countDocuments({
        role: "admin",
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // Platform fees
      WalletTransaction.aggregate([
        {
          $match: {
            "metadata.platformFee": { $exists: true },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: null, total: { $sum: "$metadata.platformFee" } } },
      ]).then((result: any[]) => result[0]?.total || 0),

      // Withdrawal counts
      WithdrawalRequest.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      WithdrawalRequest.countDocuments({
        status: "pending",
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // Service status counts
      Service.countDocuments({
        status: "active",
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      Booking.countDocuments({
        status: "completed",
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      Booking.countDocuments({
        status: "cancelled",
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      Booking.countDocuments({
        "dispute.isDisputed": true,
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // User engagement
      User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      User.countDocuments({ lastLoginAt: { $gte: startDate, $lte: endDate } }),

      // Review metrics
      Service.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$rating.count" },
            avg: { $avg: "$rating.average" },
          },
        },
      ]).then((result: any[]) => ({
        total: result[0]?.total || 0,
        average: result[0]?.avg || 0,
      })),
    ]);

    return {
      totalRevenue,
      totalBookings,
      totalServices,
      totalUsers,
      totalProviders,
      totalAdmins,
      platformFees,
      totalWithdrawals,
      pendingWithdrawals,
      activeServices,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      newRegistrations,
      activeUsers,
      totalReviews,
      averageRating,
      topServices: [],
      topProviders: [],
      topCategories: [],
    };
  }

  // Calculate breakdowns for a date range
  private async calculateBreakdowns(startDate: Date, endDate: Date) {
    const [
      categoryBreakdown,
      locationBreakdown,
      hourlyBreakdown,
      dailyBreakdown,
    ] = await Promise.all([
      // Category breakdown
      Service.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $lookup: {
            from: "servicecategories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $group: {
            _id: "$category",
            categoryName: { $first: "$categoryInfo.name" },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$pricing.amount" },
            averageRating: { $avg: "$rating.average" },
            totalServices: { $sum: 1 },
          },
        },
      ]),

      // Location breakdown
      User.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { city: "$address.city", state: "$address.state" },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: 0 }, // Would need to join with bookings
            totalUsers: { $sum: 1 },
            totalProviders: {
              $sum: { $cond: [{ $eq: ["$role", "provider"] }, 1, 0] },
            },
          },
        },
      ]),

      // Hourly breakdown
      Booking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$pricing.totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Daily breakdown
      Booking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dayOfMonth: "$createdAt" },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: "$pricing.totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      categoryBreakdown: categoryBreakdown.map((item: any) => ({
        categoryId: item._id,
        categoryName: item.categoryName[0] || "Unknown",
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue,
        averageRating: item.averageRating,
        totalServices: item.totalServices,
      })),
      locationBreakdown: locationBreakdown.map((item: any) => ({
        city: item._id.city || "Unknown",
        state: item._id.state || "Unknown",
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue,
        totalUsers: item.totalUsers,
        totalProviders: item.totalProviders,
      })),
      hourlyBreakdown: hourlyBreakdown.map((item: any) => ({
        hour: item._id,
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue,
      })),
      dailyBreakdown: dailyBreakdown.map((item: any) => ({
        day: item._id,
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue,
      })),
    };
  }

  // Get revenue report
  async getRevenueReport(filters: AnalyticsFilters): Promise<RevenueReport> {
    const { startDate, endDate } = this.getDateRange(filters);
    const metrics = await this.calculateMetrics(startDate, endDate);
    const breakdowns = await this.calculateBreakdowns(startDate, endDate);

    return {
      totalRevenue: metrics.totalRevenue,
      totalBookings: metrics.totalBookings,
      averageBookingValue:
        metrics.totalBookings > 0
          ? metrics.totalRevenue / metrics.totalBookings
          : 0,
      revenueByCategory: breakdowns.categoryBreakdown,
      revenueByLocation: breakdowns.locationBreakdown,
      revenueByTime:
        filters.period === "daily"
          ? breakdowns.hourlyBreakdown
          : breakdowns.dailyBreakdown,
    };
  }

  // Get user report
  async getUserReport(filters: AnalyticsFilters): Promise<UserReport> {
    const { startDate, endDate } = this.getDateRange(filters);

    const [currentMetrics, previousMetrics] = await Promise.all([
      this.calculateMetrics(startDate, endDate),
      this.calculateMetrics(
        new Date(
          startDate.getTime() - (endDate.getTime() - startDate.getTime())
        ),
        startDate
      ),
    ]);

    const userGrowth =
      previousMetrics.totalUsers > 0
        ? ((currentMetrics.totalUsers - previousMetrics.totalUsers) /
            previousMetrics.totalUsers) *
          100
        : 0;

    // Get top providers
    const topProviders = await Service.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: "users",
          localField: "provider",
          foreignField: "_id",
          as: "providerInfo",
        },
      },
      {
        $group: {
          _id: "$provider",
          providerName: {
            $first: {
              $concat: [
                "$providerInfo.firstName",
                " ",
                "$providerInfo.lastName",
              ],
            },
          },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.amount" },
          averageRating: { $avg: "$rating.average" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalUsers: currentMetrics.totalUsers,
      totalProviders: currentMetrics.totalProviders,
      totalAdmins: currentMetrics.totalAdmins,
      newRegistrations: currentMetrics.newRegistrations,
      activeUsers: currentMetrics.activeUsers,
      userGrowth,
      topProviders: topProviders.map((item: any) => ({
        providerId: item._id.toString(),
        providerName: item.providerName || "Unknown",
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue,
        averageRating: item.averageRating,
      })),
    };
  }

  // Get service report
  async getServiceReport(filters: AnalyticsFilters): Promise<ServiceReport> {
    const { startDate, endDate } = this.getDateRange(filters);

    const [totalServices, activeServices, servicesByCategory, topServices] =
      await Promise.all([
        Service.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),
        Service.countDocuments({
          status: "active",
          createdAt: { $gte: startDate, $lte: endDate },
        }),

        // Services by category
        Service.aggregate([
          { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
          {
            $lookup: {
              from: "servicecategories",
              localField: "category",
              foreignField: "_id",
              as: "categoryInfo",
            },
          },
          {
            $group: {
              _id: "$category",
              categoryName: { $first: "$categoryInfo.name" },
              count: { $sum: 1 },
              averageRating: { $avg: "$rating.average" },
            },
          },
        ]),

        // Top services
        Service.aggregate([
          { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
          {
            $group: {
              _id: "$_id",
              serviceName: { $first: "$title" },
              totalBookings: { $sum: "$rating.count" },
              totalRevenue: { $sum: "$pricing.amount" },
              averageRating: { $first: "$rating.average" },
            },
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 10 },
        ]),
      ]);

    return {
      totalServices,
      activeServices,
      servicesByCategory: servicesByCategory.map((item: any) => ({
        categoryId: item._id.toString(),
        categoryName: item.categoryName[0] || "Unknown",
        count: item.count,
        averageRating: item.averageRating,
      })),
      topServices: topServices.map((item: any) => ({
        serviceId: item._id.toString(),
        serviceName: item.serviceName,
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue,
        averageRating: item.averageRating,
      })),
    };
  }

  // Get analytics by period
  async getAnalyticsByPeriod(
    period: string,
    startDate: Date,
    endDate: Date
  ): Promise<IAnalytics[]> {
    return await Analytics["findByPeriod"](period, startDate, endDate);
  }

  // Get latest analytics by period
  async getLatestAnalytics(period: string): Promise<IAnalytics | null> {
    return await Analytics["findLatestByPeriod"](period);
  }

  // Helper methods
  private getDateRange(filters: AnalyticsFilters): DateRange {
    let startDate: Date;
    let endDate: Date = new Date();

    if (filters.startDate && filters.endDate) {
      startDate = filters.startDate;
      endDate = filters.endDate;
    } else if (filters.period) {
      switch (filters.period) {
        case "daily":
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          startDate = this.getStartOfWeek(new Date());
          break;
        case "monthly":
          startDate = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          );
          break;
        case "yearly":
          startDate = new Date(new Date().getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
      }
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return weekNo;
  }
}
