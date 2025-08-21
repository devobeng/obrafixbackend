import { User } from "../models/User";
import { IUser } from "../types";
import { AppError } from "../utils/AppError";

interface UserFilters {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class UserService {
  // Get users with pagination and filters
  async getUsers(filters: UserFilters): Promise<PaginatedResult<IUser>> {
    try {
      const { page, limit, role, search } = filters;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};
      if (role) query.role = role;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Execute query with pagination
      const [users, total] = await Promise.all([
        User.find(query)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch users", 500);
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId).select("-password");
    } catch (error) {
      throw new AppError("Failed to fetch user", 500);
    }
  }

  // Update user
  async updateUser(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");
    } catch (error) {
      throw new AppError("Failed to update user", 500);
    }
  }

  // Delete user
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(userId);
      return !!result;
    } catch (error) {
      throw new AppError("Failed to delete user", 500);
    }
  }

  // Update user role
  async updateUserRole(userId: string, role: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
      ).select("-password");
    } catch (error) {
      throw new AppError("Failed to update user role", 500);
    }
  }

  // Verify user
  async verifyUser(userId: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { isVerified: true },
        { new: true }
      ).select("-password");
    } catch (error) {
      throw new AppError("Failed to verify user", 500);
    }
  }

  // Search users
  async searchUsers(
    query: string,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<IUser>> {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;

      const searchQuery = {
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      };

      const [users, total] = await Promise.all([
        User.find(searchQuery)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(searchQuery),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to search users", 500);
    }
  }

  // Get user statistics
  async getUserStats(): Promise<any> {
    try {
      const [totalUsers, verifiedUsers, userCounts] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isVerified: true }),
        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const roleStats = userCounts.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      return {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        roleStats,
      };
    } catch (error) {
      throw new AppError("Failed to fetch user statistics", 500);
    }
  }

  // Get all users with advanced filtering and sorting (for admin)
  async getAllUsers(
    page: number,
    limit: number,
    filters: any = {},
    sort: any = { createdAt: -1 }
  ): Promise<PaginatedResult<IUser>> {
    try {
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [users, total] = await Promise.all([
        User.find(filters)
          .select("-password")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        User.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch users", 500);
    }
  }

  // Update user status (for admin)
  async updateUserStatus(
    userId: string,
    status: string,
    reason?: string
  ): Promise<IUser | null> {
    try {
      const updateData: any = { status };

      if (reason) {
        updateData.statusReason = reason;
        updateData.statusUpdatedAt = new Date();
      }

      return await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");
    } catch (error) {
      throw new AppError("Failed to update user status", 500);
    }
  }

  // Verify provider documents (for admin)
  async verifyProviderDocuments(
    providerId: string,
    verificationStatus: string,
    rejectionReason?: string,
    adminNotes?: string
  ): Promise<IUser | null> {
    try {
      const updateData: any = {
        verificationStatus,
        verificationDate: new Date(),
      };

      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      if (adminNotes) {
        updateData.adminNotes = adminNotes;
      }

      // If approved, set isVerified to true
      if (verificationStatus === "approved") {
        updateData.isVerified = true;
      }

      return await User.findByIdAndUpdate(providerId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");
    } catch (error) {
      throw new AppError("Failed to verify provider documents", 500);
    }
  }
}
