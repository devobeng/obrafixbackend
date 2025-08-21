import mongoose, { Schema } from "mongoose";
import { IBookingPayment } from "../types";

const bookingPaymentSchema = new Schema<IBookingPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
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
      required: true,
      default: "GHS",
    },
    paymentMethod: {
      type: String,
      enum: ["mobile_money", "bank_transfer", "cash"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "authorized", "paid", "refunded", "failed"],
      default: "pending",
      index: true,
    },
    transactionId: String,
    paymentDetails: {
      mobileMoneyProvider: {
        type: String,
        enum: ["mtn", "vodafone", "airtelTigo"],
      },
      phoneNumber: String,
      bankAccount: String,
      bankName: String,
    },
    paidAt: Date,
    refundedAt: Date,
    refundReason: String,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient querying
bookingPaymentSchema.index({ bookingId: 1, status: 1 });
bookingPaymentSchema.index({ status: 1, createdAt: -1 });
bookingPaymentSchema.index({ transactionId: 1 });
bookingPaymentSchema.index({ "paymentDetails.phoneNumber": 1 });

// Static methods
bookingPaymentSchema.statics["findByBooking"] = function (bookingId: string) {
  return this.find({ bookingId }).sort({ createdAt: -1 });
};

bookingPaymentSchema.statics["findByStatus"] = function (status: string) {
  return this.find({ status }).populate("bookingId").sort({ createdAt: -1 });
};

bookingPaymentSchema.statics["findByTransactionId"] = function (
  transactionId: string
) {
  return this.findOne({ transactionId });
};

// Instance methods
bookingPaymentSchema.methods["markAsPaid"] = function (transactionId?: string) {
  this["status"] = "paid";
  this["paidAt"] = new Date();
  if (transactionId) this["transactionId"] = transactionId;
  return this["save"]();
};

bookingPaymentSchema.methods["markAsFailed"] = function () {
  this["status"] = "failed";
  return this["save"]();
};

bookingPaymentSchema.methods["refund"] = function (reason: string) {
  this["status"] = "refunded";
  this["refundedAt"] = new Date();
  this["refundReason"] = reason;
  return this["save"]();
};

export const BookingPayment = mongoose.model<IBookingPayment, any>(
  "BookingPayment",
  bookingPaymentSchema
);
export default BookingPayment;
