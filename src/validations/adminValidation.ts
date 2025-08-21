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
    verificationStatus: z.enum(["approved", "rejected", "pending"]),
    rejectionReason: z.string().optional(),
    adminNotes: z.string().optional(),
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
    name: z.string().min(2).max(100),
    description: z.string().min(10).max(500).optional(),
    icon: z.string().optional(),
    commissionRate: z.number().min(0).max(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

// Update Service Category Schema
export const updateServiceCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().min(10).max(500).optional(),
    icon: z.string().optional(),
    commissionRate: z.number().min(0).max(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

// Handle Dispute Schema
export const handleDisputeSchema = z.object({
  body: z.object({
    resolution: z.enum([
      "resolved",
      "customer_favored",
      "provider_favored",
      "partial_refund",
    ]),
    adminNotes: z.string().min(10).max(1000),
    refundAmount: z.number().min(0).optional(),
    penaltyAmount: z.number().min(0).optional(),
  }),
});

// Approve Withdrawal Schema
export const approveWithdrawalSchema = z.object({
  body: z.object({
    adminNotes: z.string().min(10).max(500).optional(),
  }),
});

// Reject Withdrawal Schema
export const rejectWithdrawalSchema = z.object({
  body: z.object({
    rejectionReason: z.string().min(10).max(500),
    adminNotes: z.string().min(10).max(500).optional(),
  }),
});

// Generate Analytics Schema
export const generateAnalyticsSchema = z.object({
  query: z.object({
    period: z.enum(["daily", "weekly", "monthly"]),
    date: z.string().datetime().optional(),
  }),
});

// Update System Settings Schema
export const updateSystemSettingsSchema = z.object({
  body: z.object({
    platformFee: z.number().min(0).max(1).optional(),
    minimumWithdrawal: z.number().min(0).optional(),
    maximumWithdrawal: z.number().min(0).optional(),
    autoApprovalThreshold: z.number().min(0).optional(),
  }),
});
