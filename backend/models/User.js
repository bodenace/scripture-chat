/**
 * User Model
 * Handles user data, authentication, and subscription status
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  // Password reset fields
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Authentication method
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    sparse: true // Allow null but enforce uniqueness when present
  },
  
  // Subscription and billing
  subscription: {
    status: {
      type: String,
      enum: ['free', 'premium', 'cancelled'],
      default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date
  },
  
  // Usage tracking for free tier limits
  usage: {
    questionsToday: {
      type: Number,
      default: 0
    },
    lastQuestionDate: {
      type: Date,
      default: null
    },
    totalQuestions: {
      type: Number,
      default: 0
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===========================================
// Indexes for better query performance
// ===========================================
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'subscription.stripeCustomerId': 1 });

// ===========================================
// Pre-save middleware to hash password
// ===========================================
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified (or new)
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ===========================================
// Instance Methods
// ===========================================

/**
 * Compare entered password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if user can ask a question (rate limiting for free tier)
 * @returns {object} - { canAsk: boolean, remaining: number, resetTime: Date }
 */
userSchema.methods.canAskQuestion = function() {
  const FREE_TIER_LIMIT = parseInt(process.env.FREE_TIER_DAILY_LIMIT) || 5;
  
  // Premium users have unlimited questions
  if (this.subscription.status === 'premium') {
    return { canAsk: true, remaining: Infinity, resetTime: null };
  }
  
  const now = new Date();
  const lastQuestion = this.usage.lastQuestionDate;
  
  // Reset counter if it's a new day
  if (!lastQuestion || !isSameDay(lastQuestion, now)) {
    return { 
      canAsk: true, 
      remaining: FREE_TIER_LIMIT, 
      resetTime: getNextMidnight() 
    };
  }
  
  // Check if under limit
  const remaining = Math.max(0, FREE_TIER_LIMIT - this.usage.questionsToday);
  return { 
    canAsk: remaining > 0, 
    remaining, 
    resetTime: getNextMidnight() 
  };
};

/**
 * Increment question count for rate limiting
 */
userSchema.methods.incrementQuestionCount = async function() {
  const now = new Date();
  const lastQuestion = this.usage.lastQuestionDate;
  
  // Reset if new day
  if (!lastQuestion || !isSameDay(lastQuestion, now)) {
    this.usage.questionsToday = 1;
  } else {
    this.usage.questionsToday += 1;
  }
  
  this.usage.lastQuestionDate = now;
  this.usage.totalQuestions += 1;
  
  await this.save();
};

/**
 * Update subscription status
 * @param {string} status - New subscription status
 * @param {object} stripeData - Stripe subscription data
 */
userSchema.methods.updateSubscription = async function(status, stripeData = {}) {
  this.subscription.status = status;
  
  if (stripeData.customerId) {
    this.subscription.stripeCustomerId = stripeData.customerId;
  }
  if (stripeData.subscriptionId) {
    this.subscription.stripeSubscriptionId = stripeData.subscriptionId;
  }
  if (stripeData.currentPeriodEnd) {
    this.subscription.currentPeriodEnd = new Date(stripeData.currentPeriodEnd * 1000);
  }
  
  await this.save();
};

// ===========================================
// Helper Functions
// ===========================================

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getNextMidnight() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

// ===========================================
// Static Methods
// ===========================================

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {User} - User document
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Generate password reset token
 * @returns {string} - Unhashed reset token
 */
userSchema.methods.createPasswordResetToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expires in 1 hour
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  
  // Return unhashed token (to send via email)
  return resetToken;
};

/**
 * Find user by reset token
 * @param {string} token - Unhashed reset token
 * @returns {User} - User document if token valid
 */
userSchema.statics.findByResetToken = function(token) {
  // Hash the token to compare with database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
