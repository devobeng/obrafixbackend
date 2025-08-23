import { z } from "zod";

// Banner Validation Schemas
export const createBannerSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description cannot exceed 1000 characters"),
  imageUrl: z.string().url("Invalid image URL").optional(),
  linkUrl: z.string().url("Invalid link URL").optional(),
  type: z.enum(["banner", "promotion", "announcement"], {
    errorMap: () => ({
      message: "Type must be banner, promotion, or announcement",
    }),
  }),
  targetAudience: z.enum(["all", "customers", "providers", "specific"], {
    errorMap: () => ({
      message: "Target audience must be all, customers, providers, or specific",
    }),
  }),
  targetRoles: z.array(z.enum(["customer", "provider", "admin"])).optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  isActive: z.boolean().optional(),
  priority: z
    .number()
    .min(1, "Priority must be at least 1")
    .max(10, "Priority cannot exceed 10")
    .optional(),
  displayOrder: z
    .number()
    .min(0, "Display order must be non-negative")
    .optional(),
});

export const updateBannerSchema = createBannerSchema.partial();

export const bannerFiltersSchema = z.object({
  type: z.enum(["banner", "promotion", "announcement"]).optional(),
  targetAudience: z
    .enum(["all", "customers", "providers", "specific"])
    .optional(),
  isActive: z.boolean().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1).max(100))
    .optional(),
});

// Promotion Validation Schemas
export const createPromotionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description cannot exceed 1000 characters"),
  type: z.enum(["discount", "cashback", "free_service", "bonus", "referral"], {
    errorMap: () => ({
      message:
        "Type must be discount, cashback, free_service, bonus, or referral",
    }),
  }),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z
    .number()
    .min(0, "Discount value must be non-negative")
    .optional(),
  minimumAmount: z
    .number()
    .min(0, "Minimum amount must be non-negative")
    .optional(),
  maximumDiscount: z
    .number()
    .min(0, "Maximum discount must be non-negative")
    .optional(),
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code cannot exceed 20 characters")
    .optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  targetAudience: z.enum(["all", "customers", "providers", "specific"], {
    errorMap: () => ({
      message: "Target audience must be all, customers, providers, or specific",
    }),
  }),
  targetRoles: z.array(z.enum(["customer", "provider", "admin"])).optional(),
  applicableServices: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  usageLimit: z.number().min(1, "Usage limit must be at least 1").optional(),
  userUsageLimit: z
    .number()
    .min(1, "User usage limit must be at least 1")
    .optional(),
  conditions: z.array(z.string()).optional(),
  terms: z.array(z.string()).optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

export const updatePromotionSchema = createPromotionSchema.partial();

export const promotionFiltersSchema = z.object({
  type: z
    .enum(["discount", "cashback", "free_service", "bonus", "referral"])
    .optional(),
  targetAudience: z
    .enum(["all", "customers", "providers", "specific"])
    .optional(),
  isActive: z.boolean().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1).max(100))
    .optional(),
});

// Referral Campaign Validation Schemas
export const createReferralCampaignSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description cannot exceed 1000 characters"),
  type: z.enum(["referrer_reward", "referee_reward", "both"], {
    errorMap: () => ({
      message: "Type must be referrer_reward, referee_reward, or both",
    }),
  }),
  referrerReward: z.object({
    type: z.enum(["percentage", "fixed", "bonus"], {
      errorMap: () => ({
        message: "Referrer reward type must be percentage, fixed, or bonus",
      }),
    }),
    value: z.number().min(0, "Referrer reward value must be non-negative"),
    description: z.string().min(1, "Referrer reward description is required"),
  }),
  refereeReward: z.object({
    type: z.enum(["percentage", "fixed", "bonus"], {
      errorMap: () => ({
        message: "Referee reward type must be percentage, fixed, or bonus",
      }),
    }),
    value: z.number().min(0, "Referee reward value must be non-negative"),
    description: z.string().min(1, "Referee reward description is required"),
  }),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  targetAudience: z.enum(["all", "customers", "providers", "specific"], {
    errorMap: () => ({
      message: "Target audience must be all, customers, providers, or specific",
    }),
  }),
  targetRoles: z.array(z.enum(["customer", "provider", "admin"])).optional(),
  minimumReferrals: z
    .number()
    .min(1, "Minimum referrals must be at least 1")
    .optional(),
  maximumReferrals: z
    .number()
    .min(1, "Maximum referrals must be at least 1")
    .optional(),
  referralCodeLength: z
    .number()
    .min(6, "Referral code length must be at least 6")
    .max(12, "Referral code length cannot exceed 12")
    .optional(),
  terms: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

export const updateReferralCampaignSchema =
  createReferralCampaignSchema.partial();

export const referralCampaignFiltersSchema = z.object({
  type: z.enum(["referrer_reward", "referee_reward", "both"]).optional(),
  targetAudience: z
    .enum(["all", "customers", "providers", "specific"])
    .optional(),
  isActive: z.boolean().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1).max(100))
    .optional(),
});

// Push Notification Validation Schemas
export const createPushNotificationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message cannot exceed 500 characters"),
  type: z
    .enum(["info", "success", "warning", "error", "promotion"], {
      errorMap: () => ({
        message: "Type must be info, success, warning, error, or promotion",
      }),
    })
    .optional(),
  targetAudience: z.enum(["all", "customers", "providers", "specific"], {
    errorMap: () => ({
      message: "Target audience must be all, customers, providers, or specific",
    }),
  }),
  targetRoles: z.array(z.enum(["customer", "provider", "admin"])).optional(),
  targetUsers: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"))
    .optional(),
  targetCategories: z.array(z.string()).optional(),
  targetServices: z.array(z.string()).optional(),
  data: z.record(z.any()).optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  actionUrl: z.string().url("Invalid action URL").optional(),
  actionText: z
    .string()
    .max(50, "Action text cannot exceed 50 characters")
    .optional(),
  priority: z
    .enum(["low", "normal", "high"], {
      errorMap: () => ({ message: "Priority must be low, normal, or high" }),
    })
    .optional(),
  scheduledFor: z.string().datetime("Invalid scheduled date").optional(),
  isActive: z.boolean().optional(),
});

export const updatePushNotificationSchema =
  createPushNotificationSchema.partial();

export const pushNotificationFiltersSchema = z.object({
  type: z.enum(["info", "success", "warning", "error", "promotion"]).optional(),
  targetAudience: z
    .enum(["all", "customers", "providers", "specific"])
    .optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  isSent: z.boolean().optional(),
  isActive: z.boolean().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1))
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1).max(100))
    .optional(),
});

// Bulk Operations Validation Schemas
export const bulkUpdateBannerStatusSchema = z.object({
  bannerIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid banner ID"))
    .min(1, "At least one banner ID is required"),
  isActive: z.boolean(),
});

export const bulkUpdatePromotionStatusSchema = z.object({
  promotionIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid promotion ID"))
    .min(1, "At least one promotion ID is required"),
  isActive: z.boolean(),
});

export const bulkSendNotificationsSchema = z.object({
  notificationIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID"))
    .min(1, "At least one notification ID is required"),
});

// Analytics Filters Schema
export const contentAnalyticsFiltersSchema = z.object({
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  targetAudience: z
    .enum(["all", "customers", "providers", "specific"])
    .optional(),
  type: z.string().optional(),
});
