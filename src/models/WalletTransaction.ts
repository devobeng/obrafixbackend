import mongoose, { Schema } from "mongoose";
import { IWalletTransaction } from "../types";

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit", "hold", "release", "withdrawal", "refund"],
      required: true,
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
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    metadata: {
      bookingId: Schema.Types.ObjectId,
      paymentMethod: String,
      transactionId: String,
      platformFee: Number,
      commissionRate: Number,
      withdrawalMethod: String,
      bankDetails: {
        accountNumber: String,
        bankName: String,
      },
      mobileMoneyDetails: {
        provider: String,
        phoneNumber: String,
      },
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    processedAt: Date,
    failureReason: String,
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
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });
// reference field already has unique: true in schema definition
walletTransactionSchema.index({ "metadata.bookingId": 1 });
walletTransactionSchema.index({ createdAt: -1 });

// Static methods
walletTransactionSchema.statics["findByWallet"] = function (
  walletId: string,
  limit: number = 50,
  skip: number = 0
) {
  return this.find({ walletId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

walletTransactionSchema.statics["findByUser"] = function (
  userId: string,
  limit: number = 50,
  skip: number = 0
) {
  return this.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

walletTransactionSchema.statics["findByType"] = function (
  type: string,
  userId?: string
) {
  const query: any = { type };
  if (userId) query.userId = userId;
  return this.find(query).sort({ createdAt: -1 });
};

walletTransactionSchema.statics["findByStatus"] = function (
  status: string,
  userId?: string
) {
  const query: any = { status };
  if (userId) query.userId = userId;
  return this.find(query).sort({ createdAt: -1 });
};

// Instance methods
walletTransactionSchema.methods["markAsCompleted"] = function () {
  this.status = "completed";
  this.processedAt = new Date();
  return this.save();
};

walletTransactionSchema.methods["markAsFailed"] = function (reason: string) {
  this.status = "failed";
  this.failureReason = reason;
  this.processedAt = new Date();
  return this.save();
};

export const WalletTransaction = mongoose.model<IWalletTransaction, any>(
  "WalletTransaction",
  walletTransactionSchema
);
export default WalletTransaction;
