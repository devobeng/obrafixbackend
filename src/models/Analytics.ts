import mongoose, { Schema } from "mongoose";
import { IAnalytics } from "../types";

const analyticsSchema = new Schema<IAnalytics>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      index: true,
    },
    week: {
      type: Number,
      index: true,
    },
    day: {
      type: Number,
      index: true,
    },
    metrics: {
      // Revenue metrics
      totalRevenue: {
        type: Number,
        default: 0,
      },
      totalBookings: {
        type: Number,
        default: 0,
      },
      totalServices: {
        type: Number,
        default: 0,
      },
      totalUsers: {
        type: Number,
        default: 0,
      },
      totalProviders: {
        type: Number,
        default: 0,
      },
      totalAdmins: {
        type: Number,
        default: 0,
      },
      // Financial metrics
      platformFees: {
        type: Number,
        default: 0,
      },
      totalWithdrawals: {
        type: Number,
        default: 0,
      },
      pendingWithdrawals: {
        type: Number,
        default: 0,
      },
      // Service metrics
      activeServices: {
        type: Number,
        default: 0,
      },
      completedBookings: {
        type: Number,
        default: 0,
      },
      cancelledBookings: {
        type: Number,
        default: 0,
      },
      disputedBookings: {
        type: Number,
        default: 0,
      },
      // User engagement metrics
      newRegistrations: {
        type: Number,
        default: 0,
      },
      activeUsers: {
        type: Number,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      // Top performers
      topServices: [
        {
          serviceId: Schema.Types.ObjectId,
          serviceName: String,
          totalBookings: Number,
          totalRevenue: Number,
          averageRating: Number,
        },
      ],
      topProviders: [
        {
          providerId: Schema.Types.ObjectId,
          providerName: String,
          totalBookings: Number,
          totalRevenue: Number,
          averageRating: Number,
        },
      ],
      topCategories: [
        {
          categoryId: Schema.Types.ObjectId,
          categoryName: String,
          totalBookings: Number,
          totalRevenue: Number,
        },
      ],
    },
    // Breakdown by category
    categoryBreakdown: [
      {
        categoryId: Schema.Types.ObjectId,
        categoryName: String,
        totalBookings: Number,
        totalRevenue: Number,
        averageRating: Number,
        totalServices: Number,
      },
    ],
    // Breakdown by location
    locationBreakdown: [
      {
        city: String,
        state: String,
        totalBookings: Number,
        totalRevenue: Number,
        totalUsers: Number,
        totalProviders: Number,
      },
    ],
    // Time-based breakdown
    hourlyBreakdown: [
      {
        hour: Number,
        totalBookings: Number,
        totalRevenue: Number,
      },
    ],
    dailyBreakdown: [
      {
        day: Number,
        totalBookings: Number,
        totalRevenue: Number,
      },
    ],
    // Growth metrics
    growthMetrics: {
      revenueGrowth: Number, // Percentage change from previous period
      userGrowth: Number,
      bookingGrowth: Number,
      serviceGrowth: Number,
    },
    // Custom date ranges for comparison
    comparisonData: {
      previousPeriod: {
        startDate: Date,
        endDate: Date,
        totalRevenue: Number,
        totalBookings: Number,
        totalUsers: Number,
      },
      currentPeriod: {
        startDate: Date,
        endDate: Date,
        totalRevenue: Number,
        totalBookings: Number,
        totalUsers: Number,
      },
    },
    // Metadata
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    processingNotes: String,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient querying
analyticsSchema.index({ period: 1, year: 1, month: 1, week: 1, day: 1 });
analyticsSchema.index({ period: 1, date: 1 });
analyticsSchema.index({ isProcessed: 1, lastUpdated: 1 });

// Static methods
analyticsSchema.statics["findByPeriod"] = function (
  period: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    period,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

analyticsSchema.statics["findLatestByPeriod"] = function (period: string) {
  return this.findOne({ period }).sort({ date: -1 });
};

analyticsSchema["findByDateRange"] = function (
  startDate: Date,
  endDate: Date,
  period?: string
) {
  const query: any = { date: { $gte: startDate, $lte: endDate } };
  if (period) query.period = period;
  return this.find(query).sort({ date: 1 });
};

analyticsSchema.statics["findUnprocessed"] = function () {
  return this.find({ isProcessed: false }).sort({ date: 1 });
};

// Instance methods
analyticsSchema.methods["markAsProcessed"] = function (notes?: string) {
  this.isProcessed = true;
  this.lastUpdated = new Date();
  if (notes) this.processingNotes = notes;
  return this.save();
};

analyticsSchema.methods["updateMetrics"] = function (newMetrics: any) {
  this.metrics = { ...this.metrics, ...newMetrics };
  this.lastUpdated = new Date();
  return this.save();
};

export const Analytics = mongoose.model<IAnalytics, any>(
  "Analytics",
  analyticsSchema
);
export default Analytics;
