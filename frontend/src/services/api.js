/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';

// API base URL - uses proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging and token refresh
apiClient.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.status} ${response.config.url}`);
    }
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle 401 - Unauthorized
      if (status === 401) {
        // Clear token and redirect to login if not already there
        localStorage.removeItem('scripturechat_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session=expired';
        }
      }
      
      // Log error in development
      if (import.meta.env.DEV) {
        console.error(`❌ ${status} ${error.config?.url}:`, data?.message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - please check your connection');
    }
    
    return Promise.reject(error);
  }
);

/**
 * API methods
 */
const api = {
  // ===========================================
  // Auth Endpoints
  // ===========================================
  
  /**
   * Set authorization token
   */
  setAuthToken(token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Clear authorization token
   */
  clearAuthToken() {
    delete apiClient.defaults.headers.common['Authorization'];
  },

  /**
   * Register new user
   */
  register(data) {
    return apiClient.post('/auth/register', data);
  },

  /**
   * Login user
   */
  login(data) {
    return apiClient.post('/auth/login', data);
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  /**
   * Update user profile
   */
  updateProfile(data) {
    return apiClient.put('/auth/profile', data);
  },

  /**
   * Change password
   */
  changePassword(currentPassword, newPassword) {
    return apiClient.put('/auth/password', { currentPassword, newPassword });
  },

  /**
   * Get Google OAuth URL
   */
  getGoogleAuthUrl() {
    return `${API_BASE_URL}/auth/google`;
  },

  // ===========================================
  // Chat Endpoints
  // ===========================================

  /**
   * Get chat history (for sidebar)
   */
  getChatHistory() {
    return apiClient.get('/chat/history');
  },

  /**
   * Get specific chat with messages
   */
  getChat(chatId) {
    return apiClient.get(`/chat/${chatId}`);
  },

  /**
   * Create new chat
   */
  createChat() {
    return apiClient.post('/chat/new');
  },

  /**
   * Send message to existing chat
   */
  sendMessage(chatId, message) {
    return apiClient.post(`/chat/${chatId}/message`, { message });
  },

  /**
   * Quick message (creates new chat)
   */
  quickMessage(message) {
    return apiClient.post('/chat/quick', { message });
  },

  /**
   * Anonymous message (no auth required) - returns a streaming reader
   */
  async anonymousMessageStream(message, conversationHistory = [], onChunk) {
    const response = await fetch(`${API_BASE_URL}/chat/anonymous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message, 
        history: conversationHistory.slice(-10)
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            if (data.content) {
              fullResponse += data.content;
              onChunk(data.content, fullResponse);
            }
            
            if (data.done) {
              return { fullResponse: data.fullResponse || fullResponse, timestamp: data.timestamp };
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }

    return { fullResponse, timestamp: new Date().toISOString() };
  },

  /**
   * Anonymous message (no auth required) - non-streaming fallback
   */
  anonymousMessage(message, conversationHistory = []) {
    return apiClient.post('/chat/anonymous', { 
      message, 
      history: conversationHistory.slice(-10)
    });
  },

  /**
   * Add feedback to message
   */
  addFeedback(chatId, messageId, feedback) {
    return apiClient.post(`/chat/${chatId}/feedback/${messageId}`, { feedback });
  },

  /**
   * Update chat title
   */
  updateChatTitle(chatId, title) {
    return apiClient.put(`/chat/${chatId}/title`, { title });
  },

  /**
   * Delete chat
   */
  deleteChat(chatId) {
    return apiClient.delete(`/chat/${chatId}`);
  },

  /**
   * Get verse of the day
   */
  getVerseOfDay() {
    return apiClient.get('/chat/verse-of-day');
  },

  // ===========================================
  // Stripe/Payment Endpoints
  // ===========================================

  /**
   * Get available plans
   */
  getPlans() {
    return apiClient.get('/stripe/plans');
  },

  /**
   * Create checkout session
   */
  createCheckoutSession() {
    return apiClient.post('/stripe/create-checkout-session');
  },

  /**
   * Create customer portal session
   */
  createPortalSession() {
    return apiClient.post('/stripe/create-portal-session');
  },

  /**
   * Get subscription status
   */
  getSubscriptionStatus() {
    return apiClient.get('/stripe/subscription-status');
  },

  /**
   * Verify checkout session and activate subscription
   */
  verifyCheckoutSession(sessionId) {
    return apiClient.post('/stripe/verify-session', { sessionId });
  },

  /**
   * Sync subscription status from Stripe
   */
  syncSubscription() {
    return apiClient.post('/stripe/sync-subscription');
  },

  /**
   * Cancel subscription
   */
  cancelSubscription() {
    return apiClient.post('/stripe/cancel-subscription');
  },

  /**
   * Reactivate subscription
   */
  reactivateSubscription() {
    return apiClient.post('/stripe/reactivate-subscription');
  },

  // ===========================================
  // Utility Endpoints
  // ===========================================

  /**
   * Health check
   */
  healthCheck() {
    return apiClient.get('/health');
  }
};

export default api;
