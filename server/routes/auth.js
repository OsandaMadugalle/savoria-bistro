const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const ActivityLog = require('../models/ActivityLog');

// Log an activity (call this in admin actions)
async function logActivity(userEmail, action, details = '') {
  try {
    await ActivityLog.create({ userEmail, action, details });
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

// Get all activity logs (masterAdmin only)
router.get('/activity-logs', requireRole(['masterAdmin'], true), async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Update user (admin/staff)
router.put('/update-user', async (req, res) => {
  try {
    const { email, updates, requesterEmail } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    if (updates.role) delete updates.role;
    if (updates.password && updates.password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }
    const user = await User.findOneAndUpdate({ email }, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logActivity(requesterEmail, 'Update User', `Updated user: ${email}`);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user (admin/staff)
router.delete('/delete-user', async (req, res) => {
  try {
    const { email, requesterEmail } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOneAndDelete({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// Remove duplicate router declaration
// Only one router instance should be used, declared at the top of the file

// Middleware to check role
function requireRole(roles, allowQuery = false) {
  return async (req, res, next) => {
    let requesterEmail;
    if (allowQuery && req.method === 'GET') {
      requesterEmail = req.query.requesterEmail;
    } else {
      requesterEmail = req.body.requesterEmail;
    }
    if (!requesterEmail) return res.status(403).json({ message: 'Requester email required' });
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !roles.includes(requester.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

// MasterAdmin adds new admin
router.post('/add-admin', requireRole(['masterAdmin']), async (req, res) => {
  try {
    const { name, email, password, phone, requesterEmail } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists. Please use a different email.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, role: 'admin' });
    await user.save();
    await logActivity(requesterEmail, 'Add Admin', `Added admin: ${email}`);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin or MasterAdmin adds new staff
router.post('/add-staff', requireRole(['admin', 'masterAdmin']), async (req, res) => {
  try {
    const { name, email, password, phone, requesterEmail } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists. Please use a different email.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, role: 'staff' });
    await user.save();
    await logActivity(requesterEmail, 'Add Staff', `Added staff: ${email}`);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
// Get all users (for admin/staff listing)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
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

// Seed MasterAdmin, Admin, and Staff if not exists
const seedAccounts = async () => {
  const masterExists = await User.findOne({ email: 'master@savoria.com' });
  if (!masterExists) {
    const masterPassword = 'Master@1234';
    const hashed = await bcrypt.hash(masterPassword, 10);
    await User.create({ name: 'Master Admin', email: 'master@savoria.com', password: hashed, role: 'masterAdmin', phone: '000-000-0000' });
    console.log(`👑 MasterAdmin account created: master@savoria.com / ${masterPassword}`);
  }

  const adminExists = await User.findOne({ email: 'admin@savoria.com' });
  if (!adminExists) {
    const adminPassword = 'Admin@1234';
    const hashed = await bcrypt.hash(adminPassword, 10);
    await User.create({ name: 'Admin Owner', email: 'admin@savoria.com', password: hashed, role: 'admin', phone: '000-000-0000' });
    console.log(`👑 Admin account created: admin@savoria.com / ${adminPassword}`);
  }

  const staffExists = await User.findOne({ email: 'staff@savoria.com' });
  if (!staffExists) {
    const staffPassword = 'Staff@1234';
    const hashed = await bcrypt.hash(staffPassword, 10);
    await User.create({ name: 'Kitchen Staff', email: 'staff@savoria.com', password: hashed, role: 'staff', phone: '000-000-0000' });
    console.log(`👨‍🍳 Staff account created: staff@savoria.com / ${staffPassword}`);
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
    console.log('Login attempt:', { email, password });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    // Strong password validation for masterAdmin
    if (user.role === 'masterAdmin') {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        console.log('MasterAdmin password does not meet criteria:', password);
        return res.status(400).json({ message: 'Master admin password must be at least 8 characters and include uppercase, lowercase, number, and special character.' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Invalid credentials for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    console.log('Login successful:', userResponse);
    res.json(userResponse);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;