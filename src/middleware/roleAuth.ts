import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError("Authentication required", 401);
      }

      if (!user.role) {
        throw new AppError("User role not found", 403);
      }

      if (user.role !== requiredRole) {
        throw new AppError(`Access denied. ${requiredRole} role required`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAnyRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError("Authentication required", 401);
      }

      if (!user.role) {
        throw new AppError("User role not found", 403);
      }

      if (!allowedRoles.includes(user.role)) {
        throw new AppError(
          `Access denied. One of these roles required: ${allowedRoles.join(
            ", "
          )}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdminOrProvider = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      throw new AppError("Authentication required", 401);
    }

    if (!user.role) {
      throw new AppError("User role not found", 403);
    }

    if (!["admin", "provider"].includes(user.role)) {
      throw new AppError("Access denied. Admin or provider role required", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdminOrOwner = (ownerField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError("Authentication required", 401);
      }

      if (!user.role) {
        throw new AppError("User role not found", 403);
      }

      // Admin can access everything
      if (user.role === "admin") {
        return next();
      }

      // Check if user is the owner of the resource
      const resourceOwnerId = req.params[ownerField] || req.body[ownerField];

      if (!resourceOwnerId) {
        throw new AppError("Resource owner ID not found", 400);
      }

      if (user.id !== resourceOwnerId) {
        throw new AppError(
          "Access denied. You can only access your own resources",
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
