/**
 * Dashboard Page
 * Account management, subscription, and settings
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Dashboard() {
  const { user, refreshUser, updateProfile, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  // Check for success/cancel from Stripe and verify session
  useEffect(() => {
    const verifySession = async () => {
      const sessionId = searchParams.get('session_id');
      const success = searchParams.get('success');
      
      if (success === 'true' && sessionId) {
        try {
          // Verify the session and activate subscription
          const response = await api.verifyCheckoutSession(sessionId);
          if (response.success) {
            setMessage({ type: 'success', text: 'Thank you! Your subscription is now active.' });
            // Refresh subscription status
            const subResponse = await api.getSubscriptionStatus();
            setSubscription(subResponse.data.subscription);
            refreshUser();
          }
        } catch (err) {
          console.error('Failed to verify session:', err);
          setMessage({ type: 'success', text: 'Payment received! Your subscription should be active shortly.' });
          refreshUser();
        }
      } else if (searchParams.get('canceled') === 'true') {
        setMessage({ type: 'info', text: 'Subscription process was canceled.' });
      }
    };

    verifySession();
  }, [searchParams, refreshUser]);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await api.getSubscriptionStatus();
        setSubscription(response.data.subscription);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  /**
   * Handle upgrade to premium
   */
  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    
    try {
      const response = await api.createCheckoutSession();
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      setMessage({ type: 'error', text: 'Failed to start checkout. Please try again.' });
      setUpgradeLoading(false);
    }
  };

  /**
   * Open Stripe customer portal
   */
  const handleManageSubscription = async () => {
    setPortalLoading(true);
    
    try {
      const response = await api.createPortalSession();
      window.location.href = response.data.url;
    } catch (err) {
      console.error('Failed to open portal:', err);
      setMessage({ type: 'error', text: 'Failed to open subscription portal. Please try again.' });
      setPortalLoading(false);
    }
  };

  /**
   * Sync subscription status from Stripe
   */
  const handleSyncSubscription = async () => {
    setSyncLoading(true);
    setMessage(null);
    
    try {
      const response = await api.syncSubscription();
      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        // Refresh subscription status
        const subResponse = await api.getSubscriptionStatus();
        setSubscription(subResponse.data.subscription);
        refreshUser();
      } else {
        setMessage({ type: 'info', text: response.data.message });
      }
    } catch (err) {
      console.error('Failed to sync subscription:', err);
      setMessage({ type: 'error', text: 'Failed to sync subscription. Please try again.' });
    } finally {
      setSyncLoading(false);
    }
  };

  /**
   * Update user name
   */
  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    
    const result = await updateProfile({ name: newName.trim() });
    
    if (result.success) {
      setEditingName(false);
      setMessage({ type: 'success', text: 'Name updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-scripture-gold border-t-scripture-navy rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-scripture-cream">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-scripture-navy rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">✝</span>
            </div>
            <h1 className="text-xl font-display text-scripture-navy">
              ScriptureChat
            </h1>
          </Link>
          
          <nav className="flex items-center space-x-3">
            <Link to="/" className="btn-primary py-2 px-4">
              Back to Chat
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <h2 className="text-3xl font-display text-scripture-navy mb-8">
          My Account
        </h2>

        {/* Status message */}
        {message && (
          <div 
            className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
              message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}
            role="alert"
          >
            {message.text}
            <button 
              onClick={() => setMessage(null)}
              className="ml-3 font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Profile Section */}
        <section className="card mb-6">
          <h2 className="text-xl font-medium text-scripture-navy mb-4">
            Profile
          </h2>
          
          <div className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="label">Email</label>
              <p className="text-lg text-gray-900">{user?.email}</p>
            </div>

            {/* Name (editable) */}
            <div>
              <label className="label">Name</label>
              {editingName ? (
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input flex-1"
                    maxLength={100}
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateName}
                    className="btn-primary"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNewName(user?.name || '');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-gray-900">{user?.name || 'Not set'}</p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="btn-text"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Member since */}
            <div>
              <label className="label">Member Since</label>
              <p className="text-lg text-gray-900">{formatDate(user?.createdAt)}</p>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="card mb-6">
          <h2 className="text-xl font-medium text-scripture-navy mb-4">
            Subscription
          </h2>

          {/* Current plan */}
          <div className="p-4 bg-gray-50 rounded-xl mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {subscription?.isPremium ? (
                    <span className="flex items-center">
                      <span className="text-scripture-gold mr-2">★</span>
                      Active Subscription
                    </span>
                  ) : (
                    <span className="text-red-600">No Active Subscription</span>
                  )}
                </p>
                {subscription?.isPremium && subscription?.details && (
                  <p className="text-sm text-gray-600 mt-1">
                    {subscription.details.cancelAtPeriodEnd ? (
                      <>Cancels on {formatDate(subscription.details.currentPeriodEnd)}</>
                    ) : (
                      <>Renews on {formatDate(subscription.details.currentPeriodEnd)}</>
                    )}
                  </p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscription?.isPremium 
                  ? 'bg-scripture-gold/20 text-scripture-brown' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {subscription?.isPremium ? '$4.99/month' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Upgrade/Manage buttons */}
          {subscription?.isPremium ? (
            <button
              onClick={handleManageSubscription}
              className="btn-secondary w-full"
              disabled={portalLoading}
            >
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <h3 className="font-medium text-red-700 mb-2">
                  Subscription Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Subscribe to continue asking unlimited scripture questions.
                </p>
                <ul className="text-gray-600 space-y-1 mb-4">
                  <li>✓ Unlimited questions</li>
                  <li>✓ Save chat history</li>
                  <li>✓ Priority responses</li>
                  <li>✓ Cancel anytime</li>
                </ul>
                <p className="text-2xl font-bold text-scripture-navy mb-4">
                  $4.99 <span className="text-base font-normal text-gray-500">/month</span>
                </p>
                <button
                  onClick={handleUpgrade}
                  className="btn-primary w-full"
                  disabled={upgradeLoading}
                >
                  {upgradeLoading ? 'Starting checkout...' : 'Subscribe Now'}
                </button>
              </div>
              
              {/* Sync button for users who already paid */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700 mb-3">
                  Already paid but not showing as active? Click below to sync your subscription status.
                </p>
                <button
                  onClick={handleSyncSubscription}
                  className="btn-secondary w-full"
                  disabled={syncLoading}
                >
                  {syncLoading ? 'Syncing...' : 'Sync Subscription Status'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Statistics Section */}
        <section className="card mb-6">
          <h2 className="text-xl font-medium text-scripture-navy mb-4">
            Your Journey
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-scripture-navy">
                {user?.usage?.totalQuestions || 0}
              </p>
              <p className="text-gray-600">Questions Asked</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-scripture-navy">
                {Math.floor((Date.now() - new Date(user?.createdAt).getTime()) / (1000 * 60 * 60 * 24)) || 1}
              </p>
              <p className="text-gray-600">Days with Us</p>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="card border-red-200">
          <h2 className="text-xl font-medium text-red-600 mb-4">
            Account Actions
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={logout}
              className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-gray-700 
                       hover:bg-gray-50 transition-colors text-lg"
            >
              Sign Out
            </button>
            
            <p className="text-sm text-gray-500 text-center">
              Need help? Contact us at support@scripturechat.com
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
