import { Router } from "express";
import categoryController from "../controllers/serviceCategoryController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/root", categoryController.getRootCategories);
router.get("/:id", categoryController.getCategoryById);
router.get("/:parentId/subcategories", categoryController.getSubcategories);

// Admin-only routes
router.post(
  "/",
  authenticate(),
  requireRole("admin"),
  categoryController.createCategory
);
router.put(
  "/:id",
  authenticate(),
  requireRole("admin"),
  categoryController.updateCategory
);
router.delete(
  "/:id",
  authenticate(),
  requireRole("admin"),
  categoryController.deleteCategory
);
router.patch(
  "/:id/commission",
  authenticate(),
  requireRole("admin"),
  categoryController.updateCommissionRate
);
router.patch(
  "/:id/status",
  authenticate(),
  requireRole("admin"),
  categoryController.toggleCategoryStatus
);
router.get(
  "/stats/overview",
  authenticate(),
  requireRole("admin"),
  categoryController.getCategoryStats
);

export default router;
