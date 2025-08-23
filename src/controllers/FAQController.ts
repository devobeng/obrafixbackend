import { Request, Response, NextFunction } from "express";
import { FAQService } from "../services/FAQService";
import { AppError } from "../utils/AppError";

export class FAQController {
  private faqService: FAQService;

  constructor() {
    this.faqService = new FAQService();
  }

  // Get FAQs by category
  getFAQsByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { category, subcategory } = req.query;

      if (!category || typeof category !== "string") {
        throw new AppError("Category is required", 400);
      }

      const faqs = await this.faqService.getFAQsByCategory(
        category,
        subcategory as string
      );

      res.status(200).json({
        success: true,
        data: faqs,
      });
    } catch (error) {
      next(error);
    }
  };

  // Search FAQs
  searchFAQs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { q: searchTerm, category, page = "1", limit = "10" } = req.query;

      if (!searchTerm || typeof searchTerm !== "string") {
        throw new AppError("Search term is required", 400);
      }

      const faqs = await this.faqService.searchFAQs(
        searchTerm,
        category as string
      );

      res.status(200).json({
        success: true,
        data: faqs,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get popular FAQs
  getPopularFAQs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { limit = "10" } = req.query;
      const limitNum = parseInt(limit as string, 10);

      const faqs = await this.faqService.getPopularFAQs(limitNum);

      res.status(200).json({
        success: true,
        data: faqs,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get FAQ categories with counts
  getCategoriesWithCounts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const categories = await this.faqService.getCategoriesWithCounts();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get FAQ by ID
  getFAQById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { faqId } = req.params;

      const faq = await this.faqService.getFAQById(faqId);

      res.status(200).json({
        success: true,
        data: faq,
      });
    } catch (error) {
      next(error);
    }
  };

  // Mark FAQ as helpful
  markFAQHelpful = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { faqId } = req.params;

      await this.faqService.markFAQHelpful(faqId);

      res.status(200).json({
        success: true,
        message: "FAQ marked as helpful",
      });
    } catch (error) {
      next(error);
    }
  };

  // Mark FAQ as not helpful
  markFAQNotHelpful = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { faqId } = req.params;

      await this.faqService.markFAQNotHelpful(faqId);

      res.status(200).json({
        success: true,
        message: "FAQ marked as not helpful",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get FAQ suggestions
  getSuggestions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { q: userQuery, limit = "5" } = req.query;

      if (!userQuery || typeof userQuery !== "string") {
        throw new AppError("Query is required", 400);
      }

      const limitNum = parseInt(limit as string, 10);
      const suggestions = await this.faqService.getSuggestions(
        userQuery,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get related FAQs
  getRelatedFAQs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { faqId } = req.params;
      const { limit = "5" } = req.query;
      const limitNum = parseInt(limit as string, 10);

      const relatedFAQs = await this.faqService.getRelatedFAQs(faqId, limitNum);

      res.status(200).json({
        success: true,
        data: relatedFAQs,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get FAQ statistics
  getFAQStatistics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const statistics = await this.faqService.getFAQStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  };
}
