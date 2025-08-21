import { Router } from "express";
import userController from "../controllers/userController";
import { authenticate, requireRole } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import {
  userUpdateSchema,
  userRoleUpdateSchema,
  userSearchSchema,
  userFiltersSchema,
} from "../validators/userValidator";

const router = Router();

// All routes require authentication
router.use(authenticate());

// Public user routes (authenticated users can access their own data)
router.get("/:id", userController.getUserById);
router.put(
  "/:id",
  validateRequest(userUpdateSchema),
  userController.updateUser
);

// Admin only routes
router.get(
  "/",
  validateRequest(userFiltersSchema, "query"),
  requireRole("admin"),
  userController.getAllUsers
);
router.delete("/:id", requireRole("admin"), userController.deleteUser);
router.patch(
  "/:id/role",
  validateRequest(userRoleUpdateSchema),
  requireRole("admin"),
  userController.updateUserRole
);
router.patch("/:id/verify", requireRole("admin"), userController.verifyUser);
router.get(
  "/search",
  validateRequest(userSearchSchema, "query"),
  requireRole("admin"),
  userController.searchUsers
);
router.get(
  "/stats/overview",
  requireRole("admin"),
  userController.getUserStats
);

export default router;
