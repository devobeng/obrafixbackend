import express from "express";
import { FAQController } from "../controllers/FAQController";

const router = express.Router();
const faqController = new FAQController();

// Public routes (no authentication required)
router.get("/categories", faqController.getCategoriesWithCounts);
router.get("/popular", faqController.getPopularFAQs);
router.get("/search", faqController.searchFAQs);
router.get("/suggestions", faqController.getSuggestions);
router.get("/statistics", faqController.getFAQStatistics);

// FAQ by category
router.get("/category/:category", faqController.getFAQsByCategory);

// FAQ by ID
router.get("/:faqId", faqController.getFAQById);

// Related FAQs
router.get("/:faqId/related", faqController.getRelatedFAQs);

// Mark FAQ as helpful/not helpful
router.post("/:faqId/helpful", faqController.markFAQHelpful);
router.post("/:faqId/not-helpful", faqController.markFAQNotHelpful);

export default router;
