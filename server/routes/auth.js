const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Update current user profile (via email query param)
router.put('/me', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const updates = { ...req.body };
    // Only hash and update password if provided and not blank
    if (updates.password && updates.password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }
    // Don't allow role change here
    delete updates.role;
    const user = await User.findOneAndUpdate({ email }, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile (simple: via email query param)
router.get('/me', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userResponse = user.toObject();
    delete userResponse.password;

    // Fetch recent orders for this user
    const Order = require('../models/Order');
    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5);
    userResponse.history = orders.map(order => ({
      id: order.orderId,
      date: order.createdAt,
      items: order.items.map(i => i.name),
      total: order.total,
      status: order.status
    }));

    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed Admin and Staff if not exists
const seedAccounts = async () => {
  const adminExists = await User.findOne({ email: 'admin@savoria.com' });
  if (!adminExists) {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin Owner', email: 'admin@savoria.com', password: hashed, role: 'admin', phone: '000-000-0000' });
    console.log('👑 Admin account created: admin@savoria.com / admin123');
  }

  const staffExists = await User.findOne({ email: 'staff@savoria.com' });
  if (!staffExists) {
    const hashed = await bcrypt.hash('staff123', 10);
    await User.create({ name: 'Kitchen Staff', email: 'staff@savoria.com', password: hashed, role: 'staff', phone: '000-000-0000' });
    console.log('👨‍🍳 Staff account created: staff@savoria.com / staff123');
  }
};
seedAccounts();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    // Default role is customer. Admin/Staff must be created via DB or seeded for security.
    const user = new User({ name, email, password: hashedPassword, phone, role: 'customer' });
    await user.save();
    console.log('✅ User created:', user.email);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;