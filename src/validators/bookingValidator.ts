import { z } from "zod";

// Booking creation schema
export const bookingCreateSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  providerId: z.string().min(1, "Provider ID is required"),
  bookingDetails: z.object({
    scheduledDate: z.string().datetime("Invalid date format"),
    scheduledTime: z.string().min(1, "Scheduled time is required"),
    duration: z
      .number()
      .min(0.5, "Duration must be at least 0.5 hours")
      .max(24, "Duration cannot exceed 24 hours"),
    location: z.object({
      address: z
        .string()
        .min(1, "Address is required")
        .max(200, "Address too long"),
      city: z.string().min(1, "City is required").max(100, "City too long"),
      state: z.string().min(1, "State is required").max(100, "State too long"),
      coordinates: z
        .object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
        .optional(),
    }),
    requirements: z
      .string()
      .min(1, "Requirements are required")
      .max(1000, "Requirements too long"),
    photos: z
      .array(
        z.object({
          url: z.string().url("Invalid photo URL"),
          alt: z.string().optional(),
        })
      )
      .min(1, "At least one photo is required")
      .max(10, "Maximum 10 photos allowed"),
    specialInstructions: z
      .string()
      .max(500, "Special instructions too long")
      .optional(),
  }),
  pricing: z.object({
    basePrice: z.number().min(0, "Base price must be non-negative"),
    additionalFees: z
      .number()
      .min(0, "Additional fees must be non-negative")
      .optional(),
    paymentMethod: z.enum(["mobile_money", "bank_transfer", "cash"], {
      errorMap: () => ({ message: "Invalid payment method" }),
    }),
  }),
});

// Booking update schema
export const bookingUpdateSchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "disputed",
    ])
    .optional(),
  "jobStatus.currentStatus": z
    .enum(["pending", "accepted", "on_way", "in_progress", "completed"])
    .optional(),
  "jobStatus.estimatedStartTime": z
    .string()
    .datetime("Invalid date format")
    .optional(),
  "jobStatus.actualStartTime": z
    .string()
    .datetime("Invalid date format")
    .optional(),
  "jobStatus.actualEndTime": z
    .string()
    .datetime("Invalid date format")
    .optional(),
  "payment.status": z
    .enum(["pending", "authorized", "paid", "refunded", "failed"])
    .optional(),
  "payment.transactionId": z.string().optional(),
  "payment.paidAt": z.string().datetime("Invalid date format").optional(),
  "cancellation.cancelledBy": z.enum(["user", "provider", "admin"]).optional(),
  "cancellation.reason": z
    .string()
    .max(500, "Cancellation reason too long")
    .optional(),
  "cancellation.refundAmount": z
    .number()
    .min(0, "Refund amount must be non-negative")
    .optional(),
  "dispute.isDisputed": z.boolean().optional(),
  "dispute.disputeReason": z
    .string()
    .max(500, "Dispute reason too long")
    .optional(),
  "dispute.escalatedToAdmin": z.boolean().optional(),
  "rating.userRating": z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  "rating.userComment": z.string().max(500, "User comment too long").optional(),
  "rating.providerRating": z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  "rating.providerComment": z
    .string()
    .max(500, "Provider comment too long")
    .optional(),
});

// Job status update schema
export const jobStatusUpdateSchema = z.object({
  status: z.enum(
    ["pending", "accepted", "on_way", "in_progress", "completed"],
    {
      errorMap: () => ({ message: "Invalid job status" }),
    }
  ),
  note: z.string().max(500, "Note too long").optional(),
  estimatedStartTime: z.string().datetime("Invalid date format").optional(),
  actualStartTime: z.string().datetime("Invalid date format").optional(),
  actualEndTime: z.string().datetime("Invalid date format").optional(),
});

// Message schema
export const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message too long"),
});

// Booking filters schema
export const bookingFiltersSchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "disputed",
    ])
    .optional(),
  "jobStatus.currentStatus": z
    .enum(["pending", "accepted", "on_way", "in_progress", "completed"])
    .optional(),
  "payment.status": z
    .enum(["pending", "authorized", "paid", "refunded", "failed"])
    .optional(),
  "payment.paymentMethod": z
    .enum(["mobile_money", "bank_transfer", "cash"])
    .optional(),
  startDate: z.string().datetime("Invalid start date format").optional(),
  endDate: z.string().datetime("Invalid end date format").optional(),
  minAmount: z
    .number()
    .min(0, "Minimum amount must be non-negative")
    .optional(),
  maxAmount: z
    .number()
    .min(0, "Maximum amount must be non-negative")
    .optional(),
  limit: z.string().regex(/^\d+$/, "Limit must be a number").default("10"),
  page: z.string().regex(/^\d+$/, "Page must be a number").default("1"),
});

// Cancellation schema
export const cancellationSchema = z.object({
  reason: z
    .string()
    .min(1, "Cancellation reason is required")
    .max(500, "Cancellation reason too long"),
  refundAmount: z
    .number()
    .min(0, "Refund amount must be non-negative")
    .optional(),
});

// Dispute schema
export const disputeSchema = z.object({
  reason: z
    .string()
    .min(1, "Dispute reason is required")
    .max(500, "Dispute reason too long"),
  escalateToAdmin: z.boolean().default(false),
});

// Payment processing schema
export const paymentProcessingSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
  paymentMethod: z.enum(["mobile_money", "bank_transfer", "cash"], {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  paymentDetails: z
    .object({
      mobileMoneyProvider: z.enum(["mtn", "vodafone", "airtelTigo"]).optional(),
      phoneNumber: z.string().optional(),
      bankAccount: z.string().optional(),
      bankName: z.string().optional(),
    })
    .optional(),
});

// Refund schema
export const refundSchema = z.object({
  reason: z
    .string()
    .min(1, "Refund reason is required")
    .max(500, "Refund reason too long"),
  amount: z.number().min(0, "Refund amount must be non-negative"),
});
