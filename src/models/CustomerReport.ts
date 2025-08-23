import mongoose, { Schema, Document } from "mongoose";

export interface ICustomerReport extends Document {
  _id: string;
  providerId: string;
  customerId: string;
  bookingId?: string;
  reason: string;
  description: string;
  evidence: string[];
  status: "pending" | "investigating" | "resolved" | "dismissed";
  severity: "low" | "medium" | "high" | "critical";
  adminNotes?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerReportSchema = new Schema<ICustomerReport>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Provider ID is required"],
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      enum: [
        "fraud",
        "abuse",
        "harassment",
        "inappropriate_behavior",
        "no_show",
        "cancellation_abuse",
        "payment_issues",
        "safety_concerns",
        "other",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    evidence: [
      {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Evidence URL must be a valid HTTP/HTTPS URL",
        },
      },
    ],
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
    },
    severity: {
      type: String,
      required: [true, "Severity is required"],
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [1000, "Resolution cannot exceed 1000 characters"],
    },
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

// Indexes for better query performance
customerReportSchema.index({ providerId: 1 });
customerReportSchema.index({ customerId: 1 });
customerReportSchema.index({ status: 1 });
customerReportSchema.index({ severity: 1 });
customerReportSchema.index({ reason: 1 });
customerReportSchema.index({ createdAt: -1 });

// Static method to find reports by provider
customerReportSchema.statics.findByProvider = function (
  providerId: string,
  limit = 20,
  skip = 0
) {
  return this.find({ providerId })
    .populate("customerId", "firstName lastName email")
    .populate("bookingId", "serviceId scheduledDate totalAmount")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find reports by customer
customerReportSchema.statics.findByCustomer = function (
  customerId: string,
  limit = 20,
  skip = 0
) {
  return this.find({ customerId })
    .populate("providerId", "firstName lastName email")
    .populate("bookingId", "serviceId scheduledDate totalAmount")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find reports by status
customerReportSchema.statics.findByStatus = function (
  status: string,
  limit = 20,
  skip = 0
) {
  return this.find({ status })
    .populate("providerId", "firstName lastName email")
    .populate("customerId", "firstName lastName email")
    .populate("bookingId", "serviceId scheduledDate")
    .sort({ severity: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get report statistics
customerReportSchema.statics.getReportStats = function (providerId?: string) {
  const match: any = {};
  if (providerId) {
    match.providerId = new mongoose.Types.ObjectId(providerId);
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        investigating: {
          $sum: { $cond: [{ $eq: ["$status", "investigating"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        dismissed: {
          $sum: { $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0] },
        },
        critical: {
          $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
        },
        high: {
          $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] },
        },
      },
    },
  ]);
};

// Static method to get reports by reason
customerReportSchema.statics.getReportsByReason = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$reason",
        count: { $sum: 1 },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        criticalCount: {
          $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Instance method to update status
customerReportSchema.methods.updateStatus = function (
  status: string,
  adminNotes?: string,
  resolution?: string
) {
  this.status = status;
  if (adminNotes) {
    this.adminNotes = adminNotes;
  }
  if (resolution) {
    this.resolution = resolution;
  }
  return this.save();
};

// Instance method to add admin notes
customerReportSchema.methods.addAdminNotes = function (notes: string) {
  this.adminNotes = notes;
  return this.save();
};

// Instance method to resolve report
customerReportSchema.methods.resolveReport = function (resolution: string) {
  this.status = "resolved";
  this.resolution = resolution;
  return this.save();
};

// Instance method to dismiss report
customerReportSchema.methods.dismissReport = function (reason: string) {
  this.status = "dismissed";
  this.resolution = reason;
  return this.save();
};

// Define interface for static methods
interface ICustomerReportModel extends mongoose.Model<ICustomerReport> {
  findByProvider(
    providerId: string,
    limit?: number,
    skip?: number
  ): Promise<ICustomerReport[]>;
  findByCustomer(
    customerId: string,
    limit?: number,
    skip?: number
  ): Promise<ICustomerReport[]>;
  findByStatus(
    status: string,
    limit?: number,
    skip?: number
  ): Promise<ICustomerReport[]>;
  getReportStats(providerId?: string): Promise<any[]>;
  getReportsByReason(): Promise<any[]>;
}

export const CustomerReport = mongoose.model<
  ICustomerReport,
  ICustomerReportModel
>("CustomerReport", customerReportSchema);

export default CustomerReport;
