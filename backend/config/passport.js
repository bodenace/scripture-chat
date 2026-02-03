/**
 * Passport Configuration
 * JWT and Google OAuth strategies
 */

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  // ===========================================
  // JWT Strategy
  // ===========================================
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
  };

  passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Find user by ID from JWT payload
      const user = await User.findById(payload.id);
      
      if (user && user.isActive) {
        return done(null, user);
      }
      
      return done(null, false);
    } catch (error) {
      console.error('JWT Strategy Error:', error);
      return done(error, false);
    }
  }));

  // ===========================================
  // Google OAuth Strategy
  // ===========================================
  // Only configure if Google credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const googleOptions = {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      scope: ['profile', 'email']
    };

    passport.use(new GoogleStrategy(
      googleOptions,
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });
          
          if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }
          
          // Check if user exists with the same email
          const email = profile.emails && profile.emails[0] 
            ? profile.emails[0].value 
            : null;
            
          if (email) {
            user = await User.findOne({ email });
            
            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.authProvider = 'google';
              user.lastLogin = new Date();
              await user.save();
              return done(null, user);
            }
          }
          
          // Create new user
          const newUser = new User({
            googleId: profile.id,
            email: email || `${profile.id}@google.placeholder`,
            name: profile.displayName || 'Google User',
            authProvider: 'google',
            lastLogin: new Date()
          });
          
          await newUser.save();
          return done(null, newUser);
          
        } catch (error) {
          console.error('Google Strategy Error:', error);
          return done(error, false);
        }
      }
    ));
  }

  // ===========================================
  // Serialization (for session-based auth, if needed)
  // ===========================================
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
