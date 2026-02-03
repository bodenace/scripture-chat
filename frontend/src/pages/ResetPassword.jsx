/**
 * Reset Password Page
 * Reset password using token from email
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.verifyResetToken(token);
        setTokenValid(true);
        setMaskedEmail(response.data.email);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired reset link.');
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

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
      const response = await api.resetPassword(token, password);
      
      // Log user in with the returned token
      if (response.data?.token) {
        login(response.data.token, response.data.user);
        navigate('/', { replace: true });
      } else {
        navigate('/login?reset=success', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen bg-scripture-cream flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-scripture-gold border-t-scripture-navy rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-scripture-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-3">
              <div className="w-14 h-14 bg-scripture-navy rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-white text-3xl">✝</span>
              </div>
              <h1 className="text-3xl font-display text-scripture-navy">
                ScriptureChat
              </h1>
            </Link>
          </div>

          {/* Error Card */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-display text-scripture-navy mb-4">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <Link to="/forgot-password" className="btn-primary w-full block text-center mb-3">
              Request New Reset Link
            </Link>
            <Link to="/login" className="btn-secondary w-full block text-center">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-scripture-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3">
            <div className="w-14 h-14 bg-scripture-navy rounded-xl flex items-center justify-center shadow-soft">
              <span className="text-white text-3xl">✝</span>
            </div>
            <h1 className="text-3xl font-display text-scripture-navy">
              ScriptureChat
            </h1>
          </Link>
        </div>

        {/* Form Card */}
        <div className="card">
          <h2 className="text-2xl font-display text-scripture-navy mb-2">
            Reset Your Password
          </h2>
          {maskedEmail && (
            <p className="text-gray-600 mb-6">
              Create a new password for <strong>{maskedEmail}</strong>
            </p>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="label">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="At least 6 characters"
                minLength={6}
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Repeat your password"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="btn-primary w-full"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-scripture-navy hover:text-scripture-gold transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>

        {/* Scripture Quote */}
        <p className="text-center text-gray-500 mt-6 italic">
          "Forget the former things; do not dwell on the past. See, I am doing a new thing!"
          <br />
          <span className="text-sm">— Isaiah 43:18-19</span>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
