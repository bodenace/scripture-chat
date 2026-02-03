/**
 * Main entry point for ScriptureChat
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Initialize Sentry for error monitoring
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  console.log('📊 Sentry error monitoring initialized');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
          <App />
        </Sentry.ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Error fallback component
function ErrorFallback() {
  return (
    <div className="min-h-screen bg-scripture-cream flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-scripture-navy rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-3xl">✝</span>
        </div>
        <h1 className="text-2xl font-display text-scripture-navy mb-4">
          Something Went Wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Please refresh the page or try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-scripture-navy text-white px-6 py-3 rounded-xl hover:bg-scripture-navy/90"
        >
          Refresh Page
        </button>
        <p className="text-sm text-gray-500 mt-6 italic">
          "For I know the plans I have for you, declares the Lord" — Jeremiah 29:11
        </p>
      </div>
    </div>
  );
}
