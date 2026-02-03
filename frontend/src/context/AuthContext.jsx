/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load user from token on app start
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('scripturechat_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Set token in API headers
        api.setAuthToken(token);
        
        // Fetch current user
        const response = await api.getCurrentUser();
        setUser(response.data.user);
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Clear invalid token
        localStorage.removeItem('scripturechat_token');
        api.clearAuthToken();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Register a new user
   */
  const register = useCallback(async (email, password, name) => {
    setError(null);
    
    try {
      const response = await api.register({ email, password, name });
      const { token, user: userData } = response.data;
      
      // Store token and update state
      localStorage.setItem('scripturechat_token', token);
      api.setAuthToken(token);
      setUser(userData);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    
    try {
      const response = await api.login({ email, password });
      const { token, user: userData } = response.data;
      
      // Store token and update state
      localStorage.setItem('scripturechat_token', token);
      api.setAuthToken(token);
      setUser(userData);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Login with token (for OAuth callback)
   */
  const loginWithToken = useCallback(async (token) => {
    setError(null);
    
    try {
      // Store token
      localStorage.setItem('scripturechat_token', token);
      api.setAuthToken(token);
      
      // Fetch user data
      const response = await api.getCurrentUser();
      setUser(response.data.user);
      
      return { success: true };
    } catch (err) {
      localStorage.removeItem('scripturechat_token');
      api.clearAuthToken();
      const message = err.response?.data?.message || 'Authentication failed.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    localStorage.removeItem('scripturechat_token');
    api.clearAuthToken();
    setUser(null);
    setError(null);
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data) => {
    setError(null);
    
    try {
      const response = await api.updateProfile(data);
      setUser(prev => ({ ...prev, ...response.data.user }));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Refresh user data (e.g., after subscription change)
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      setUser(response.data.user);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    loginWithToken,
    logout,
    updateProfile,
    refreshUser,
    clearError,
    isAuthenticated: !!user,
    isPremium: user?.subscription === 'premium'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
