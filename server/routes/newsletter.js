const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');

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
      subscriptionRate: ((active / total) * 100).toFixed(2) + '%'
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
