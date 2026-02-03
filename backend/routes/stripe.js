/**
 * Stripe Payment Routes
 * Handles subscriptions, checkout, and webhooks
 */

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { paymentLimiter } = require('../middleware/rateLimiter');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Premium plan price (monthly)
const PREMIUM_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_placeholder';
const PREMIUM_MONTHLY_AMOUNT = 499; // $4.99 in cents

// ===========================================
// Routes
// ===========================================

/**
 * @route   GET /api/stripe/plans
 * @desc    Get available subscription plans
 * @access  Public
 */
router.get('/plans', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      plans: [
        {
          id: 'premium',
          name: 'ScriptureChat Subscription',
          price: 4.99,
          priceId: PREMIUM_PRICE_ID,
          features: [
            'Unlimited scripture questions',
            'Save your chat history',
            'Priority responses',
            'Support our ministry',
            'Cancel anytime'
          ]
        }
      ]
    }
  });
}));

/**
 * @route   POST /api/stripe/create-checkout-session
 * @desc    Create Stripe checkout session for premium subscription
 * @access  Private
 */
router.post('/create-checkout-session', protect, paymentLimiter, asyncHandler(async (req, res) => {
  // Check if user already has premium
  if (req.user.subscription.status === 'premium') {
    throw new ApiError('You already have an active premium subscription.', 400);
  }

  let customerId = req.user.subscription.stripeCustomerId;

  // Create Stripe customer if doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.name,
      metadata: {
        userId: req.user._id.toString()
      }
    });
    customerId = customer.id;

    // Save customer ID to user
    req.user.subscription.stripeCustomerId = customerId;
    await req.user.save();
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: PREMIUM_PRICE_ID,
        quantity: 1
      }
    ],
    success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard?canceled=true`,
    metadata: {
      userId: req.user._id.toString()
    },
    subscription_data: {
      metadata: {
        userId: req.user._id.toString()
      }
    },
    // Allow promotion codes
    allow_promotion_codes: true,
    // Billing address collection
    billing_address_collection: 'auto'
  });

  res.json({
    success: true,
    data: {
      sessionId: session.id,
      url: session.url
    }
  });
}));

/**
 * @route   POST /api/stripe/create-portal-session
 * @desc    Create Stripe customer portal session for subscription management
 * @access  Private
 */
router.post('/create-portal-session', protect, asyncHandler(async (req, res) => {
  const customerId = req.user.subscription.stripeCustomerId;

  if (!customerId) {
    throw new ApiError('No subscription found. Please subscribe first.', 400);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL}/dashboard`
  });

  res.json({
    success: true,
    data: {
      url: session.url
    }
  });
}));

/**
 * @route   POST /api/stripe/verify-session
 * @desc    Verify a checkout session and activate subscription (for local dev without webhooks)
 * @access  Private
 */
router.post('/verify-session', protect, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    throw new ApiError('Session ID is required', 400);
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    // Verify the session belongs to this user
    if (session.metadata?.userId !== req.user._id.toString() && 
        session.customer !== req.user.subscription.stripeCustomerId) {
      throw new ApiError('Session does not belong to this user', 403);
    }

    // Check if payment was successful
    if (session.payment_status === 'paid' && session.subscription) {
      const subscription = session.subscription;

      // Update user's subscription status
      await req.user.updateSubscription('premium', {
        customerId: session.customer,
        subscriptionId: typeof subscription === 'string' ? subscription : subscription.id,
        currentPeriodEnd: typeof subscription === 'string' 
          ? null 
          : subscription.current_period_end
      });

      return res.json({
        success: true,
        message: 'Subscription activated successfully!',
        data: {
          status: 'premium',
          isPremium: true
        }
      });
    }

    res.json({
      success: false,
      message: 'Payment not completed',
      data: {
        paymentStatus: session.payment_status
      }
    });

  } catch (error) {
    console.error('Session verification error:', error);
    throw new ApiError('Failed to verify session', 500);
  }
}));

/**
 * @route   POST /api/stripe/sync-subscription
 * @desc    Sync subscription status from Stripe (for fixing out-of-sync accounts)
 * @access  Private
 */
router.post('/sync-subscription', protect, asyncHandler(async (req, res) => {
  const customerId = req.user.subscription?.stripeCustomerId;

  // If no customer ID, check if there's a customer with this email
  let stripeCustomer;
  if (!customerId) {
    const customers = await stripe.customers.list({ email: req.user.email, limit: 1 });
    if (customers.data.length > 0) {
      stripeCustomer = customers.data[0];
      // Save the customer ID to user
      req.user.subscription.stripeCustomerId = stripeCustomer.id;
    }
  } else {
    try {
      stripeCustomer = await stripe.customers.retrieve(customerId);
    } catch (err) {
      // Customer doesn't exist, try finding by email
      const customers = await stripe.customers.list({ email: req.user.email, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomer = customers.data[0];
        req.user.subscription.stripeCustomerId = stripeCustomer.id;
      }
    }
  }

  if (!stripeCustomer) {
    return res.json({
      success: false,
      message: 'No Stripe customer found for this account',
      data: { status: 'free' }
    });
  }

  // Get active subscriptions for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomer.id,
    status: 'active',
    limit: 1
  });

  if (subscriptions.data.length > 0) {
    const subscription = subscriptions.data[0];
    
    await req.user.updateSubscription('premium', {
      customerId: stripeCustomer.id,
      subscriptionId: subscription.id,
      currentPeriodEnd: subscription.current_period_end
    });

    return res.json({
      success: true,
      message: 'Subscription synced successfully! You now have Premium access.',
      data: {
        status: 'premium',
        isPremium: true,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }

  // Check for trialing subscriptions too
  const trialingSubscriptions = await stripe.subscriptions.list({
    customer: stripeCustomer.id,
    status: 'trialing',
    limit: 1
  });

  if (trialingSubscriptions.data.length > 0) {
    const subscription = trialingSubscriptions.data[0];
    
    await req.user.updateSubscription('premium', {
      customerId: stripeCustomer.id,
      subscriptionId: subscription.id,
      currentPeriodEnd: subscription.current_period_end
    });

    return res.json({
      success: true,
      message: 'Trial subscription synced successfully!',
      data: {
        status: 'premium',
        isPremium: true,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }

  // No active subscription found
  await req.user.updateSubscription('free', {
    customerId: stripeCustomer.id
  });

  res.json({
    success: false,
    message: 'No active subscription found in Stripe',
    data: { status: 'free' }
  });
}));

/**
 * @route   GET /api/stripe/subscription-status
 * @desc    Get current user's subscription status
 * @access  Private
 */
router.get('/subscription-status', protect, asyncHandler(async (req, res) => {
  const user = req.user;

  let subscriptionDetails = null;

  // If user has a Stripe subscription, fetch details
  if (user.subscription.stripeSubscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        user.subscription.stripeSubscriptionId
      );

      subscriptionDetails = {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        plan: {
          name: 'Premium',
          amount: PREMIUM_MONTHLY_AMOUNT / 100,
          interval: 'month'
        }
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }

  res.json({
    success: true,
    data: {
      subscription: {
        status: user.subscription.status,
        isPremium: user.subscription.status === 'premium',
        details: subscriptionDetails
      }
    }
  });
}));

/**
 * @route   POST /api/stripe/cancel-subscription
 * @desc    Cancel user's subscription at period end
 * @access  Private
 */
router.post('/cancel-subscription', protect, asyncHandler(async (req, res) => {
  const subscriptionId = req.user.subscription.stripeSubscriptionId;

  if (!subscriptionId) {
    throw new ApiError('No active subscription found.', 400);
  }

  // Cancel at period end (user keeps access until then)
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  });

  res.json({
    success: true,
    message: 'Your subscription will be canceled at the end of the billing period.',
    data: {
      cancelAt: new Date(subscription.current_period_end * 1000)
    }
  });
}));

/**
 * @route   POST /api/stripe/reactivate-subscription
 * @desc    Reactivate a canceled subscription before it ends
 * @access  Private
 */
router.post('/reactivate-subscription', protect, asyncHandler(async (req, res) => {
  const subscriptionId = req.user.subscription.stripeSubscriptionId;

  if (!subscriptionId) {
    throw new ApiError('No subscription found.', 400);
  }

  // Remove cancellation
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false
  });

  res.json({
    success: true,
    message: 'Your subscription has been reactivated!'
  });
}));

/**
 * @route   POST /api/stripe/webhook
 * @desc    Handle Stripe webhooks
 * @access  Public (verified by Stripe signature)
 */
router.post('/webhook', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For testing without signature verification
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      await handlePaymentSuccess(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await handlePaymentFailed(invoice);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
}));

// ===========================================
// Webhook Handler Functions
// ===========================================

/**
 * Handle successful checkout session
 */
async function handleCheckoutComplete(session) {
  try {
    const userId = session.metadata?.userId;
    
    if (!userId) {
      // Try to find user by customer ID
      const customer = await stripe.customers.retrieve(session.customer);
      if (customer.metadata?.userId) {
        const user = await User.findById(customer.metadata.userId);
        if (user) {
          await user.updateSubscription('premium', {
            customerId: session.customer,
            subscriptionId: session.subscription
          });
        }
      }
      return;
    }

    const user = await User.findById(userId);
    if (user) {
      await user.updateSubscription('premium', {
        customerId: session.customer,
        subscriptionId: session.subscription
      });
      console.log(`✅ User ${user.email} upgraded to premium`);
    }
  } catch (error) {
    console.error('Error handling checkout complete:', error);
  }
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    let user;

    if (userId) {
      user = await User.findById(userId);
    } else {
      // Find by Stripe customer ID
      user = await User.findOne({ 
        'subscription.stripeCustomerId': subscription.customer 
      });
    }

    if (user) {
      const status = subscription.status === 'active' ? 'premium' : 
                     subscription.status === 'canceled' ? 'cancelled' : 'free';
      
      await user.updateSubscription(status, {
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end
      });
      
      console.log(`✅ Updated subscription for ${user.email}: ${status}`);
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    const user = await User.findOne({ 
      'subscription.stripeSubscriptionId': subscription.id 
    });

    if (user) {
      user.subscription.status = 'free';
      user.subscription.stripeSubscriptionId = null;
      user.subscription.currentPeriodEnd = null;
      await user.save();
      
      console.log(`✅ Subscription ended for ${user.email}`);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(invoice) {
  try {
    if (invoice.subscription) {
      const user = await User.findOne({ 
        'subscription.stripeSubscriptionId': invoice.subscription 
      });

      if (user && user.subscription.status !== 'premium') {
        user.subscription.status = 'premium';
        await user.save();
        console.log(`✅ Payment successful for ${user.email}`);
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
  try {
    if (invoice.subscription) {
      const user = await User.findOne({ 
        'subscription.stripeSubscriptionId': invoice.subscription 
      });

      if (user) {
        console.log(`⚠️ Payment failed for ${user.email}`);
        // Could send notification email here
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

module.exports = router;
