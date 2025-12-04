const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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