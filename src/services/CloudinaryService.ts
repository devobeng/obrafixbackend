import cloudinary, {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadBase64ToCloudinary,
} from "../config/cloudinary";
import { AppError } from "../utils/AppError";

export class CloudinaryService {
  // Upload profile image
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string
  ): Promise<{ public_id: string; secure_url: string }> {
    try {
      const result = await uploadToCloudinary(file, `profile-images/${userId}`);
      return result;
    } catch (error) {
      throw new AppError("Failed to upload profile image", 500);
    }
  }

  // Upload profile image from base64
  async uploadProfileImageBase64(
    base64String: string,
    userId: string
  ): Promise<{ public_id: string; secure_url: string }> {
    try {
      console.log(
        "CloudinaryService: Starting profile image upload for user:",
        userId
      );
      console.log(
        "CloudinaryService: Base64 string length:",
        base64String.length
      );
      console.log(
        "CloudinaryService: Base64 string preview:",
        base64String.substring(0, 100) + "..."
      );

      const result = await uploadBase64ToCloudinary(
        base64String,
        `profile-images/${userId}`
      );

      console.log("CloudinaryService: Upload successful:", result.secure_url);
      return result;
    } catch (error) {
      console.error("CloudinaryService: Upload failed:", error);
      throw new AppError(
        `Failed to upload profile image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        500
      );
    }
  }

  // Upload business document
  async uploadBusinessDocument(
    file: Express.Multer.File,
    userId: string,
    documentType: string
  ): Promise<{ public_id: string; secure_url: string }> {
    try {
      const result = await uploadToCloudinary(
        file,
        `business-documents/${userId}/${documentType}`
      );
      return result;
    } catch (error) {
      throw new AppError("Failed to upload business document", 500);
    }
  }

  // Upload business document from base64
  async uploadBusinessDocumentBase64(
    base64String: string,
    userId: string,
    documentType: string
  ): Promise<{ public_id: string; secure_url: string }> {
    try {
      const result = await uploadBase64ToCloudinary(
        base64String,
        `business-documents/${userId}/${documentType}`
      );
      return result;
    } catch (error) {
      throw new AppError("Failed to upload business document", 500);
    }
  }

  // Delete image
  async deleteImage(publicId: string): Promise<void> {
    try {
      await deleteFromCloudinary(publicId);
    } catch (error) {
      throw new AppError("Failed to delete image", 500);
    }
  }

  // Get image info
  async getImageInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      throw new AppError("Failed to get image info", 500);
    }
  }

  // List images in folder
  async listImages(folder: string): Promise<any[]> {
    try {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: folder,
      });
      return result.resources;
    } catch (error) {
      throw new AppError("Failed to list images", 500);
    }
  }

  // Update image
  async updateImage(
    publicId: string,
    transformations: any
  ): Promise<{ public_id: string; secure_url: string }> {
    try {
      const result = await cloudinary.uploader.explicit(publicId, {
        type: "upload",
        ...transformations,
      });
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    } catch (error) {
      throw new AppError("Failed to update image", 500);
    }
  }
}

export const cloudinaryService = new CloudinaryService();
