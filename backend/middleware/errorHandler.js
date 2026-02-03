/**
 * Error Handler Middleware
 * Centralized error handling for the API
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle specific error types
  let error = { ...err };
  error.message = err.message;

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(`This ${field} is already in use. Please use a different ${field}.`, 400);
  }

  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    error = new ApiError(messages.join('. '), 400);
  }

  // MongoDB Cast Error (Invalid ID)
  if (err.name === 'CastError') {
    error = new ApiError('Invalid ID format', 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError('Invalid authentication token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError('Your session has expired. Please log in again.', 401);
  }

  // OpenAI API Errors
  if (err.message && err.message.includes('OpenAI')) {
    error = new ApiError('We encountered an issue getting your response. Please try again.', 503);
  }

  // Stripe Errors
  if (err.type && err.type.includes('Stripe')) {
    error = new ApiError('Payment processing error. Please try again or contact support.', 402);
  }

  // Rate Limit Error
  if (err.statusCode === 429) {
    error = new ApiError('Too many requests. Please wait a moment and try again.', 429);
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Something went wrong. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not found handler for 404 errors
 */
const notFound = (req, res, next) => {
  const error = new ApiError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  ApiError,
  errorHandler,
  asyncHandler,
  notFound
};
