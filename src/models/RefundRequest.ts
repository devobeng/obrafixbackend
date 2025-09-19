import mongoose, { Schema } from "mongoose";

export interface IRefundRequest extends Document {
  _id: string;
  userId: string;
  bookingId: string;
  requestNumber: string;
  reason: string;
  description: string;
  amount: number;
  currency: string;
  refundMethod:
    | "wallet_credit"
    | "mobile_money"
    | "bank_transfer"
    | "original_payment";
  status:
    | "pending"
    | "under_review"
    | "approved"
    | "rejected"
    | "processed"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  attachments: string[];
  evidence: {
    photos: string[];
    documents: string[];
    additionalInfo?: string;
  };
  adminNotes: string[];
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  processedAt?: Date;
  refundTransactionId?: string;
  estimatedProcessingTime?: number; // in hours
  isUrgent: boolean;
  escalationLevel: number; // 1 = normal, 2 = escalated, 3 = critical
  createdAt: Date;
  updatedAt: Date;
}

const refundRequestSchema = new Schema<IRefundRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking ID is required"],
    },
    requestNumber: {
      type: String,
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      required: [true, "Refund reason is required"],
      trim: true,
      minlength: [10, "Reason must be at least 10 characters long"],
      maxlength: [200, "Reason cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Refund amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "GHS",
    },
    refundMethod: {
      type: String,
      required: [true, "Refund method is required"],
      enum: [
        "wallet_credit",
        "mobile_money",
        "bank_transfer",
        "original_payment",
      ],
      default: "wallet_credit",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "processed",
        "cancelled",
      ],
      default: "pending",
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    attachments: [
      {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/.+/.test(v);
          },
          message: "Attachment URL must be a valid HTTP/HTTPS URL",
        },
      },
    ],
    evidence: {
      photos: [
        {
          type: String,
          validate: {
            validator: function (v: string) {
              return /^https?:\/\/.+/.test(v);
            },
            message: "Photo URL must be a valid HTTP/HTTPS URL",
          },
        },
      ],
      documents: [
        {
          type: String,
          validate: {
            validator: function (v: string) {
              return /^https?:\/\/.+/.test(v);
            },
            message: "Document URL must be a valid HTTP/HTTPS URL",
          },
        },
      ],
      additionalInfo: {
        type: String,
        maxlength: [500, "Additional info cannot exceed 500 characters"],
      },
    },
    adminNotes: [
      {
        type: String,
        maxlength: [500, "Admin note cannot exceed 500 characters"],
      },
    ],
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    processedAt: {
      type: Date,
    },
    refundTransactionId: {
      type: String,
      maxlength: [100, "Transaction ID cannot exceed 100 characters"],
    },
    estimatedProcessingTime: {
      type: Number,
      min: [1, "Processing time must be at least 1 hour"],
      max: [720, "Processing time cannot exceed 720 hours (30 days)"],
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    escalationLevel: {
      type: Number,
      min: 1,
      max: 3,
      default: 1,
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

// Pre-save middleware to generate request number and set priority
refundRequestSchema.pre("save", function (next) {
  if (this.isNew && !this.requestNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.requestNumber = `REF-${timestamp}-${random}`;
  }

  // Auto-set priority based on amount and urgency
  if (this.isUrgent) {
    this.priority = "urgent";
  } else if (this.amount > 1000) {
    this.priority = "high";
  } else if (this.amount > 500) {
    this.priority = "medium";
  } else {
    this.priority = "low";
  }

  // Set estimated processing time based on priority
  if (!this.estimatedProcessingTime) {
    switch (this.priority) {
      case "urgent":
        this.estimatedProcessingTime = 2; // 2 hours
        break;
      case "high":
        this.estimatedProcessingTime = 24; // 24 hours
        break;
      case "medium":
        this.estimatedProcessingTime = 48; // 48 hours
        break;
      default:
        this.estimatedProcessingTime = 72; // 72 hours
    }
  }

  next();
});

// Indexes for better query performance
refundRequestSchema.index({ userId: 1, status: 1 });
refundRequestSchema.index({ status: 1, priority: -1, createdAt: -1 });
refundRequestSchema.index({ bookingId: 1 });
// requestNumber already has index: true in schema definition
refundRequestSchema.index({ isUrgent: 1, status: 1 });
refundRequestSchema.index({ escalationLevel: 1, status: 1 });

// Static method to find requests by user
refundRequestSchema.statics.findByUser = function (
  userId: string,
  status?: string
) {
  const query: any = { userId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("bookingId", "serviceId scheduledDate totalAmount")
    .populate("approvedBy", "firstName lastName")
    .populate("rejectedBy", "firstName lastName");
};

// Static method to find urgent requests
refundRequestSchema.statics.findUrgent = function () {
  return this.find({
    $or: [
      { isUrgent: true },
      { priority: "urgent" },
      { escalationLevel: { $gte: 2 } },
    ],
    status: { $in: ["pending", "under_review"] },
  })
    .sort({ priority: -1, createdAt: -1 })
    .populate("userId", "firstName lastName email phone")
    .populate("bookingId", "serviceId scheduledDate totalAmount");
};

// Static method to get refund statistics
refundRequestSchema.statics.getStatistics = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        urgentCount: {
          $sum: { $cond: [{ $eq: ["$isUrgent", true] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Static method to get priority statistics
refundRequestSchema.statics.getPriorityStatistics = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Define interface for static methods
interface IRefundRequestModel extends mongoose.Model<IRefundRequest> {
  findByUser(userId: string, status?: string): Promise<IRefundRequest[]>;
  findUrgent(): Promise<IRefundRequest[]>;
  getStatistics(): Promise<any[]>;
  getPriorityStatistics(): Promise<any[]>;
}

export const RefundRequest = mongoose.model<
  IRefundRequest,
  IRefundRequestModel
>("RefundRequest", refundRequestSchema);

export default RefundRequest;
