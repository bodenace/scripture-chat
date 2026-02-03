/**
 * Authentication Middleware
 * Protects routes and validates user access
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('./errorHandler');

/**
 * Protect routes - requires valid JWT token
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new ApiError('Please log in to access this resource.', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError('User no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new ApiError('Your account has been deactivated.', 401);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError('Invalid token. Please log in again.', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError('Your session has expired. Please log in again.', 401);
    }
    throw error;
  }
});

/**
 * Check if user has premium subscription
 */
const requirePremium = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError('Please log in to access this resource.', 401);
  }

  if (req.user.subscription.status !== 'premium') {
    throw new ApiError('This feature requires a premium subscription.', 403);
  }

  next();
});

/**
 * Check if user can ask a question
 * Paid users have unlimited questions
 */
const checkQuestionLimit = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError('Please log in to access this resource.', 401);
  }

  // All authenticated users with active subscription can ask unlimited questions
  if (req.user.subscription.status === 'premium') {
    req.questionsRemaining = Infinity;
    req.resetTime = null;
    return next();
  }

  // Users without premium subscription need to subscribe
  throw new ApiError(
    'Please subscribe to continue asking questions.',
    402 // Payment Required
  );
});

/**
 * Generate JWT token for a user
 * @param {ObjectId} userId - User's ID
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for routes that work for both authenticated and anonymous users
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid but we don't throw - just continue without user
      console.log('Optional auth: Invalid token provided');
    }
  }

  next();
});

module.exports = {
  protect,
  requirePremium,
  checkQuestionLimit,
  generateToken,
  optionalAuth
};
