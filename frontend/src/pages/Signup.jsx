/**
 * Signup Page
 * Creates account and redirects to Stripe payment
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  // Clear auth errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Update error from auth context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // First, register the user
      const result = await register(email, password, name);
      
      if (result.success) {
        // Clear anonymous usage
        localStorage.removeItem('scripturechat_anonymous_usage');
        localStorage.removeItem('scripturechat_pending_messages');
        
        // Now redirect to Stripe checkout
        try {
          const checkoutResponse = await api.createCheckoutSession();
          if (checkoutResponse.data?.url) {
            window.location.href = checkoutResponse.data.url;
          } else {
            // If checkout fails, still go to dashboard
            navigate('/dashboard');
          }
        } catch (stripeErr) {
          console.error('Stripe checkout error:', stripeErr);
          // If Stripe fails, go to dashboard where they can try again
          navigate('/dashboard');
        }
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = api.getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen bg-scripture-cream flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-scripture-navy rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">✝</span>
            </div>
            <span className="text-xl font-display text-scripture-navy">ScriptureChat</span>
          </Link>
          <Link to="/" className="btn-text">
            Back to Chat
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="card">
            <h1 className="text-3xl font-display text-scripture-navy text-center mb-2">
              Get Unlimited Access
            </h1>
            <p className="text-center text-gray-600 mb-2">
              Continue exploring God's Word with ScriptureChat
            </p>
            
            {/* Pricing badge */}
            <div className="text-center mb-6">
              <span className="inline-block bg-scripture-gold/20 text-scripture-navy font-bold text-lg px-4 py-2 rounded-full">
                $4.99/month
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div 
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Signup form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="How should we address you?"
                  autoComplete="name"
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="At least 6 characters"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="Type your password again"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Continue to Payment'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-200 rounded-xl text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Sign in link */}
            <p className="text-center mt-6 text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-scripture-navy font-medium hover:underline">
                Sign in here
              </Link>
            </p>

            {/* What you get */}
            <div className="mt-6 p-4 bg-scripture-cream rounded-xl">
              <p className="font-medium text-scripture-navy mb-2">What you get:</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✓ Unlimited scripture questions</li>
                <li>✓ Save your conversation history</li>
                <li>✓ Priority responses</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>

            {/* Terms notice */}
            <p className="text-center mt-4 text-xs text-gray-500">
              Secure payment via Stripe. By subscribing, you agree to our terms.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signup;
