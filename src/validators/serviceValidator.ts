import { z } from "zod";

// Service creation validation schema
export const serviceCreateSchema = z.object({
  title: z.string().min(3, "Service title must be at least 3 characters"),
  description: z
    .string()
    .min(10, "Service description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  pricing: z.object({
    type: z.enum(["hourly", "fixed", "negotiable"]),
    amount: z.number().positive("Price amount must be positive"),
    currency: z.enum(["GHS", "USD", "EUR"]).default("GHS"),
    unit: z.string().optional(),
  }),
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
      .optional(),
    serviceRadius: z
      .number()
      .min(1, "Service radius must be at least 1km")
      .max(100, "Service radius cannot exceed 100km")
      .default(10),
  }),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
        alt: z.string().optional(),
      })
    )
    .optional(),
  availability: z
    .object({
      isAvailable: z.boolean().default(true),
      workingDays: z
        .array(
          z.object({
            day: z.enum([
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ]),
            startTime: z.string(),
            endTime: z.string(),
            isAvailable: z.boolean().default(true),
          })
        )
        .optional(),
      emergencyService: z.boolean().default(false),
      noticeRequired: z
        .number()
        .min(0, "Notice required cannot be negative")
        .default(24),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  estimatedDuration: z.string().optional(),
  warranty: z.string().optional(),
});

// Service update validation schema
export const serviceUpdateSchema = z.object({
  title: z
    .string()
    .min(3, "Service title must be at least 3 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Service description must be at least 10 characters")
    .optional(),
  category: z.string().min(1, "Category is required").optional(),
  subcategory: z.string().optional(),
  pricing: z
    .object({
      type: z.enum(["hourly", "fixed", "negotiable"]).optional(),
      amount: z.number().positive("Price amount must be positive").optional(),
      currency: z.enum(["GHS", "USD", "EUR"]).optional(),
      unit: z.string().optional(),
    })
    .optional(),
  location: z
    .object({
      city: z.string().min(1, "City is required").optional(),
      state: z.string().min(1, "State is required").optional(),
      country: z.string().min(1, "Country is required").optional(),
      coordinates: z
        .object({
          latitude: z.number().min(-90).max(90).optional(),
          longitude: z.number().min(-180).max(180).optional(),
        })
        .optional(),
      serviceRadius: z
        .number()
        .min(1, "Service radius must be at least 1km")
        .max(100, "Service radius cannot exceed 100km")
        .optional(),
    })
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
        alt: z.string().optional(),
      })
    )
    .optional(),
  availability: z
    .object({
      isAvailable: z.boolean().optional(),
      workingDays: z
        .array(
          z.object({
            day: z.enum([
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ]),
            startTime: z.string(),
            endTime: z.string(),
            isAvailable: z.boolean().default(true),
          })
        )
        .optional(),
      emergencyService: z.boolean().optional(),
      noticeRequired: z
        .number()
        .min(0, "Notice required cannot be negative")
        .optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  estimatedDuration: z.string().optional(),
  warranty: z.string().optional(),
  commissionRate: z
    .number()
    .min(0, "Commission rate cannot be negative")
    .max(100, "Commission rate cannot exceed 100%")
    .optional(),
});

// Service status update validation schema
export const serviceStatusUpdateSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"], {
    errorMap: () => ({
      message: "Status must be active, inactive, or suspended",
    }),
  }),
});

// Service filters validation schema
export const serviceFiltersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  location: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  rating: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  availability: z.string().optional(),
  serviceRadius: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  pricingType: z.enum(["hourly", "fixed", "negotiable"]).optional(),
});

// Service search validation schema
export const serviceSearchSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "10")),
});

// Service pagination validation schema
export const servicePaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "10")),
});
