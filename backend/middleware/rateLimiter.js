/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting API requests
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Applies to all API routes
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again in 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Skip rate limiting for successful requests in development
  skip: (req) => process.env.NODE_ENV === 'development'
});

/**
 * Stricter rate limiter for authentication routes
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for chat/AI requests
 * More restrictive to control API costs
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: {
    success: false,
    message: 'You\'re sending messages too quickly. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for payment-related routes
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  rateLimiter,
  authLimiter,
  chatLimiter,
  paymentLimiter
};
