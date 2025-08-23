import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicket extends Document {
  _id: string;
  providerId: string;
  category: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  attachments: string[];
  adminResponse?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Provider ID is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "technical",
        "billing",
        "account",
        "service",
        "payment",
        "withdrawal",
        "general",
        "other",
      ],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
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
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [2000, "Admin response cannot exceed 2000 characters"],
    },
    resolvedAt: {
      type: Date,
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
supportTicketSchema.index({ providerId: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ createdAt: -1 });

// Static method to find tickets by provider
supportTicketSchema.statics.findByProvider = function (
  providerId: string,
  limit = 20,
  skip = 0
) {
  return this.find({ providerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find tickets by status
supportTicketSchema.statics.findByStatus = function (
  status: string,
  limit = 20,
  skip = 0
) {
  return this.find({ status })
    .populate("providerId", "firstName lastName email")
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get ticket statistics
supportTicketSchema.statics.getTicketStats = function (providerId?: string) {
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
        open: {
          $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        closed: {
          $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
        },
        urgent: {
          $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
        },
        high: {
          $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
        },
      },
    },
  ]);
};

// Instance method to mark as resolved
supportTicketSchema.methods.markAsResolved = function (adminResponse?: string) {
  this.status = "resolved";
  this.resolvedAt = new Date();
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  return this.save();
};

// Instance method to close ticket
supportTicketSchema.methods.closeTicket = function () {
  this.status = "closed";
  return this.save();
};

// Instance method to update status
supportTicketSchema.methods.updateStatus = function (
  status: string,
  adminResponse?: string
) {
  this.status = status;
  if (status === "resolved") {
    this.resolvedAt = new Date();
  }
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  return this.save();
};

// Define interface for static methods
interface ISupportTicketModel extends mongoose.Model<ISupportTicket> {
  findByProvider(
    providerId: string,
    limit?: number,
    skip?: number
  ): Promise<ISupportTicket[]>;
  findByStatus(
    status: string,
    limit?: number,
    skip?: number
  ): Promise<ISupportTicket[]>;
  getTicketStats(providerId?: string): Promise<any[]>;
}

export const SupportTicket = mongoose.model<
  ISupportTicket,
  ISupportTicketModel
>("SupportTicket", supportTicketSchema);

export default SupportTicket;
