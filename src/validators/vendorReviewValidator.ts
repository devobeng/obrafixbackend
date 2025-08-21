import { z } from "zod";

export const createReviewSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  bookingId: z.string().min(1, "Booking ID is required"),
  jobRating: z
    .number()
    .min(1, "Job rating must be at least 1")
    .max(5, "Job rating cannot exceed 5"),
  communicationRating: z
    .number()
    .min(1, "Communication rating must be at least 1")
    .max(5, "Communication rating cannot exceed 5"),
  punctualityRating: z
    .number()
    .min(1, "Punctuality rating must be at least 1")
    .max(5, "Punctuality rating cannot exceed 5"),
  qualityRating: z
    .number()
    .min(1, "Quality rating must be at least 1")
    .max(5, "Quality rating cannot exceed 5"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(1000, "Comment cannot exceed 1000 characters"),
  images: z.array(z.string().url("Invalid image URL")).optional(),
});

export const updateReviewSchema = z.object({
  jobRating: z
    .number()
    .min(1, "Job rating must be at least 1")
    .max(5, "Job rating cannot exceed 5")
    .optional(),
  communicationRating: z
    .number()
    .min(1, "Communication rating must be at least 1")
    .max(5, "Communication rating cannot exceed 5")
    .optional(),
  punctualityRating: z
    .number()
    .min(1, "Punctuality rating must be at least 1")
    .max(5, "Punctuality rating cannot exceed 5")
    .optional(),
  qualityRating: z
    .number()
    .min(1, "Quality rating must be at least 1")
    .max(5, "Quality rating cannot exceed 5")
    .optional(),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
  images: z.array(z.string().url("Invalid image URL")).optional(),
});

export const reportReviewSchema = z.object({
  reason: z
    .string()
    .min(10, "Report reason must be at least 10 characters long")
    .max(500, "Report reason cannot exceed 500 characters"),
});

export const vendorReviewValidators = {
  createReview: createReviewSchema,
  updateReview: updateReviewSchema,
  reportReview: reportReviewSchema,
};
