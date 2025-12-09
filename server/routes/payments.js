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

// ===== RESERVATION PAYMENT ENDPOINTS =====

// Create payment intent for reservation deposit
router.post('/reservation/create-intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    const { reservationId, amount, email } = req.body;
    if (!reservationId || !amount || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const Reservation = require('../models/Reservation');
    const ReservationPayment = require('../models/ReservationPayment');

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    let payment = await ReservationPayment.findOne({ reservationId });
    
    if (!payment) {
      payment = new ReservationPayment({
        reservationId,
        userId: reservation.userId,
        confirmationCode: reservation.confirmationCode,
        amount,
        status: 'pending'
      });
      await payment.save();
    }

    // Get or create Stripe customer
    let customers = await stripe.customers.list({ email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          reservationId: reservationId.toString(),
          confirmationCode: reservation.confirmationCode
        }
      });
      customerId = customer.id;
    }

    payment.stripeCustomerId = customerId;
    await payment.save();

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        reservationId: reservationId.toString(),
        confirmationCode: reservation.confirmationCode,
        customerEmail: email
      },
      description: `Reservation deposit for ${reservation.name} on ${reservation.date} at ${reservation.time}`
    });

    payment.stripePaymentIntentId = paymentIntent.id;
    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      reservationId
    });
  } catch (err) {
    console.error('Reservation payment intent error:', err);
    res.status(500).json({ message: 'Failed to create payment intent', error: err.message });
  }
});

// Confirm reservation payment
router.post('/reservation/confirm', async (req, res) => {
  try {
    const { paymentIntentId, reservationId } = req.body;
    if (!paymentIntentId || !reservationId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const Reservation = require('../models/Reservation');
    const ReservationPayment = require('../models/ReservationPayment');
    const { sendEmail } = require('../utils/emailService');

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const payment = await ReservationPayment.findOne({ reservationId });
      if (payment) {
        payment.status = 'completed';
        payment.transactionId = paymentIntent.id;
        payment.paidAt = new Date();
        
        if (paymentIntent.charges && paymentIntent.charges.data && paymentIntent.charges.data[0]) {
          const charge = paymentIntent.charges.data[0];
          payment.last4Digits = charge.payment_method_details?.card?.last4 || '';
          payment.cardBrand = charge.payment_method_details?.card?.brand?.toUpperCase() || '';
        }
        
        await payment.save();
      }

      const reservation = await Reservation.findByIdAndUpdate(
        reservationId,
        { paymentStatus: 'completed' },
        { new: true }
      );

      // Send confirmation email
      if (reservation) {
        try {
          await sendEmail(
            reservation.email,
            'Payment Confirmed - Savoria Bistro Reservation',
            `
              <h2>Payment Confirmed</h2>
              <p>Dear ${reservation.name},</p>
              <p>Your deposit of $${(paymentIntent.amount / 100).toFixed(2)} has been successfully processed.</p>
              <p><strong>Reservation Details:</strong></p>
              <ul>
                <li>Date: ${reservation.date}</li>
                <li>Time: ${reservation.time}</li>
                <li>Party Size: ${reservation.guests} guests</li>
                <li>Confirmation Code: ${reservation.confirmationCode}</li>
              </ul>
              <p>We look forward to welcoming you at Savoria Bistro!</p>
            `
          );
        } catch (emailErr) {
          console.error('Email send error:', emailErr);
        }
      }

      res.json({ success: true, message: 'Payment confirmed', reservation });
    } else if (paymentIntent.status === 'processing') {
      res.json({ success: false, message: 'Payment is still processing', status: 'processing' });
    } else {
      const payment = await ReservationPayment.findOne({ reservationId });
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment declined';
        await payment.save();
      }

      await Reservation.findByIdAndUpdate(reservationId, { paymentStatus: 'failed' });
      res.json({ success: false, message: paymentIntent.last_payment_error?.message || 'Payment failed' });
    }
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ message: 'Failed to confirm payment', error: err.message });
  }
});

// Get reservation payment status
router.get('/reservation/status/:reservationId', async (req, res) => {
  try {
    const ReservationPayment = require('../models/ReservationPayment');
    const Reservation = require('../models/Reservation');
    
    const payment = await ReservationPayment.findOne({ reservationId: req.params.reservationId });
    const reservation = await Reservation.findById(req.params.reservationId);

    if (!payment || !reservation) {
      return res.status(404).json({ message: 'Payment or reservation not found' });
    }

    res.json({
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      last4Digits: payment.last4Digits,
      cardBrand: payment.cardBrand,
      paidAt: payment.paidAt,
      reservationStatus: reservation.paymentStatus
    });
  } catch (err) {
    console.error('Get payment status error:', err);
    res.status(500).json({ message: 'Failed to fetch payment status', error: err.message });
  }
});

// Refund reservation deposit
router.post('/reservation/refund/:reservationId', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Payment service not configured' });
    }

    const ReservationPayment = require('../models/ReservationPayment');
    const Reservation = require('../models/Reservation');
    const { sendEmail } = require('../utils/emailService');
    
    const { reason } = req.body;
    const payment = await ReservationPayment.findOne({ reservationId: req.params.reservationId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot refund payment that is not completed' });
    }

    // Create refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      metadata: { reason: reason || 'Reservation cancelled' }
    });

    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundReason = reason || 'Reservation cancelled';
    payment.refundedAt = new Date();
    await payment.save();

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.reservationId,
      { paymentStatus: 'refunded' },
      { new: true }
    );

    if (reservation) {
      try {
        await sendEmail(
          reservation.email,
          'Refund Processed - Savoria Bistro',
          `
            <h2>Refund Processed</h2>
            <p>Dear ${reservation.name},</p>
            <p>Your deposit of $${(payment.amount / 100).toFixed(2)} has been refunded.</p>
            <p>Reason: ${reason || 'Reservation cancelled'}</p>
            <p>The refund may take 3-5 business days to appear in your account.</p>
          `
        );
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
      }
    }

    res.json({ success: true, message: 'Refund processed', refundId: refund.id });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ message: 'Failed to process refund', error: err.message });
  }
});

// Admin: Get all reservation payments
router.get('/admin/reservations', async (req, res) => {
  try {
    const ReservationPayment = require('../models/ReservationPayment');
    
    const payments = await ReservationPayment.find()
      .populate('reservationId', 'name email date time guests confirmationCode')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Get all payments error:', err);
    res.status(500).json({ message: 'Failed to fetch payments', error: err.message });
  }
});

// Admin: Update payment status
router.patch('/admin/reservation/:paymentId', async (req, res) => {
  try {
    const ReservationPayment = require('../models/ReservationPayment');
    const Reservation = require('../models/Reservation');
    const { paymentMethod, status } = req.body;

    const payment = await ReservationPayment.findByIdAndUpdate(
      req.params.paymentId,
      { paymentMethod, status, updatedAt: new Date() },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (status === 'completed') {
      await Reservation.findByIdAndUpdate(payment.reservationId, { paymentStatus: 'completed' });
    }

    res.json({ success: true, message: 'Payment updated', payment });
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ message: 'Failed to update payment', error: err.message });
  }
});

module.exports = router;
