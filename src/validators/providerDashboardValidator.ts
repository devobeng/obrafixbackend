import { z } from "zod";

// Service creation and update validation
export const createServiceSchema = z.object({
  title: z
    .string()
    .min(3, "Service title must be at least 3 characters long")
    .max(100, "Service title cannot exceed 100 characters"),
  description: z
    .string()
    .min(10, "Service description must be at least 10 characters long")
    .max(1000, "Service description cannot exceed 1000 characters"),
  category: z.enum([
    "cleaning",
    "plumbing",
    "electrical",
    "carpentry",
    "gardening",
    "painting",
    "moving",
    "repair",
    "maintenance",
    "other",
  ]),
  subcategory: z.string().optional(),
  pricing: z.object({
    type: z.enum(["hourly", "fixed", "negotiable"]),
    amount: z.number().min(0, "Price cannot be negative"),
    currency: z.enum(["GHS", "USD", "EUR"]).default("GHS"),
    unit: z.string().optional(),
  }),
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
    serviceRadius: z.number().min(1).max(100).default(10),
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
      noticeRequired: z.number().min(0).default(24),
    })
    .optional(),
  providerPreferences: z
    .object({
      maxDistance: z.number().min(1).max(100).default(10),
      preferredWorkingHours: z
        .object({
          startTime: z.string(),
          endTime: z.string(),
        })
        .optional(),
      emergencyServiceAvailable: z.boolean().default(false),
      weekendService: z.boolean().default(false),
      holidayService: z.boolean().default(false),
    })
    .optional(),
  scheduling: z
    .object({
      advanceBookingRequired: z.number().min(0).default(24),
      maxBookingsPerDay: z.number().min(1).max(20).default(5),
      cancellationPolicy: z
        .enum(["flexible", "moderate", "strict"])
        .default("moderate"),
      cancellationNotice: z.number().min(0).default(2),
    })
    .optional(),
  coverage: z
    .object({
      cities: z.array(z.string()).optional(),
      neighborhoods: z.array(z.string()).optional(),
      postalCodes: z.array(z.string()).optional(),
      customAreas: z.array(z.string()).optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  estimatedDuration: z.string().optional(),
  warranty: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

// Job request response validation
export const acceptJobRequestSchema = z.object({
  estimatedStartTime: z.string().datetime("Invalid estimated start time"),
  estimatedDuration: z
    .number()
    .min(0.5)
    .max(24, "Duration must be between 0.5 and 24 hours"),
  note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
});

export const rejectJobRequestSchema = z.object({
  note: z
    .string()
    .min(10, "Rejection note must be at least 10 characters long")
    .max(500, "Rejection note cannot exceed 500 characters"),
});

// Job status update validation
export const updateJobStatusSchema = z.object({
  status: z.enum([
    "on_the_way",
    "in_progress",
    "completed",
    "paused",
    "resumed",
  ]),
  estimatedArrival: z
    .string()
    .datetime("Invalid estimated arrival time")
    .optional(),
  estimatedCompletion: z
    .string()
    .datetime("Invalid estimated completion time")
    .optional(),
  completionNotes: z
    .string()
    .max(1000, "Completion notes cannot exceed 1000 characters")
    .optional(),
  pauseReason: z
    .string()
    .max(500, "Pause reason cannot exceed 500 characters")
    .optional(),
});

// Service availability update validation
export const updateServiceAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  workingDays: z.array(
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
  ),
  emergencyService: z.boolean().default(false),
  noticeRequired: z.number().min(0).default(24),
});

// Service area update validation
export const updateServiceAreaSchema = z.object({
  serviceRadius: z.number().min(1).max(100),
  maxDistance: z.number().min(1).max(100),
  coverage: z
    .object({
      cities: z.array(z.string()).optional(),
      neighborhoods: z.array(z.string()).optional(),
      postalCodes: z.array(z.string()).optional(),
      customAreas: z.array(z.string()).optional(),
    })
    .optional(),
});

// Online status validation
export const setOnlineStatusSchema = z.object({
  isOnline: z.boolean(),
});

// Export all validators
export const providerDashboardValidators = {
  createService: createServiceSchema,
  updateService: updateServiceSchema,
  acceptJobRequest: acceptJobRequestSchema,
  rejectJobRequest: rejectJobRequestSchema,
  updateJobStatus: updateJobStatusSchema,
  updateServiceAvailability: updateServiceAvailabilitySchema,
  updateServiceArea: updateServiceAreaSchema,
  setOnlineStatus: setOnlineStatusSchema,
};
