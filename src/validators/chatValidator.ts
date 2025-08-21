import { z } from "zod";

// Send message schema
export const sendMessageSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message too long"),
  messageType: z
    .enum(["text", "image", "file", "location"], {
      errorMap: () => ({ message: "Invalid message type" }),
    })
    .default("text"),
  metadata: z
    .object({
      fileUrl: z.string().url("Invalid file URL").optional(),
      fileName: z.string().optional(),
      fileSize: z.number().positive("File size must be positive").optional(),
      location: z
        .object({
          latitude: z.number().min(-90).max(90, "Invalid latitude"),
          longitude: z.number().min(-180).max(180, "Invalid longitude"),
          address: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

// Get chat history schema
export const getChatHistorySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a number")
    .transform((val) => parseInt(val))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
    .optional(),
  before: z.string().datetime("Invalid date format").optional(),
});

// Mark messages as read schema
export const markMessagesAsReadSchema = z.object({
  messageIds: z
    .array(z.string().min(1, "Message ID is required"))
    .min(1, "At least one message ID is required")
    .max(100, "Maximum 100 messages can be marked as read at once"),
});

// Send typing indicator schema
export const sendTypingIndicatorSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  isTyping: z.boolean("isTyping must be a boolean"),
});

// Send location update schema
export const sendLocationUpdateSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  location: z.object({
    latitude: z.number().min(-90).max(90, "Invalid latitude"),
    longitude: z.number().min(-180).max(180, "Invalid longitude"),
    address: z.string().optional(),
  }),
});

// Export validators object for use in routes
export const chatValidators = {
  sendMessage: sendMessageSchema,
  getChatHistory: getChatHistorySchema,
  markMessagesAsRead: markMessagesAsReadSchema,
  sendTypingIndicator: sendTypingIndicatorSchema,
  sendLocationUpdate: sendLocationUpdateSchema,
};
