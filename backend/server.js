/**
 * Faith AI Backend Server
 * Main entry point for the Express.js API
 */

require('dotenv').config();

// ===========================================
// Startup Validation — fail fast if env is misconfigured
// ===========================================
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'MONGODB_URI'];
const PROD_REQUIRED_ENV_VARS = ['STRIPE_WEBHOOK_SECRET'];

const missingEnv = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingEnv.length) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long for security');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  const missingProd = PROD_REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missingProd.length) {
    console.error(`❌ Missing required production environment variables: ${missingProd.join(', ')}`);
    process.exit(1);
  }
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const Sentry = require('@sentry/node');

// Initialize Sentry (must be before other requires that might throw)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    }
  });
  console.log('📊 Sentry error monitoring initialized');
}

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const stripeRoutes = require('./routes/stripe');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

// Initialize Express app
const app = express();

// ===========================================
// Security Middleware
// ===========================================
app.use(helmet());

// Trust the first proxy (needed for express-rate-limit to see real client IPs
// behind Vercel, Railway, Render, Heroku, Nginx, etc.)
app.set('trust proxy', 1);

// CORS configuration for frontend
// Add extra origins via comma-separated ADDITIONAL_CORS_ORIGINS env var
const extraOrigins = process.env.ADDITIONAL_CORS_ORIGINS
  ? process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://www.faith-ai.org',
  'https://faith-ai.org',
  'http://localhost:5173',
  'http://localhost:3000',
  ...extraOrigins
].filter(Boolean).map(o => o.replace(/\/$/, '').toLowerCase());

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);

    const normalised = origin.replace(/\/$/, '').toLowerCase();
    if (allowedOrigins.includes(normalised)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('CORS blocked origin:', origin);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// ===========================================
// Body Parsing Middleware
// ===========================================
// Stripe webhook needs raw body, so handle it before JSON parsing
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true }));

// ===========================================
// Passport Authentication
// ===========================================
app.use(passport.initialize());
require('./config/passport')(passport);

// ===========================================
// Rate Limiting
// ===========================================
app.use('/api/', rateLimiter);

// ===========================================
// API Routes
// ===========================================
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stripe', stripeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Faith AI API is running',
    timestamp: new Date().toISOString()
  });
});

// ===========================================
// Error Handling
// ===========================================
app.use(errorHandler);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// ===========================================
// Database Connection & Server Start
// ===========================================
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/faithai';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Faith AI server running on port ${PORT}`);
      console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

module.exports = app;
