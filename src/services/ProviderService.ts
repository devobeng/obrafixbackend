import { User } from "../models/User";
import { IUser } from "../types";
import { AppError } from "../utils/AppError";

export class ProviderService {
  // Setup provider profile
  async setupProviderProfile(
    userId: string,
    profileData: {
      businessName: string;
      serviceCategory: string;
      yearsExperience: number;
    }
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role !== "provider") {
        throw new AppError("User is not a provider", 400);
      }

      user.providerProfile = {
        ...user.providerProfile,
        ...profileData,
      };

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to setup provider profile", 500);
    }
  }

  // Upload ID verification document
  async uploadIdVerification(
    userId: string,
    verificationData: {
      documentType: "ghanaCard" | "driverLicense" | "passport";
      documentNumber: string;
      documentImage: string;
    }
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role !== "provider") {
        throw new AppError("User is not a provider", 400);
      }

      user.providerProfile = {
        ...user.providerProfile,
        idVerification: {
          ...verificationData,
          isVerified: false,
        },
      };

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to upload ID verification", 500);
    }
  }

  // Setup bank account for payouts
  async setupBankAccount(
    userId: string,
    bankData: {
      accountNumber: string;
      accountName: string;
      bankName: string;
    }
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role !== "provider") {
        throw new AppError("User is not a provider", 400);
      }

      user.providerProfile = {
        ...user.providerProfile,
        bankDetails: {
          ...bankData,
          isVerified: false,
        },
      };

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to setup bank account", 500);
    }
  }

  // Setup mobile money for payouts
  async setupMobileMoney(
    userId: string,
    mobileMoneyData: {
      provider: "mtn" | "vodafone" | "airtelTigo";
      phoneNumber: string;
    }
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role !== "provider") {
        throw new AppError("User is not a provider", 400);
      }

      user.providerProfile = {
        ...user.providerProfile,
        mobileMoney: {
          ...mobileMoneyData,
          isVerified: false,
        },
      };

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to setup mobile money", 500);
    }
  }

  // Get pending verifications (admin only)
  async getPendingVerifications(): Promise<IUser[]> {
    try {
      return await User.find({
        role: "provider",
        "providerProfile.idVerification.isVerified": false,
        accountStatus: "active",
      }).select("firstName lastName email providerProfile createdAt");
    } catch (error) {
      throw new AppError("Failed to fetch pending verifications", 500);
    }
  }

  // Verify provider ID (admin only)
  async verifyProviderId(
    userId: string,
    _adminId: string,
    isApproved: boolean,
    _reason?: string
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role !== "provider") {
        throw new AppError("User is not a provider", 400);
      }

      if (isApproved) {
        user.providerProfile = {
          ...user.providerProfile,
          idVerification: {
            ...user.providerProfile?.idVerification,
            isVerified: true,
            verifiedAt: new Date(),
          },
        };
      } else {
        // Reject verification
        user.providerProfile = {
          ...user.providerProfile,
          idVerification: {
            ...user.providerProfile?.idVerification,
            isVerified: false,
          },
        };
      }

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to verify provider ID", 500);
    }
  }
}
