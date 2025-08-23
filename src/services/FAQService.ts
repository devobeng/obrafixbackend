import { FAQ, IFAQ } from "../models/FAQ";
import { AppError } from "../utils/AppError";

export class FAQService {
  // Get FAQs by category
  async getFAQsByCategory(
    category: string,
    subcategory?: string
  ): Promise<IFAQ[]> {
    try {
      return await FAQ.findByCategory(category, subcategory);
    } catch (error) {
      throw new AppError("Failed to retrieve FAQs", 500);
    }
  }

  // Search FAQs
  async searchFAQs(searchTerm: string, category?: string): Promise<IFAQ[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError(
          "Search term must be at least 2 characters long",
          400
        );
      }

      return await FAQ.search(searchTerm.trim(), category);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to search FAQs", 500);
    }
  }

  // Get popular FAQs
  async getPopularFAQs(limit: number = 10): Promise<IFAQ[]> {
    try {
      return await FAQ.getPopular(limit);
    } catch (error) {
      throw new AppError("Failed to retrieve popular FAQs", 500);
    }
  }

  // Get FAQ categories with counts
  async getCategoriesWithCounts(): Promise<any[]> {
    try {
      return await FAQ.getCategoriesWithCounts();
    } catch (error) {
      throw new AppError("Failed to retrieve FAQ categories", 500);
    }
  }

  // Get FAQ by ID
  async getFAQById(faqId: string): Promise<IFAQ> {
    try {
      const faq = await FAQ.findById(faqId);
      if (!faq) {
        throw new AppError("FAQ not found", 404);
      }

      if (!faq.isActive) {
        throw new AppError("FAQ is not active", 400);
      }

      return faq;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to retrieve FAQ", 500);
    }
  }

  // Mark FAQ as helpful
  async markFAQHelpful(faqId: string): Promise<void> {
    try {
      await FAQ.findByIdAndUpdate(faqId, {
        $inc: { helpfulCount: 1 },
      });
    } catch (error) {
      throw new AppError("Failed to mark FAQ as helpful", 500);
    }
  }

  // Mark FAQ as not helpful
  async markFAQNotHelpful(faqId: string): Promise<void> {
    try {
      await FAQ.findByIdAndUpdate(faqId, {
        $inc: { notHelpfulCount: 1 },
      });
    } catch (error) {
      throw new AppError("Failed to mark FAQ as not helpful", 500);
    }
  }

  // Get FAQ suggestions based on user query
  async getSuggestions(userQuery: string, limit: number = 5): Promise<IFAQ[]> {
    try {
      if (!userQuery || userQuery.trim().length < 2) {
        return [];
      }

      const searchResults = await FAQ.search(userQuery.trim());
      return searchResults.slice(0, limit);
    } catch (error) {
      console.error("Error getting FAQ suggestions:", error);
      return [];
    }
  }

  // Get related FAQs
  async getRelatedFAQs(faqId: string, limit: number = 5): Promise<IFAQ[]> {
    try {
      const currentFAQ = await FAQ.findById(faqId);
      if (!currentFAQ) {
        return [];
      }

      // Find FAQs with similar tags or category
      const relatedFAQs = await FAQ.find({
        _id: { $ne: faqId },
        isActive: true,
        $or: [
          { category: currentFAQ.category },
          { tags: { $in: currentFAQ.tags } },
        ],
      })
        .sort({ helpfulCount: -1, priority: -1 })
        .limit(limit);

      return relatedFAQs;
    } catch (error) {
      console.error("Error getting related FAQs:", error);
      return [];
    }
  }

  // Get FAQ statistics
  async getFAQStatistics(): Promise<{
    totalFAQs: number;
    categories: any[];
    popularTopics: string[];
  }> {
    try {
      const [totalFAQs, categories] = await Promise.all([
        FAQ.countDocuments({ isActive: true }),
        FAQ.getCategoriesWithCounts(),
      ]);

      // Get popular topics based on tags
      const popularTopics = await FAQ.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$tags" },
        {
          $group: {
            _id: "$tags",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { topic: "$_id", count: 1, _id: 0 } },
      ]);

      return {
        totalFAQs,
        categories,
        popularTopics: popularTopics.map((t) => t.topic),
      };
    } catch (error) {
      throw new AppError("Failed to retrieve FAQ statistics", 500);
    }
  }
}
