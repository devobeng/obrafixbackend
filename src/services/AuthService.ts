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

  // Authenticate user with email/phone and password
  async authenticateUser(
    emailOrPhone: string,
    password: string
  ): Promise<IUser | null> {
    try {
      console.log("AuthService: Looking for user with:", emailOrPhone);
      const user = await User.findByEmailOrPhone(emailOrPhone);
      console.log(
        "AuthService: User found:",
        user ? `${user.email} (${user.phone})` : "None"
      );

      if (!user) {
        console.log("AuthService: No user found");
        return null;
      }

      const isPasswordValid = await user.comparePassword(password);
      console.log("AuthService: Password valid:", isPasswordValid);

      if (!isPasswordValid) {
        console.log("AuthService: Invalid password");
        return null;
      }

      return user;
    } catch (error) {
      console.error("AuthService: Authentication error:", error);
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
