import { z } from "zod";

// FAQ search schema
export const faqSearchSchema = z.object({
  q: z.string().min(2, "Search term must be at least 2 characters long"),
  category: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// FAQ suggestions schema
export const faqSuggestionsSchema = z.object({
  q: z.string().min(2, "Query must be at least 2 characters long"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// FAQ helpful/not helpful schema
export const faqFeedbackSchema = z.object({
  faqId: z.string().min(1, "FAQ ID is required"),
});

// FAQ related schema
export const faqRelatedSchema = z.object({
  faqId: z.string().min(1, "FAQ ID is required"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// FAQ category schema
export const faqCategorySchema = z.object({
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
});

// FAQ by ID schema
export const faqByIdSchema = z.object({
  faqId: z.string().min(1, "FAQ ID is required"),
});

// FAQ popular schema
export const faqPopularSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// FAQ statistics schema
export const faqStatisticsSchema = z.object({});

// Group all validators
export const faqValidators = {
  search: faqSearchSchema,
  suggestions: faqSuggestionsSchema,
  feedback: faqFeedbackSchema,
  related: faqRelatedSchema,
  category: faqCategorySchema,
  byId: faqByIdSchema,
  popular: faqPopularSchema,
  statistics: faqStatisticsSchema,
};
