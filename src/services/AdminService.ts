import { User } from "../models/User";
import { IUser } from "../types";
import { AppError } from "../utils/AppError";

export class AdminService {
  // Get all users with pagination and filters
  async getAllUsers(filters: {
    page: number;
    limit: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    try {
      const { page, limit, role, status, search } = filters;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};
      if (role) query.role = role;
      if (status) query.accountStatus = status;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch users", 500);
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const [
        totalUsers,
        totalProviders,
        totalAdmins,
        verifiedProviders,
        pendingVerifications,
        suspendedUsers,
      ] = await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "provider" }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({
          role: "provider",
          "providerProfile.idVerification.isVerified": true,
        }),
        User.countDocuments({
          role: "provider",
          "providerProfile.idVerification.isVerified": false,
        }),
        User.countDocuments({
          accountStatus: { $in: ["suspended", "blocked"] },
        }),
      ]);

      return {
        totalUsers,
        totalProviders,
        totalAdmins,
        verifiedProviders,
        pendingVerifications,
        suspendedUsers,
        verificationRate:
          totalProviders > 0 ? (verifiedProviders / totalProviders) * 100 : 0,
      };
    } catch (error) {
      throw new AppError("Failed to fetch user statistics", 500);
    }
  }

  // Suspend user account
  async suspendUser(
    userId: string,
    adminId: string,
    reason: string,
    duration?: number // in days
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role === "admin") {
        throw new AppError("Cannot suspend admin accounts", 403);
      }

      user.accountStatus = "suspended";
      user.suspendedReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = adminId;

      // If duration is provided, schedule reactivation
      if (duration) {
        const reactivationDate = new Date();
        reactivationDate.setDate(reactivationDate.getDate() + duration);
        // You could implement a job scheduler here to reactivate the account
      }

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to suspend user", 500);
    }
  }

  // Block user account permanently
  async blockUser(
    userId: string,
    adminId: string,
    reason: string
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role === "admin") {
        throw new AppError("Cannot block admin accounts", 403);
      }

      user.accountStatus = "blocked";
      user.suspendedReason = reason;
      user.suspendedAt = new Date();
      user.suspendedBy = adminId;

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to block user", 500);
    }
  }

  // Reactivate user account
  async reactivateUser(userId: string, _adminId: string): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      user.accountStatus = "active";
      user.suspendedReason = undefined;
      user.suspendedAt = undefined;
      user.suspendedBy = undefined;

      await user.save();
      return user;
    } catch (error) {
      throw new AppError("Failed to reactivate user", 500);
    }
  }

  // Get pending provider verifications
  async getPendingProviderVerifications() {
    try {
      return await User.find({
        role: "provider",
        "providerProfile.idVerification.isVerified": false,
        accountStatus: "active",
      })
        .select("firstName lastName email providerProfile createdAt")
        .sort({ createdAt: 1 });
    } catch (error) {
      throw new AppError("Failed to fetch pending verifications", 500);
    }
  }

  // Approve provider verification
  async approveProviderVerification(
    userId: string,
    _adminId: string
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role !== "provider") {
        throw new AppError("User is not a provider", 400);
      }

      if (!user.providerProfile?.idVerification) {
        throw new AppError("No ID verification found", 400);
      }

      user.providerProfile.idVerification.isVerified = true;
      user.providerProfile.idVerification.verifiedAt = new Date();
      user.isVerified = true;

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to approve verification", 500);
    }
  }

  // Reject provider verification
  async rejectProviderVerification(
    userId: string,
    _adminId: string,
    _reason: string
  ): Promise<IUser> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.role !== "provider") {
        throw new AppError("User is not a provider", 400);
      }

      // Reset verification status
      user.providerProfile = {
        ...user.providerProfile,
        idVerification: {
          ...user.providerProfile?.idVerification,
          isVerified: false,
          verifiedAt: undefined,
        },
      };

      // You could implement notification system here to inform the provider
      await user.save();
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to reject verification", 500);
    }
  }
}
