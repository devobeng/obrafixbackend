export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Helper function to create operational errors
export const createOperationalError = (
  message: string,
  statusCode: number = 500
): AppError => {
  return new AppError(message, statusCode);
};

// Helper function to create validation errors
export const createValidationError = (message: string): AppError => {
  return new AppError(message, 400);
};

// Helper function to create authentication errors
export const createAuthError = (message: string): AppError => {
  return new AppError(message, 401);
};

// Helper function to create authorization errors
export const createForbiddenError = (message: string): AppError => {
  return new AppError(message, 403);
};

// Helper function to create not found errors
export const createNotFoundError = (message: string): AppError => {
  return new AppError(message, 404);
};

// Helper function to create conflict errors
export const createConflictError = (message: string): AppError => {
  return new AppError(message, 409);
};

// Helper function to create rate limit errors
export const createRateLimitError = (message: string): AppError => {
  return new AppError(message, 429);
};
