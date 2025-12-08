const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

// Initialize Stripe with validation
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ WARNING: STRIPE_SECRET_KEY not set in environment variables. Payment functionality will not work in production.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-08-16',
});

// Enhanced payment intent creation with validation
router.post('/create-intent', async (req, res) => {
  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ 
        error: 'Payment service not configured',
        code: 'STRIPE_NOT_CONFIGURED',
        details: 'STRIPE_SECRET_KEY environment variable is not set'
      });
    }

    const { amount, currency = 'usd', metadata = {}, description = 'Savoria Bistro Order' } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount is required and must be greater than zero.',
        code: 'INVALID_AMOUNT'
      });
    }
    
    // Validate currency
    if (!['usd', 'eur', 'gbp'].includes(currency.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Unsupported currency.',
        code: 'INVALID_CURRENCY'
      });
    }
    
    // Check for test/demo mode
    const isTestKey = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test');
    
    try {
      // Validate amount is properly formatted (should be in cents)
      const amountInCents = Math.round(amount);
      if (amountInCents < 50) {
        return res.status(400).json({
          error: 'Minimum order amount is $0.50',
          code: 'AMOUNT_TOO_SMALL'
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        description,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          environment: isTestKey ? 'test' : 'production'
        },
        statement_descriptor_suffix: 'SAVORIA',
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        message: 'Payment intent created successfully'
      });
    } catch (stripeError) {
      console.error('Stripe Error Details:', {
        type: stripeError.type,
        message: stripeError.message,
        param: stripeError.param,
        code: stripeError.code
      });

      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          error: 'Invalid payment parameters. Please check amount and currency.',
          code: 'STRIPE_INVALID_PARAMS',
          details: stripeError.message
        });
      }
      if (stripeError.type === 'StripeAuthenticationError') {
        return res.status(503).json({ 
          error: 'Payment service authentication failed',
          code: 'STRIPE_AUTH_ERROR',
          details: 'Server payment configuration issue'
        });
      }
      throw stripeError;
    }
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      code: 'PAYMENT_SERVICE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify payment status endpoint
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      status: paymentIntent.status,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      succeeded: paymentIntent.status === 'succeeded',
      lastError: paymentIntent.last_payment_error?.message || null
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
