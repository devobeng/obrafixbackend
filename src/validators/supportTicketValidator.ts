import { z } from "zod";

// Create support ticket schema
export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters long")
    .max(200, "Subject must not exceed 200 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(1000, "Description must not exceed 1000 characters"),
  category: z.enum(
    [
      "technical_issue",
      "billing_payment",
      "service_quality",
      "account_access",
      "safety_concern",
      "general_inquiry",
      "complaint",
      "feature_request",
      "other",
    ],
    {
      errorMap: () => ({ message: "Invalid category selected" }),
    }
  ),
  attachments: z.array(z.string().url("Invalid attachment URL")).optional(),
  tags: z
    .array(z.string().min(2, "Tag must be at least 2 characters long"))
    .optional(),
  isUrgent: z.boolean().optional(),
});

// Update support ticket schema
export const updateTicketSchema = z.object({
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters long")
    .max(200, "Subject must not exceed 200 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  category: z
    .enum([
      "technical_issue",
      "billing_payment",
      "service_quality",
      "account_access",
      "safety_concern",
      "general_inquiry",
      "complaint",
      "feature_request",
      "other",
    ])
    .optional(),
  tags: z
    .array(z.string().min(2, "Tag must be at least 2 characters long"))
    .optional(),
  isUrgent: z.boolean().optional(),
});

// Add comment schema
export const addCommentSchema = z.object({
  comment: z
    .string()
    .min(5, "Comment must be at least 5 characters long")
    .max(500, "Comment must not exceed 500 characters"),
});

// Get tickets schema
export const getTicketsSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Search tickets schema
export const searchTicketsSchema = z.object({
  q: z.string().min(2, "Search term must be at least 2 characters long"),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Ticket ID schema
export const ticketIdSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
});

// Group all validators
export const supportTicketValidators = {
  create: createTicketSchema,
  update: updateTicketSchema,
  addComment: addCommentSchema,
  getTickets: getTicketsSchema,
  search: searchTicketsSchema,
  ticketId: ticketIdSchema,
};
