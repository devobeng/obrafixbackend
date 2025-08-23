import mongoose, { Document, Schema } from "mongoose";

export interface IPushNotification extends Document {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "promotion";
  targetAudience: "all" | "customers" | "providers" | "specific";
  targetRoles?: string[];
  targetUsers?: mongoose.Types.ObjectId[];
  targetCategories?: string[];
  targetServices?: string[];
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  priority: "low" | "normal" | "high";
  scheduledFor?: Date;
  sentAt?: Date;
  isSent: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const pushNotificationSchema = new Schema<IPushNotification>(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error", "promotion"],
      default: "info",
    },
    targetAudience: {
      type: String,
      enum: ["all", "customers", "providers", "specific"],
      required: true,
    },
    targetRoles: [
      {
        type: String,
        enum: ["customer", "provider", "admin"],
      },
    ],
    targetUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    targetCategories: [
      {
        type: String,
      },
    ],
    targetServices: [
      {
        type: String,
      },
    ],
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    imageUrl: {
      type: String,
    },
    actionUrl: {
      type: String,
    },
    actionText: {
      type: String,
      maxlength: [50, "Action text cannot exceed 50 characters"],
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
pushNotificationSchema.index({ isActive: 1, isSent: 1, scheduledFor: 1 });
pushNotificationSchema.index({ targetAudience: 1, isActive: 1 });
pushNotificationSchema.index({ type: 1, isActive: 1 });
pushNotificationSchema.index({ priority: 1, isActive: 1 });

// Virtual for checking if notification is ready to be sent
pushNotificationSchema.virtual("isReadyToSend").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    !this.isSent &&
    (!this.scheduledFor || this.scheduledFor <= now)
  );
});

// Pre-save middleware to validate scheduling
pushNotificationSchema.pre("save", function (next) {
  if (this.scheduledFor && this.scheduledFor < new Date()) {
    return next(new Error("Scheduled time cannot be in the past"));
  }

  if (
    this.targetAudience === "specific" &&
    (!this.targetUsers || this.targetUsers.length === 0)
  ) {
    return next(
      new Error("Target users must be specified for specific audience")
    );
  }

  next();
});

// Static method to get pending notifications
pushNotificationSchema.statics.getPendingNotifications = function () {
  const now = new Date();
  return this.find({
    isActive: true,
    isSent: false,
    $or: [
      { scheduledFor: { $exists: false } },
      { scheduledFor: { $lte: now } },
    ],
  }).sort({ priority: -1, createdAt: 1 });
};

// Static method to get notifications for a specific user
pushNotificationSchema.statics.getNotificationsForUser = function (
  userId: string,
  userRole: string,
  userCategories?: string[],
  userServices?: string[]
) {
  const query: any = {
    isActive: true,
    $or: [
      { targetAudience: "all" },
      { targetAudience: userRole === "customer" ? "customers" : "providers" },
      { targetUsers: userId },
    ],
  };

  // Add category and service filters if provided
  if (userCategories && userCategories.length > 0) {
    query.$or.push({ targetCategories: { $in: userCategories } });
  }

  if (userServices && userServices.length > 0) {
    query.$or.push({ targetServices: { $in: userServices } });
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy", "firstName lastName");
};

// Method to mark as sent
pushNotificationSchema.methods.markAsSent = function () {
  this.isSent = true;
  this.sentAt = new Date();
  return this.save();
};

// Method to duplicate notification
pushNotificationSchema.methods.duplicate = function (
  newData: Partial<IPushNotification>
) {
  const duplicate = new this.constructor({
    ...this.toObject(),
    ...newData,
    _id: undefined,
    isSent: false,
    sentAt: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  });
  return duplicate.save();
};

export const PushNotification = mongoose.model<IPushNotification>(
  "PushNotification",
  pushNotificationSchema
);
