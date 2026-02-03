/**
 * Authentication Routes
 * Handles user registration, login, and Google OAuth
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimiter');

// ===========================================
// Validation Rules
// ===========================================
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// ===========================================
// Routes
// ===========================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, registerValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array()[0].msg, 400);
  }

  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ApiError('An account with this email already exists.', 400);
  }

  // Create new user
  const user = new User({
    email,
    password,
    name: name || email.split('@')[0], // Default name from email
    authProvider: 'local'
  });

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Welcome to ScriptureChat.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription.status
      },
      token
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, loginValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array()[0].msg, 400);
  }

  const { email, password } = req.body;

  // Find user by email (include password field)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new ApiError('Invalid email or password.', 401);
  }

  // Check if user uses Google OAuth (no password)
  if (user.authProvider === 'google' && !user.password) {
    throw new ApiError('This account uses Google sign-in. Please use "Sign in with Google".', 400);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError('Invalid email or password.', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError('Your account has been deactivated. Please contact support.', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Welcome back to ScriptureChat!',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: user.subscription.status
      },
      token
    }
  });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me', protect, asyncHandler(async (req, res) => {
  const { canAsk, remaining, resetTime } = req.user.canAskQuestion();

  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        subscription: req.user.subscription.status,
        subscriptionEnd: req.user.subscription.currentPeriodEnd,
        usage: {
          questionsToday: req.user.usage.questionsToday,
          totalQuestions: req.user.usage.totalQuestions,
          canAsk,
          remaining,
          resetTime
        },
        createdAt: req.user.createdAt
      }
    }
  });
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array()[0].msg, 400);
  }

  const { name } = req.body;

  if (name) {
    req.user.name = name;
    await req.user.save();
  }

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name
      }
    }
  });
}));

/**
 * @route   PUT /api/auth/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(errors.array()[0].msg, 400);
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check if user uses Google OAuth
  if (user.authProvider === 'google' && !user.password) {
    throw new ApiError('Google accounts cannot change password here.', 400);
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError('Current password is incorrect.', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully.'
  });
}));

// ===========================================
// Google OAuth Routes
// ===========================================

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user._id);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', protect, asyncHandler(async (req, res) => {
  // Soft delete - deactivate account
  req.user.isActive = false;
  await req.user.save();

  // Could also delete chats here
  const Chat = require('../models/Chat');
  await Chat.deleteAllUserChats(req.user._id);

  res.json({
    success: true,
    message: 'Your account has been deactivated. We\'re sorry to see you go.'
  });
}));

module.exports = router;
