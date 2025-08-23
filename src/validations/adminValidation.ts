import { z } from "zod";

// Update User Status Schema
export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "suspended", "blocked"]),
    reason: z.string().optional(),
  }),
});

// Verify Provider Documents Schema
export const verifyProviderDocumentsSchema = z.object({
  body: z.object({
    isVerified: z.boolean(),
    reason: z.string().optional(),
  }),
});

// Update Service Status Schema
export const updateServiceStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive", "suspended"]),
    reason: z.string().optional(),
  }),
});

// Create Service Category Schema
export const createServiceCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters")
      .max(100, "Category name cannot exceed 100 characters"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(500, "Description cannot exceed 500 characters"),
    icon: z.string().optional(),
    parentCategory: z.string().optional(),
    commissionRate: z
      .number()
      .min(0, "Commission rate cannot be negative")
      .max(100, "Commission rate cannot exceed 100%")
      .optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

// Update Service Category Schema
export const updateServiceCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().min(10).max(500).optional(),
    icon: z.string().optional(),
    parentCategory: z.string().optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

// Set Commission Rate Schema
export const setCommissionRateSchema = z.object({
  body: z.object({
    commissionRate: z
      .number()
      .min(0, "Commission rate cannot be negative")
      .max(100, "Commission rate cannot exceed 100%"),
  }),
});

// Handle Booking Cancellation Schema
export const handleBookingCancellationSchema = z.object({
  body: z.object({
    reason: z.string().min(1, "Cancellation reason is required"),
    refundAmount: z.number().min(0).optional(),
    adminNotes: z.string().optional(),
    notifyParties: z.boolean().optional(),
  }),
});

// Process Booking Refund Schema
export const processBookingRefundSchema = z.object({
  body: z.object({
    amount: z.number().min(0.01, "Refund amount must be greater than 0"),
    reason: z.string().min(1, "Refund reason is required"),
    adminNotes: z.string().optional(),
    notifyParties: z.boolean().optional(),
  }),
});

// Escalate Dispute Schema
export const escalateDisputeSchema = z.object({
  body: z.object({
    escalatedTo: z.string().min(1, "Escalation target is required"),
    reason: z.string().min(1, "Escalation reason is required"),
    adminNotes: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  }),
});

// Resolve Dispute Schema
export const resolveDisputeSchema = z.object({
  body: z.object({
    resolution: z.enum([
      "resolved",
      "customer_favored",
      "provider_favored",
      "partial_refund",
    ]),
    adminNotes: z.string().min(1, "Admin notes are required"),
    refundAmount: z.number().min(0).optional(),
    penaltyAmount: z.number().min(0).optional(),
  }),
});

// Handle Dispute Schema (Legacy - kept for compatibility)
export const handleDisputeSchema = z.object({
  body: z.object({
    resolution: z.enum([
      "resolved",
      "customer_favored",
      "provider_favored",
      "partial_refund",
    ]),
    adminNotes: z.string().optional(),
    refundAmount: z.number().min(0).optional(),
    penaltyAmount: z.number().min(0).optional(),
  }),
});

// Approve Withdrawal Schema
export const approveWithdrawalSchema = z.object({
  body: z.object({
    adminNotes: z.string().optional(),
  }),
});

// Reject Withdrawal Schema
export const rejectWithdrawalSchema = z.object({
  body: z.object({
    reason: z.string().min(1, "Rejection reason is required"),
    adminNotes: z.string().optional(),
  }),
});

// Generate Analytics Schema
export const generateAnalyticsSchema = z.object({
  body: z.object({
    type: z.enum(["revenue", "users", "services", "bookings", "disputes"]),
    filters: z.record(z.any()).optional(),
    dateRange: z
      .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .optional(),
  }),
});

// Update System Settings Schema
export const updateSystemSettingsSchema = z.object({
  body: z.object({
    settings: z.object({
      platformFee: z.number().min(0).max(1).optional(),
      minimumWithdrawal: z.number().min(0).optional(),
      maximumWithdrawal: z.number().min(0).optional(),
      autoApprovalThreshold: z.number().min(0).optional(),
      currency: z.string().optional(),
      timezone: z.string().optional(),
      defaultCommissionRate: z.number().min(0).max(100).optional(),
      disputeResolutionTime: z.number().min(1).optional(),
      maxCancellationTime: z.number().min(0).optional(),
    }),
  }),
});

// Live Booking Filters Schema
export const liveBookingFiltersSchema = z.object({
  query: z.object({
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
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
  }),
});

// Booking Management Filters Schema
export const bookingManagementFiltersSchema = z.object({
  query: z.object({
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
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
  }),
});

// Category Management Filters Schema
export const categoryManagementFiltersSchema = z.object({
  query: z.object({
    isActive: z.boolean().optional(),
    parentCategory: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
  }),
});
