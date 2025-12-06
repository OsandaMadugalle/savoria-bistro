const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be greater than zero.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe create intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent.' });
  }
});

module.exports = router;
