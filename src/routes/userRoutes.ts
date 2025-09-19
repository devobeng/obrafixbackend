import { Router } from "express";
import { userController } from "../controllers/userController";
import { authenticateToken } from "../middleware/auth";
import upload from "../config/multer";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Profile image routes
router.post(
  "/profile-image",
  upload.single("image"),
  userController.uploadProfileImage
);
router.post("/profile-image-base64", userController.uploadProfileImageBase64);
router.delete("/profile-image", userController.deleteProfileImage);

// Business document routes
router.post(
  "/business-document",
  upload.single("document"),
  userController.uploadBusinessDocument
);
router.post(
  "/business-document-base64",
  userController.uploadBusinessDocumentBase64
);
router.delete("/business-document", userController.deleteBusinessDocument);

// Profile routes
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);

export default router;
