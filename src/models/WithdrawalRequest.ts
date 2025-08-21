import mongoose, { Schema } from "mongoose";
import { IWithdrawalRequest } from "../types";

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "GHS",
      enum: ["GHS", "USD"],
    },
    withdrawalMethod: {
      type: String,
      enum: ["bank_transfer", "mobile_money"],
      required: true,
    },
    withdrawalDetails: {
      bankDetails: {
        accountNumber: String,
        accountName: String,
        bankName: String,
      },
      mobileMoneyDetails: {
        provider: {
          type: String,
          enum: ["mtn", "vodafone", "airtelTigo"],
        },
        phoneNumber: String,
        accountName: String,
      },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    processedAt: Date,
    failureReason: String,
    adminNotes: String,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Indexes
withdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
withdrawalRequestSchema.index({ walletId: 1 });
withdrawalRequestSchema.index({ status: 1 });
withdrawalRequestSchema.index({ reference: 1 }, { unique: true });
withdrawalRequestSchema.index({ createdAt: -1 });

// Static methods
withdrawalRequestSchema.statics["findByUser"] = function (
  userId: string,
  limit: number = 50,
  skip: number = 0
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

withdrawalRequestSchema.statics["findByStatus"] = function (status: string) {
  return this.find({ status }).populate("userId", "firstName lastName email");
};

withdrawalRequestSchema.statics["findPendingRequests"] = function () {
  return this.find({ status: "pending" }).populate("userId", "firstName lastName email");
};

// Instance methods
withdrawalRequestSchema.methods["markAsProcessing"] = function () {
  this.status = "processing";
  return this.save();
};

withdrawalRequestSchema.methods["markAsCompleted"] = function (adminId: string) {
  this.status = "completed";
  this.processedAt = new Date();
  this.processedBy = adminId;
  return this.save();
};

withdrawalRequestSchema.methods["markAsFailed"] = function (reason: string, adminId: string) {
  this.status = "failed";
  this.failureReason = reason;
  this.processedAt = new Date();
  this.processedBy = adminId;
  return this.save();
};

withdrawalRequestSchema.methods["cancel"] = function () {
  if (this.status !== "pending") {
    throw new Error("Cannot cancel non-pending withdrawal request");
  }
  this.status = "cancelled";
  return this.save();
};

export const WithdrawalRequest = mongoose.model<IWithdrawalRequest, any>(
  "WithdrawalRequest",
  withdrawalRequestSchema
);
export default WithdrawalRequest; 