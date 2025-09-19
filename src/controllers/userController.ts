import { Request, Response } from "express";
import { User } from "../models/User";
import { cloudinaryService } from "../services/CloudinaryService";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";
import upload from "../config/multer";

export class UserController {
  // Upload profile image
  public uploadProfileImage = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }

      if (!req.file) {
        throw new AppError("No image file provided", 400);
      }

      try {
        // Upload to Cloudinary
        const result = await cloudinaryService.uploadProfileImage(
          req.file,
          userId
        );

        // Update user profile image
        await User.findByIdAndUpdate(userId, {
          profileImage: result.secure_url,
        });

        res.json({
          success: true,
          message: "Profile image uploaded successfully",
          data: {
            profileImage: result.secure_url,
            publicId: result.public_id,
          },
        });
      } catch (error) {
        throw new AppError("Failed to upload profile image", 500);
      }
    }
  );

  // Upload profile image from base64
  public uploadProfileImageBase64 = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }

      const { base64Image } = req.body;
      if (!base64Image) {
        throw new AppError("No base64 image provided", 400);
      }

      try {
        // Upload to Cloudinary
        const result = await cloudinaryService.uploadProfileImageBase64(
          base64Image,
          userId
        );

        // Update user profile image
        await User.findByIdAndUpdate(userId, {
          profileImage: result.secure_url,
        });

        res.json({
          success: true,
          message: "Profile image uploaded successfully",
          data: {
            profileImage: result.secure_url,
            publicId: result.public_id,
          },
        });
      } catch (error) {
        throw new AppError("Failed to upload profile image", 500);
      }
    }
  );

  // Delete profile image
  public deleteProfileImage = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }

      const { publicId } = req.body;
      if (!publicId) {
        throw new AppError("No public ID provided", 400);
      }

      try {
        // Delete from Cloudinary
        await cloudinaryService.deleteImage(publicId);

        // Update user profile image
        await User.findByIdAndUpdate(userId, { profileImage: "" });

        res.json({
          success: true,
          message: "Profile image deleted successfully",
        });
      } catch (error) {
        throw new AppError("Failed to delete profile image", 500);
      }
    }
  );

  // Upload business document
  public uploadBusinessDocument = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }

      if (!req.file) {
        throw new AppError("No document file provided", 400);
      }

      const { documentType } = req.body;
      if (!documentType) {
        throw new AppError("Document type is required", 400);
      }

      try {
        // Upload to Cloudinary
        const result = await cloudinaryService.uploadBusinessDocument(
          req.file,
          userId,
          documentType
        );

        // Update user provider profile
        const user = await User.findById(userId);
        if (!user) {
          throw new AppError("User not found", 404);
        }

        if (!user.providerProfile) {
          user.providerProfile = {};
        }

        if (!user.providerProfile.idVerification) {
          user.providerProfile.idVerification = {
            documentType: documentType as any,
            documentNumber: "",
            documentImage: result.secure_url,
            isVerified: false,
          };
        } else {
          user.providerProfile.idVerification.documentImage = result.secure_url;
          user.providerProfile.idVerification.documentType =
            documentType as any;
        }

        await user.save();

        res.json({
          success: true,
          message: "Business document uploaded successfully",
          data: {
            documentImage: result.secure_url,
            publicId: result.public_id,
            documentType,
          },
        });
      } catch (error) {
        throw new AppError("Failed to upload business document", 500);
      }
    }
  );

  // Upload business document from base64
  public uploadBusinessDocumentBase64 = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }

      const { base64Document, documentType } = req.body;
      if (!base64Document || !documentType) {
        throw new AppError(
          "Base64 document and document type are required",
          400
        );
      }

      try {
        // Upload to Cloudinary
        const result = await cloudinaryService.uploadBusinessDocumentBase64(
          base64Document,
          userId,
          documentType
        );

        // Update user provider profile
        const user = await User.findById(userId);
        if (!user) {
          throw new AppError("User not found", 404);
        }

        if (!user.providerProfile) {
          user.providerProfile = {};
        }

        if (!user.providerProfile.idVerification) {
          user.providerProfile.idVerification = {
            documentType: documentType as any,
            documentNumber: "",
            documentImage: result.secure_url,
            isVerified: false,
          };
        } else {
          user.providerProfile.idVerification.documentImage = result.secure_url;
          user.providerProfile.idVerification.documentType =
            documentType as any;
        }

        await user.save();

        res.json({
          success: true,
          message: "Business document uploaded successfully",
          data: {
            documentImage: result.secure_url,
            publicId: result.public_id,
            documentType,
          },
        });
      } catch (error) {
        throw new AppError("Failed to upload business document", 500);
      }
    }
  );

  // Delete business document
  public deleteBusinessDocument = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }

      const { publicId } = req.body;
      if (!publicId) {
        throw new AppError("No public ID provided", 400);
      }

      try {
        // Delete from Cloudinary
        await cloudinaryService.deleteImage(publicId);

        // Update user provider profile
        const user = await User.findById(userId);
        if (
          user &&
          user.providerProfile &&
          user.providerProfile.idVerification
        ) {
          user.providerProfile.idVerification.documentImage = "";
          await user.save();
        }

        res.json({
          success: true,
          message: "Business document deleted successfully",
        });
      } catch (error) {
        throw new AppError("Failed to delete business document", 500);
      }
    }
  );

  // Get user profile
  public getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  });

  // Update user profile
  public updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const { firstName, lastName, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  });
}

export const userController = new UserController();
