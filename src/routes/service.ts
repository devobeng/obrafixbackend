import { Router } from "express";
import serviceController from "../controllers/serviceController";
import { authenticate, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import {
  serviceCreateSchema,
  serviceUpdateSchema,
  serviceStatusUpdateSchema,
  serviceFiltersSchema,
  serviceSearchSchema,
  servicePaginationSchema,
} from "../validators/serviceValidator";

const router = Router();

// Public routes (no authentication required)
router.get(
  "/",
  validateRequest(servicePaginationSchema, "query"),
  serviceController.getAllServices
);
router.get("/popular", serviceController.getPopularServices);
router.get("/compare", serviceController.compareServices);
router.get("/:id", serviceController.getServiceById);
router.get("/provider/:providerId", serviceController.getServicesByProvider);
router.get("/category/:category", serviceController.getServicesByCategory);
router.get(
  "/search",
  validateRequest(serviceSearchSchema, "query"),
  serviceController.searchServices
);

// Authenticated user routes for bookmarks
router.post("/:id/bookmark", authenticate(), serviceController.toggleBookmark);
router.get(
  "/bookmarked",
  authenticate(),
  serviceController.getBookmarkedServices
);

// Protected routes (provider/admin only)
router.post(
  "/",
  authenticate(),
  requireRole(["provider", "admin"]),
  validateRequest(serviceCreateSchema),
  serviceController.createService
);
router.put(
  "/:id",
  authenticate(),
  requireRole(["provider", "admin"]),
  validateRequest(serviceUpdateSchema),
  serviceController.updateService
);
router.delete(
  "/:id",
  authenticate(),
  requireRole(["provider", "admin"]),
  serviceController.deleteService
);
router.patch(
  "/:id/status",
  authenticate(),
  requireRole(["provider", "admin"]),
  validateRequest(serviceStatusUpdateSchema),
  serviceController.updateServiceStatus
);
router.patch(
  "/:id/availability",
  authenticate(),
  requireRole(["provider", "admin"]),
  serviceController.updateServiceAvailability
);

// Enhanced service queries
router.get(
  "/availability",
  validateRequest(serviceFiltersSchema, "query"),
  serviceController.getServicesByAvailability
);
router.get(
  "/radius",
  validateRequest(serviceFiltersSchema, "query"),
  serviceController.getServicesWithinRadius
);
router.get("/stats", serviceController.getServiceStats);

export default router;
