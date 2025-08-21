import mongoose, { Schema } from "mongoose";
import { INotification } from "../types";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: [
        "job_accepted",
        "vendor_on_way",
        "job_started",
        "job_completed",
        "job_cancelled",
        "payment_received",
        "withdrawal_approved",
        "withdrawal_rejected",
        "review_received",
        "system_update",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["booking", "payment", "withdrawal", "review", "system"],
      required: true,
    },
    data: {
      bookingId: Schema.Types.ObjectId,
      serviceId: Schema.Types.ObjectId,
      amount: Number,
      status: String,
      metadata: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    scheduledAt: Date, // For scheduled notifications
    expiresAt: Date, // For expiring notifications
    sentAt: Date, // When notification was actually sent
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed"],
      default: "pending",
    },
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    lastDeliveryAttempt: Date,
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
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ deliveryStatus: 1 });

// Static methods
notificationSchema.statics["findByUser"] = function (
  userId: string,
  limit: number = 50,
  skip: number = 0
) {
  return this.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
};

notificationSchema.statics["findUnreadByUser"] = function (userId: string) {
  return this.find({ userId, isRead: false }).sort({ createdAt: -1 });
};

notificationSchema.statics["findByType"] = function (
  type: string,
  userId?: string
) {
  const query: any = { type };
  if (userId) query.userId = userId;
  return this.find(query).sort({ createdAt: -1 });
};

notificationSchema.statics["findPendingDelivery"] = function () {
  return this.find({
    deliveryStatus: "pending",
    $or: [
      { scheduledAt: { $exists: false } },
      { scheduledAt: { $lte: new Date() } },
    ],
  });
};

// Instance methods
notificationSchema.methods["markAsRead"] = function () {
  this.isRead = true;
  return this.save();
};

notificationSchema.methods["markAsUnread"] = function () {
  this.isRead = false;
  return this.save();
};

notificationSchema.methods["markAsSent"] = function () {
  this.deliveryStatus = "sent";
  this.sentAt = new Date();
  this.deliveryAttempts += 1;
  this.lastDeliveryAttempt = new Date();
  return this.save();
};

notificationSchema.methods["markAsDelivered"] = function () {
  this.deliveryStatus = "delivered";
  return this.save();
};

notificationSchema.methods["markAsFailed"] = function (reason: string) {
  this.deliveryStatus = "failed";
  this.failureReason = reason;
  this.deliveryAttempts += 1;
  this.lastDeliveryAttempt = new Date();
  return this.save();
};

export const Notification = mongoose.model<INotification, any>(
  "Notification",
  notificationSchema
);
export default Notification;
