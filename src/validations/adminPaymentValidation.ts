import { z } from "zod";

// Approve Withdrawal Request Schema
export const approveWithdrawalRequestSchema = z.object({
  body: z.object({
    adminNotes: z.string().optional(),
  }),
});

// Reject Withdrawal Request Schema
export const rejectWithdrawalRequestSchema = z.object({
  body: z.object({
    reason: z.string().min(1, "Rejection reason is required"),
    adminNotes: z.string().optional(),
  }),
});

// Update Payment Integration Settings Schema
export const updatePaymentIntegrationSettingsSchema = z.object({
  body: z.object({
    settings: z.object({
      stripe: z
        .object({
          enabled: z.boolean(),
          apiKey: z.string().optional(),
        })
        .optional(),
      paystack: z
        .object({
          enabled: z.boolean(),
          secretKey: z.string().optional(),
        })
        .optional(),
      mobileMoney: z
        .object({
          enabled: z.boolean(),
          provider: z.string().optional(),
        })
        .optional(),
    }),
  }),
});

// Withdrawal Request Filters Schema
export const withdrawalRequestFiltersSchema = z.object({
  query: z.object({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    providerId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    paymentMethod: z.string().optional(),
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

// Revenue Report Filters Schema
export const revenueReportFiltersSchema = z.object({
  query: z.object({
    period: z.enum(["day", "week", "month", "year"]).optional(),
    date: z.string().optional(),
  }),
});

// Analytics Filters Schema
export const analyticsFiltersSchema = z.object({
  query: z.object({
    period: z.enum(["day", "week", "month", "year"]).optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
  }),
});

// Top Services Report Filters Schema
export const topServicesReportFiltersSchema = z.object({
  query: z.object({
    period: z.enum(["day", "week", "month", "year"]).optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
  }),
});

// Top Vendors Report Filters Schema
export const topVendorsReportFiltersSchema = z.object({
  query: z.object({
    period: z.enum(["day", "week", "month", "year"]).optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
  }),
});

// Customer Activity Report Filters Schema
export const customerActivityReportFiltersSchema = z.object({
  query: z.object({
    period: z.enum(["day", "week", "month", "year"]).optional(),
  }),
});

// Usage Analytics Filters Schema
export const usageAnalyticsFiltersSchema = z.object({
  query: z.object({
    period: z.enum(["day", "week", "month", "year"]).optional(),
  }),
}); 