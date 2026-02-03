/**
 * Login Page
 * User authentication with email/password and Google OAuth
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [successMessage, setSuccessMessage] = useState('');

  // Check for session expired message or success messages
  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      setError('Your session has expired. Please sign in again.');
    }
    if (searchParams.get('error') === 'google_auth_failed') {
      setError('Google sign-in failed. Please try again or use email.');
    }
    if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
    }
  }, [searchParams]);

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
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Clear anonymous usage after successful login
        localStorage.removeItem('scripturechat_anonymous_usage');
        localStorage.removeItem('scripturechat_pending_messages');
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
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
              Welcome Back
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Sign in to continue your scripture journey
            </p>

            {/* Success message */}
            {successMessage && (
              <div 
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6"
                role="alert"
              >
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div 
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-scripture-navy hover:text-scripture-gold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
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
              Sign in with Google
            </button>

            {/* Sign up link */}
            <p className="text-center mt-8 text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-scripture-navy font-medium hover:underline">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
