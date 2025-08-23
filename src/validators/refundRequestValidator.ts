import { z } from "zod";

// Create refund request schema
export const createRefundRequestSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  reason: z.enum(
    [
      "service_not_provided",
      "poor_quality",
      "late_arrival",
      "damage",
      "safety_concern",
      "fraud",
      "duplicate_charge",
      "cancellation",
      "other",
    ],
    {
      errorMap: () => ({ message: "Invalid reason selected" }),
    }
  ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(500, "Description must not exceed 500 characters"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(100000, "Amount cannot exceed 100,000"),
  currency: z.enum(["GHS", "USD", "EUR"], {
    errorMap: () => ({ message: "Invalid currency selected" }),
  }),
  refundMethod: z.enum(
    ["bank_transfer", "mobile_money", "credit_card", "cash", "wallet_credit"],
    {
      errorMap: () => ({ message: "Invalid refund method selected" }),
    }
  ),
  evidence: z.array(z.string().url("Invalid evidence URL")).optional(),
});

// Update refund request schema
export const updateRefundRequestSchema = z.object({
  reason: z
    .enum([
      "service_not_provided",
      "poor_quality",
      "late_arrival",
      "damage",
      "safety_concern",
      "fraud",
      "duplicate_charge",
      "cancellation",
      "other",
    ])
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(100000, "Amount cannot exceed 100,000")
    .optional(),
  refundMethod: z
    .enum([
      "bank_transfer",
      "mobile_money",
      "credit_card",
      "cash",
      "wallet_credit",
    ])
    .optional(),
  evidence: z.array(z.string().url("Invalid evidence URL")).optional(),
});

// Process refund schema (admin)
export const processRefundSchema = z
  .object({
    action: z.enum(["approve", "reject"], {
      errorMap: () => ({
        message: "Action must be either 'approve' or 'reject'",
      }),
    }),
    notes: z
      .string()
      .max(500, "Notes must not exceed 500 characters")
      .optional(),
    rejectionReason: z
      .string()
      .min(10, "Rejection reason must be at least 10 characters long")
      .max(200, "Rejection reason must not exceed 200 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.action === "reject" && !data.rejectionReason) {
        return false;
      }
      return true;
    },
    {
      message: "Rejection reason is required when rejecting a refund request",
      path: ["rejectionReason"],
    }
  );

// Get refund requests schema
export const getRefundRequestsSchema = z.object({
  status: z
    .enum([
      "pending",
      "approved",
      "rejected",
      "processing",
      "completed",
      "cancelled",
    ])
    .optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Search refund requests schema
export const searchRefundRequestsSchema = z.object({
  q: z.string().min(2, "Search term must be at least 2 characters long"),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Refund request ID schema
export const refundRequestIdSchema = z.object({
  requestId: z.string().min(1, "Refund request ID is required"),
});

// Get refund statistics schema
export const getRefundStatisticsSchema = z.object({});

// Get urgent requests schema
export const getUrgentRequestsSchema = z.object({});

// Group all validators
export const refundRequestValidators = {
  create: createRefundRequestSchema,
  update: updateRefundRequestSchema,
  process: processRefundSchema,
  getRequests: getRefundRequestsSchema,
  search: searchRefundRequestsSchema,
  requestId: refundRequestIdSchema,
  getStatistics: getRefundStatisticsSchema,
  getUrgent: getUrgentRequestsSchema,
};
