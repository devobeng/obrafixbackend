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
router.get("/:id", serviceController.getServiceById);
router.get("/provider/:providerId", serviceController.getServicesByProvider);
router.get("/category/:category", serviceController.getServicesByCategory);
router.get(
  "/search",
  validateRequest(serviceSearchSchema, "query"),
  serviceController.searchServices
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
