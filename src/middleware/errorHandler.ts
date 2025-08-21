import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

// Async handler wrapper to catch errors in async functions
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handling middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorDetails: any = {};

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle Zod validation errors
  else if (error.name === "ZodError") {
    statusCode = 400;
    message = "Validation Error";
    errorDetails = {
      type: "VALIDATION_ERROR",
      details: (error as any).errors,
    };
  }
  // Handle Mongoose validation errors
  else if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errorDetails = {
      type: "MONGOOSE_VALIDATION_ERROR",
      details: (error as any).message,
    };
  }
  // Handle Mongoose cast errors (invalid ObjectId)
  else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    errorDetails = {
      type: "CAST_ERROR",
      details: "The provided ID is not valid",
    };
  }
  // Handle JWT errors
  else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
    errorDetails = {
      type: "JWT_ERROR",
      details: "The provided token is invalid",
    };
  }
  // Handle JWT expiration errors
  else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
    errorDetails = {
      type: "JWT_EXPIRED",
      details: "The provided token has expired",
    };
  }
  // Handle duplicate key errors
  else if ((error as any).code === 11000) {
    statusCode = 409;
    message = "Duplicate field value";
    errorDetails = {
      type: "DUPLICATE_KEY_ERROR",
      details: "A record with this value already exists",
    };
  }
  // Handle other known errors
  else if (error.message) {
    message = error.message;
  }

  // Log error in development
  if (process.env["NODE_ENV"] === "development") {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      type: errorDetails.type || "INTERNAL_ERROR",
      details: errorDetails.details || "An unexpected error occurred",
      ...(process.env["NODE_ENV"] === "development" && {
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      }),
    },
  });
};

// 404 handler for undefined routes
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
