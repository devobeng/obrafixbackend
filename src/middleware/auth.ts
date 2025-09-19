import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Authentication middleware
export const authenticate = (
  options: { requireRole?: string | string[]; optional?: boolean } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        if (options.optional) {
          return next();
        }
        throw new AppError("Access token is required", 401);
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      if (!token) {
        if (options.optional) {
          return next();
        }
        throw new AppError("Access token is required", 401);
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env["JWT_SECRET"] || "fallback-secret-key"
      ) as any;

      if (!decoded || !decoded.userId) {
        throw new AppError("Invalid token", 401);
      }

      // Get user from database
      const user = await User.findById(decoded.userId).select(
        "_id email role isVerified"
      );

      if (!user) {
        throw new AppError("User not found", 401);
      }

      if (!user.isVerified) {
        throw new AppError("Account not verified", 403);
      }

      // Attach user to request
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      // Check role requirement if specified
      if (options.requireRole) {
        const requiredRoles = Array.isArray(options.requireRole)
          ? options.requireRole
          : [options.requireRole];

        if (!requiredRoles.includes(user.role)) {
          throw new AppError("Insufficient permissions", 403);
        }
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError("Invalid token", 401));
      } else if (error instanceof jwt.TokenExpiredError) {
        next(new AppError("Token expired", 401));
      } else {
        next(new AppError("Authentication failed", 500));
      }
    }
  };
};

// Role-based access control middleware
export const requireRole = (roles: string | string[]) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roleArray.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = () => requireRole("admin");

// Provider-only middleware
export const requireProvider = () => requireRole(["provider", "admin"]);

// Simple token authentication middleware
export const authenticateToken = () => authenticate({});

// Optional authentication middleware
export const optionalAuth = () => authenticate({ optional: true });

// Refresh token authentication middleware
export const authenticateRefresh = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError("Refresh token is required", 400);
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env["JWT_REFRESH_SECRET"] || "fallback-refresh-secret-key"
      ) as any;

      if (!decoded || !decoded.userId) {
        throw new AppError("Invalid refresh token", 401);
      }

      // Get user from database
      const user = await User.findById(decoded.userId).select(
        "_id email role isVerified"
      );

      if (!user) {
        throw new AppError("User not found", 401);
      }

      if (!user.isVerified) {
        throw new AppError("Account not verified", 403);
      }

      // Attach user to request
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError("Invalid refresh token", 401));
      } else if (error instanceof jwt.TokenExpiredError) {
        next(new AppError("Refresh token expired", 401));
      } else {
        next(new AppError("Refresh authentication failed", 500));
      }
    }
  };
};
