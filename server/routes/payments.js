const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

// Enhanced payment intent creation with validation
router.post('/create-intent', async (req, res) => {
  try {
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
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Ensure amount is in cents
        currency: currency.toLowerCase(),
        description,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          environment: isTestKey ? 'test' : 'production'
        },
        statement_descriptor: 'SAVORIA BISTRO',
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        message: 'Payment intent created successfully'
      });
    } catch (stripeError) {
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          error: 'Invalid payment parameters',
          code: 'STRIPE_INVALID_PARAMS',
          details: stripeError.message
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
