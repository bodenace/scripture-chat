/**
 * Payment Prompt Component
 * Modal that appears after 5 free questions are used
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function SignupPrompt({ onClose }) {
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Focus trap and escape key handling
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    modalRef.current?.focus();
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleGetStarted = () => {
    // Navigate to signup page which will handle payment
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 animate-fade-in"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-scripture-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📖</span>
          </div>

          {/* Title */}
          <h2 id="payment-title" className="text-2xl font-display text-scripture-navy mb-3">
            You've Used Your Free Questions
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-6">
            Continue your scripture journey with unlimited access to ScriptureChat.
          </p>

          {/* Pricing */}
          <div className="bg-scripture-cream rounded-xl p-6 mb-6">
            <p className="text-4xl font-bold text-scripture-navy mb-2">
              $4.99
              <span className="text-lg font-normal text-gray-500">/month</span>
            </p>
            
            <ul className="space-y-2 text-gray-700 text-left mt-4">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Unlimited questions
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Save your chat history
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Priority responses
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Support our ministry
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGetStarted}
              disabled={loading}
              className="btn-primary w-full text-lg"
            >
              {loading ? 'Loading...' : 'Get Unlimited Access'}
            </button>

            <button
              onClick={handleLogin}
              className="btn-text w-full text-lg"
            >
              Already have an account? Sign In
            </button>
          </div>

          {/* Reassurance */}
          <p className="mt-6 text-sm text-gray-500">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPrompt;
