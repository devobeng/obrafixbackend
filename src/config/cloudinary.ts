import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"] || "",
  api_key: process.env["CLOUDINARY_API_KEY"] || "",
  api_secret: process.env["CLOUDINARY_API_SECRET"] || "",
});

export default cloudinary;

// Helper function to upload image to Cloudinary
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = "general"
): Promise<{ public_id: string; secure_url: string }> => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};

// Helper function to upload base64 image
export const uploadBase64ToCloudinary = async (
  base64String: string,
  folder: string = "general"
): Promise<{ public_id: string; secure_url: string }> => {
  try {
    console.log("Cloudinary config: Starting base64 upload to folder:", folder);
    console.log(
      "Cloudinary config: Base64 string length:",
      base64String.length
    );

    // Validate base64 string
    if (!base64String || base64String.length < 100) {
      throw new Error("Invalid base64 string provided");
    }

    // Check if base64 string is too large (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const base64Size = (base64String.length * 3) / 4; // Approximate size in bytes
    if (base64Size > maxSize) {
      throw new Error(
        `Base64 string too large: ${Math.round(
          base64Size / 1024 / 1024
        )}MB (max 10MB)`
      );
    }

    // Ensure base64 string has proper format
    if (!base64String.startsWith("data:image/")) {
      console.warn(
        "Base64 string doesn't start with 'data:image/', adding prefix"
      );
      base64String = `data:image/jpeg;base64,${base64String}`;
    }

    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
    });

    console.log(
      "Cloudinary config: Upload successful, public_id:",
      result.public_id
    );
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary base64 upload error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(
      `Failed to upload base64 image to Cloudinary: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
