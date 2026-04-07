/**
 * Pinterest Tag Utility
 * Wraps pintrk calls so they fail silently if the script hasn't loaded.
 */

const PINTEREST_TAG_ID = '2614054173415';

function pintrk(...args) {
  if (typeof window !== 'undefined' && typeof window.pintrk === 'function') {
    window.pintrk(...args);
  }
}

/**
 * Enable enhanced match by associating the authenticated user's email.
 * Pinterest hashes the email client-side — plain text is safe to pass.
 * Call this as soon as you know the user's email (login, register, app init).
 * @param {string} email
 */
export function setEnhancedMatch(email) {
  if (!email) return;
  pintrk('load', PINTEREST_TAG_ID, { em: email });
}

/** Fire when a user creates a new account */
export function trackSignup() {
  pintrk('track', 'signup');
}

/**
 * Fire when a user initiates checkout (before Stripe redirect).
 * @param {number} value - subscription price in USD
 */
export function trackCheckout(value = 0) {
  pintrk('track', 'checkout', {
    value,
    order_quantity: 1,
    currency: 'USD',
  });
}

/**
 * Fire when a subscription purchase is confirmed (after Stripe success).
 * @param {number} value - subscription price in USD
 */
export function trackPurchase(value = 0) {
  pintrk('track', 'purchase', {
    value,
    order_quantity: 1,
    currency: 'USD',
  });
}

/** Fire a generic page view (called automatically by the base tag, but useful for SPA route changes) */
export function trackPageView() {
  pintrk('page');
}
