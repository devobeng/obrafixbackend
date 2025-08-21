import mongoose, { Schema } from "mongoose";
import { IBooking } from "../types";

const bookingSchema = new Schema<IBooking>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "pending",
      index: true,
    },
    bookingDetails: {
      scheduledDate: {
        type: Date,
        required: true,
        index: true,
      },
      scheduledTime: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
        min: 0.5,
        max: 24,
      },
      location: {
        address: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
      requirements: {
        type: String,
        required: true,
        maxlength: 1000,
      },
      photos: [
        {
          url: {
            type: String,
            required: true,
          },
          alt: String,
        },
      ],
      specialInstructions: {
        type: String,
        maxlength: 500,
      },
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      additionalFees: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        required: true,
        default: "GHS",
      },
      paymentMethod: {
        type: String,
        enum: ["mobile_money", "bank_transfer", "cash"],
        required: true,
      },
    },
    jobStatus: {
      currentStatus: {
        type: String,
        enum: ["pending", "accepted", "on_way", "in_progress", "completed"],
        default: "pending",
      },
      statusHistory: [
        {
          status: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          note: String,
          updatedBy: {
            type: String,
            enum: ["user", "provider", "admin"],
            required: true,
          },
        },
      ],
      estimatedStartTime: Date,
      actualStartTime: Date,
      actualEndTime: Date,
    },
    communication: {
      messages: [
        {
          senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          senderType: {
            type: String,
            enum: ["user", "provider"],
            required: true,
          },
          message: {
            type: String,
            required: true,
            maxlength: 1000,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          isRead: {
            type: Boolean,
            default: false,
          },
        },
      ],
      lastMessageAt: {
        type: Date,
        default: Date.now,
      },
    },
    payment: {
      status: {
        type: String,
        enum: ["pending", "authorized", "paid", "refunded", "failed"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
      refundedAt: Date,
      refundReason: String,
    },
    cancellation: {
      cancelledBy: {
        type: String,
        enum: ["user", "provider", "admin"],
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
    },
    dispute: {
      isDisputed: {
        type: Boolean,
        default: false,
      },
      disputeReason: String,
      disputedAt: Date,
      resolvedAt: Date,
      resolution: String,
      escalatedToAdmin: {
        type: Boolean,
        default: false,
      },
    },
    rating: {
      userRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      userComment: String,
      providerRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      providerComment: String,
      ratedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient querying
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ providerId: 1, status: 1 });
bookingSchema.index({ "bookingDetails.scheduledDate": 1, status: 1 });
bookingSchema.index({ status: 1, "jobStatus.currentStatus": 1 });
bookingSchema.index({ "payment.status": 1 });
bookingSchema.index({ createdAt: -1 });

// Static methods
bookingSchema.statics["findByUser"] = function (
  userId: string,
  status?: string
) {
  const query: any = { userId };
  if (status) query.status = status;
  return this.find(query)
    .populate("serviceId providerId")
    .sort({ createdAt: -1 });
};

bookingSchema.statics["findByProvider"] = function (
  providerId: string,
  status?: string
) {
  const query: any = { providerId };
  if (status) query.status = status;
  return this.find(query).populate("serviceId userId").sort({ createdAt: -1 });
};

bookingSchema.statics["findByStatus"] = function (status: string) {
  return this.find({ status })
    .populate("serviceId userId providerId")
    .sort({ createdAt: -1 });
};

bookingSchema.statics["findPendingBookings"] = function () {
  return this.find({ status: "pending" })
    .populate("serviceId userId providerId")
    .sort({ createdAt: -1 });
};

bookingSchema.statics["findActiveBookings"] = function () {
  return this.find({
    status: { $in: ["confirmed", "in_progress"] },
  })
    .populate("serviceId userId providerId")
    .sort({ createdAt: -1 });
};

// Instance methods
bookingSchema.methods["updateJobStatus"] = function (
  newStatus: string,
  updatedBy: string,
  note?: string
) {
  this["jobStatus"]["currentStatus"] = newStatus;
  this["jobStatus"]["statusHistory"].push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy,
  });

  // Update specific timestamps based on status
  if (newStatus === "accepted") {
    this["jobStatus"]["estimatedStartTime"] = new Date();
  } else if (newStatus === "in_progress") {
    this["jobStatus"]["actualStartTime"] = new Date();
  } else if (newStatus === "completed") {
    this["jobStatus"]["actualEndTime"] = new Date();
  }

  return this["save"]();
};

bookingSchema.methods["addMessage"] = function (
  senderId: string,
  senderType: string,
  message: string
) {
  this["communication"]["messages"].push({
    senderId,
    senderType,
    message,
    timestamp: new Date(),
    isRead: false,
  });
  this["communication"]["lastMessageAt"] = new Date();
  return this["save"]();
};

bookingSchema.methods["markMessagesAsRead"] = function (userId: string) {
  this["communication"]["messages"].forEach((msg: any) => {
    if (msg.senderId.toString() !== userId.toString()) {
      msg.isRead = true;
    }
  });
  return this["save"]();
};

bookingSchema.methods["calculateTotalAmount"] = function () {
  this["pricing"]["totalAmount"] =
    this["pricing"]["basePrice"] + (this["pricing"]["additionalFees"] || 0);
  return this["pricing"]["totalAmount"];
};

export const Booking = mongoose.model<IBooking, any>("Booking", bookingSchema);
export default Booking;
