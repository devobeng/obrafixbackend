import express from "express";
import { authenticate } from "../middleware/auth";
import upload from "../config/multer";
import { cloudinaryService } from "../services/CloudinaryService";

const router = express.Router();

// Apply authentication middleware to all upload routes
router.use(authenticate);

// Upload profile image
router.post("/profile-image", async (req, res) => {
  try {
    // TODO: Implement profile image upload logic
    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        url: "https://example.com/profile-image.jpg",
        filename: "profile-image.jpg",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload profile image",
      error: error.message,
    });
  }
});

// Upload service images
router.post("/service-media", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const uploads = await Promise.all(
      files.map((file) =>
        cloudinaryService.uploadProfileImage(file, "service-media")
      )
    );

    res.status(200).json({
      success: true,
      message: "Service media uploaded successfully",
      data: uploads.map((u) => ({ url: u.secure_url, publicId: u.public_id })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to upload service media",
      error: error.message,
    });
  }
});

// Upload documents (for verification)
router.post("/documents", async (req, res) => {
  try {
    // TODO: Implement document upload logic
    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        url: "https://example.com/document.pdf",
        filename: "document.pdf",
        type: "verification",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
      error: error.message,
    });
  }
});

// Upload chat files
router.post("/chat-files", async (req, res) => {
  try {
    // TODO: Implement chat file upload logic
    res.status(200).json({
      success: true,
      message: "Chat file uploaded successfully",
      data: {
        url: "https://example.com/chat-file.jpg",
        filename: "chat-file.jpg",
        size: 1024000,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload chat file",
      error: error.message,
    });
  }
});

export default router;
