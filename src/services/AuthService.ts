import { User } from "../models/User";
import { IUser } from "../types";
import { AppError } from "../utils/AppError";

export class AuthService {
  // Create a new user
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate key")) {
        throw new AppError("User with this email already exists", 409);
      }
      throw error;
    }
  }

  // Authenticate user with email and password
  async authenticateUser(
    email: string,
    password: string
  ): Promise<IUser | null> {
    try {
      const user = await User.findByEmail(email);

      if (!user) {
        return null;
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      throw new AppError("Authentication failed", 500);
    }
  }

  // Verify user account
  async verifyUser(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isVerified: true },
        { new: true }
      );
      return user;
    } catch (error) {
      throw new AppError("Failed to verify user", 500);
    }
  }

  // Change user password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        throw new AppError("Current password is incorrect", 400);
      }

      user.password = newPassword;
      await user.save();

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to change password", 500);
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      const user = await User.findByEmail(email);

      if (!user) {
        // Don't reveal if user exists or not for security
        return true;
      }

      // In production, generate reset token and send email
      // For now, just return success
      return true;
    } catch (error) {
      throw new AppError("Failed to process password reset request", 500);
    }
  }

  // Reset password with token
  async resetPassword(_token: string, _newPassword: string): Promise<boolean> {
    try {
      // In production, verify reset token and update password
      // For now, just return success
      return true;
    } catch (error) {
      throw new AppError("Failed to reset password", 500);
    }
  }
}
