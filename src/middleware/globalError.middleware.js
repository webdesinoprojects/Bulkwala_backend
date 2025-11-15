import { ApiError } from "../utils/ApiError.js";

// Global Error Handling Middleware
export const globalErrorHandler = (err, _req, res, _next) => {
  // Determine status code (simplified logic)
  const statusCode = err.statusCode || err.status || 500;
  
  // Don't log 401 errors as they're expected when users aren't authenticated
  if (statusCode === 401) {
    return res.status(401).json({
      success: false,
      message: err.message || "Unauthorized",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Log other errors
  console.error("Global Error:", err);

  // If the error is an instance of ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // If it's a Zod validation error (from validateData)
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // For Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Database validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // For MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists.`,
    });
  }

  // Default / Unknown errors
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
