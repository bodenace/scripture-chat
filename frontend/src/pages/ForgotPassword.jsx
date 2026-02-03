/**
 * Forgot Password Page
 * Request password reset email
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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

          {/* Success Card */}
          <div className="card text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-display text-scripture-navy mb-4">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The link will expire in 1 hour. Don't forget to check your spam folder.
            </p>
            <Link to="/login" className="btn-primary w-full block text-center">
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
            Forgot Password
          </h2>
          <p className="text-gray-600 mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
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
          "The Lord is close to the brokenhearted and saves those who are crushed in spirit."
          <br />
          <span className="text-sm">— Psalm 34:18</span>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
