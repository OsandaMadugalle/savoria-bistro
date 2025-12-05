const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create Order
router.post('/', async (req, res) => {
  try {
    // Require userId for order
    if (!req.body.userId) {
      return res.status(400).json({ message: 'User must be logged in to place an order.' });
    }
    // Generate unique orderId
    const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const newOrder = new Order({ ...req.body, orderId });
    await newOrder.save();

    // Award loyalty points to user (10 points per $1 spent)
    const User = require('../models/User');
    const pointsEarned = Math.floor(newOrder.total * 10);
    await User.findByIdAndUpdate(newOrder.userId, { $inc: { loyaltyPoints: pointsEarned } });

    // Log order creation
    const { requesterEmail } = req.body;
    if (requesterEmail) {
      const { logActivity } = require('../routes/auth');
      await logActivity(requesterEmail, 'Add Order', `Created order: ${newOrder.orderId}`);
    }
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
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