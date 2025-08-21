import { z } from "zod";

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .min(10, "Cancellation reason must be at least 10 characters long")
    .max(500, "Cancellation reason cannot exceed 500 characters"),
});

export const rescheduleBookingSchema = z.object({
  newDate: z.string().refine((date) => {
    const parsedDate = new Date(date);
    return parsedDate > new Date();
  }, "New date must be in the future"),
  newTime: z.string().min(1, "New time is required"),
  reason: z
    .string()
    .min(10, "Reschedule reason must be at least 10 characters long")
    .max(500, "Reschedule reason cannot exceed 500 characters"),
});

export const enhancedBookingValidators = {
  cancelBooking: cancelBookingSchema,
  rescheduleBooking: rescheduleBookingSchema,
};
