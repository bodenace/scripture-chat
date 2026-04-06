/**
 * Auth Callback Page
 * Handles OAuth callback and token processing
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

function AuthCallback() {
  const [error, setError] = useState(null);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login?error=google_auth_failed'), 2000);
        return;
      }

      if (!code) {
        setError('No authentication code received.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        // Exchange the one-time code for a JWT (code is consumed server-side)
        const response = await api.exchangeOAuthCode(code);
        const { token } = response.data;

        const result = await loginWithToken(token);

        if (result.success) {
          localStorage.removeItem('faithai_anonymous_usage');
          localStorage.removeItem('faithai_pending_messages');
          navigate('/');
        } else {
          setError(result.error || 'Authentication failed.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (err) {
        setError('Failed to complete authentication. The sign-in link may have expired.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-scripture-cream flex flex-col items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-display text-scripture-navy mb-2">
            Authentication Error
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <LoadingSpinner message="Completing sign in..." />;
}

export default AuthCallback;
