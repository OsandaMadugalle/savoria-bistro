const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Loyalty tier thresholds
const TIER_THRESHOLDS = {
  'Bronze': 0,
  'Silver': 500,
  'Gold': 1500
};

// Calculate user tier based on loyalty points
const calculateTier = (loyaltyPoints) => {
  if (loyaltyPoints >= TIER_THRESHOLDS.Gold) return 'Gold';
  if (loyaltyPoints >= TIER_THRESHOLDS.Silver) return 'Silver';
  return 'Bronze';
};

// Create Order
router.post('/', async (req, res) => {
  try {
    // Require userId for order
    if (!req.body.userId) {
      return res.status(400).json({ message: 'User must be logged in to place an order.' });
    }
    // Validate order data
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }
    if (!req.body.total || req.body.total <= 0) {
      return res.status(400).json({ message: 'Order total must be greater than zero.' });
    }
    if (!req.body.paymentIntentId) {
      return res.status(400).json({ message: 'Payment verification required.' });
    }

    // Generate unique orderId
    const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const newOrder = new Order({ ...req.body, orderId, status: 'Confirmed', createdAt: new Date() });
    await newOrder.save();

    // Award loyalty points to user (10 points per $1 spent) and update tier
    const User = require('../models/User');
    const pointsEarned = Math.floor(newOrder.total * 10);
    const user = await User.findByIdAndUpdate(
      newOrder.userId,
      { 
        $inc: { loyaltyPoints: pointsEarned },
      },
      { new: true }
    );
    
    // Update tier based on new points total
    if (user) {
      const newTier = calculateTier(user.loyaltyPoints + pointsEarned);
      await User.findByIdAndUpdate(newOrder.userId, { tier: newTier });
    }

    // Log order creation with enhanced details
    const { requesterEmail } = req.body;
    if (requesterEmail) {
      const { logActivity } = require('../routes/auth');
      const itemsList = newOrder.items.map(i => `${i.name}(x${i.quantity})`).join(', ');
      const pointsMsg = ` | Earned ${pointsEarned} loyalty points | Tier: ${calculateTier(user.loyaltyPoints + pointsEarned)}`;
      await logActivity(requesterEmail, 'Create Order', `Order ${newOrder.orderId}: $${newOrder.total.toFixed(2)} [${itemsList}]${pointsMsg}`);
    }
    
    res.status(201).json({
      ...newOrder.toObject(),
      message: 'Order placed successfully',
      pointsEarned,
      userTier: calculateTier(user.loyaltyPoints + pointsEarned)
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ 
      message: err.message || 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
    });
  }
});

// Get user loyalty info
router.get('/loyalty/:userId', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId, 'loyaltyPoints tier');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const nextTierThreshold = user.tier === 'Gold' ? TIER_THRESHOLDS.Gold : 
                             user.tier === 'Silver' ? TIER_THRESHOLDS.Gold : 
                             TIER_THRESHOLDS.Silver;
    const pointsToNextTier = Math.max(0, nextTierThreshold - user.loyaltyPoints);
    
    res.json({
      loyaltyPoints: user.loyaltyPoints,
      tier: user.tier,
      nextTier: user.tier === 'Gold' ? 'Gold' : user.tier === 'Silver' ? 'Gold' : 'Silver',
      pointsToNextTier,
      tierThresholds: TIER_THRESHOLDS
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Orders (for Staff/Admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }); // Newest first
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Single Order (by orderId or _id)
router.get('/:id', async (req, res) => {
  try {
    let order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      // Try by MongoDB _id
      order = await Order.findById(req.params.id);
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all orders for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Order Status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { status },
      { new: true }
    );
    if (!order) {
      // Try by MongoDB _id
      order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Log order status update
    const { requesterEmail } = req.body;
    if (requesterEmail) {
      const { logActivity } = require('../routes/auth');
      await logActivity(requesterEmail, 'Update Order', `Order ${order.orderId || order._id} status changed to ${status}`);
    }
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;