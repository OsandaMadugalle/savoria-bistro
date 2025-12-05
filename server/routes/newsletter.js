const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { sendConfirmationEmail, sendUnsubscribeConfirmation, sendNewsletterToAll } = require('../utils/emailService');
const crypto = require('crypto');

// Subscribe to newsletter
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    if (existing && existing.isActive) {
      return res.status(400).json({ message: 'Already subscribed to our newsletter' });
    }

    // If previously unsubscribed, reactivate
    if (existing && !existing.isActive) {
      existing.isActive = true;
      existing.unsubscribedAt = null;
      await existing.save();
      return res.json({ message: 'Welcome back! You\'ve been resubscribed', data: existing });
    }

    // Create new subscriber
    const subscriber = new Newsletter({
      email,
      name: name || 'Subscriber',
      isActive: true
    });

    await subscriber.save();

    // Send confirmation email
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    await sendConfirmationEmail(email, unsubscribeToken);

    res.status(201).json({ message: 'Successfully subscribed to our newsletter!', data: subscriber });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This email is already subscribed' });
    }
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Failed to subscribe' });
  }
});

// Unsubscribe from newsletter
router.post('/newsletter/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const subscriber = await Newsletter.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({ message: 'Email not found in our newsletter list' });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    // Send unsubscribe confirmation email
    await sendUnsubscribeConfirmation(email);

    res.json({ message: 'You have been unsubscribed from our newsletter' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

// Get all active subscribers (admin only)
router.get('/newsletter/subscribers', async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).sort({ subscribedAt: -1 });
    res.json({ count: subscribers.length, data: subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Failed to fetch subscribers' });
  }
});

// Get newsletter stats (admin only)
router.get('/newsletter/stats', async (req, res) => {
  try {
    const total = await Newsletter.countDocuments({});
    const active = await Newsletter.countDocuments({ isActive: true });
    const inactive = await Newsletter.countDocuments({ isActive: false });

    res.json({
      total,
      active,
      inactive,
      activePercentage: total > 0 ? ((active / total) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Send newsletter campaign to all subscribers (admin only)
router.post('/newsletter/send-campaign', async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Newsletter content is required' });
    }

    // Send to all active subscribers
    const result = await sendNewsletterToAll(content);

    res.json({
      message: `Newsletter campaign sent successfully!`,
      ...result
    });
  } catch (error) {
    console.error('Error sending newsletter campaign:', error);
    res.status(500).json({ message: 'Failed to send newsletter campaign' });
  }
});

// Unsubscribe via email link (no auth needed)
router.get('/newsletter/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email parameter required' });
    }

    const subscriber = await Newsletter.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    if (!subscriber.isActive) {
      return res.json({ message: 'Already unsubscribed' });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    await sendUnsubscribeConfirmation(email);

    res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Error unsubscribing via link:', error);
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

module.exports = router;
