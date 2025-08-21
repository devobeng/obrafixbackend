import mongoose, { Schema } from "mongoose";
import { IBookingRequest } from "../types";

const bookingRequestSchema = new Schema<IBookingRequest>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
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
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    responseTime: Date,
    responseNote: {
      type: String,
      maxlength: 500,
    },
    estimatedStartTime: Date,
    estimatedDuration: {
      type: Number,
      min: 0.5,
      max: 24,
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
bookingRequestSchema.index({ providerId: 1, status: 1 });
bookingRequestSchema.index({ bookingId: 1, status: 1 });
bookingRequestSchema.index({ status: 1, createdAt: -1 });

// Static methods
bookingRequestSchema.statics["findByProvider"] = function (
  providerId: string,
  status?: string
) {
  const query: any = { providerId };
  if (status) query.status = status;
  return this.find(query).populate("bookingId").sort({ createdAt: -1 });
};

bookingRequestSchema.statics["findByBooking"] = function (bookingId: string) {
  return this.find({ bookingId })
    .populate("providerId")
    .sort({ createdAt: -1 });
};

bookingRequestSchema.statics["findPendingRequests"] = function () {
  return this.find({ status: "pending" })
    .populate("bookingId providerId")
    .sort({ createdAt: -1 });
};

// Instance methods
bookingRequestSchema.methods["accept"] = function (
  estimatedStartTime?: Date,
  estimatedDuration?: number,
  note?: string
) {
  this["status"] = "accepted";
  this["responseTime"] = new Date();
  this["responseNote"] = note;
  if (estimatedStartTime) this["estimatedStartTime"] = estimatedStartTime;
  if (estimatedDuration) this["estimatedDuration"] = estimatedDuration;
  return this["save"]();
};

bookingRequestSchema.methods["reject"] = function (note?: string) {
  this["status"] = "rejected";
  this["responseTime"] = new Date();
  this["responseNote"] = note;
  return this["save"]();
};

bookingRequestSchema.methods["expire"] = function () {
  this["status"] = "expired";
  this["responseTime"] = new Date();
  return this["save"]();
};

export const BookingRequest = mongoose.model<IBookingRequest, any>(
  "BookingRequest",
  bookingRequestSchema
);
export default BookingRequest;
