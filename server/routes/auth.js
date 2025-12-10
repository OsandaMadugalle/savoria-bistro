const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@savoria-bistro.com',
    pass: process.env.EMAIL_PASSWORD || 'password'
  }
});

// Log an activity (call this in admin actions)
async function logActivity(userEmail, action, details = '') {
  try {
    await ActivityLog.create({ userEmail, action, details });
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

// Generate JWT token (1 hour expiration)
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'savoria-secret-key-change-in-production',
    { expiresIn: '1h' }
  );
}

// Generate refresh token (7 days expiration)
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_REFRESH_SECRET || 'savoria-refresh-secret-key',
    { expiresIn: '7d' }
  );
}

// Send verification email
async function sendVerificationEmail(email, verificationCode) {
  try {
    const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?code=${verificationCode}&email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@savoria-bistro.com',
      to: email,
      subject: 'Verify Your Savoria Bistro Email',
      html: `
        <h2>Welcome to Savoria Bistro!</h2>
        <p>Thank you for signing up. Please verify your email address to complete registration.</p>
        <p>
          <a href="${verificationLink}" style="background-color: #8B0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p>Or use this code: <strong>${verificationCode}</strong></p>
        <p>This code expires in 24 hours.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
  } catch (err) {
    console.error('Email send error:', err);
  }
}

// Helper function to clean customer fields from non-customer users
function cleanCustomerFields(userResponse) {
  if (['admin', 'staff', 'masterAdmin'].includes(userResponse.role)) {
    delete userResponse.tier;
    delete userResponse.loyaltyPoints;
    delete userResponse.memberSince;
    delete userResponse.history;
  }
  return userResponse;
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
    // If permissions are present, update them separately
    let user;
    if (updates.permissions) {
      user = await User.findOneAndUpdate(
        { email },
        {
          ...updates,
          permissions: {
            manageMenu: !!updates.permissions.manageMenu,
            viewOrders: !!updates.permissions.viewOrders,
            manageUsers: !!updates.permissions.manageUsers
          }
        },
        { new: true }
      );
    } else {
      user = await User.findOneAndUpdate({ email }, updates, { new: true });
    }
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logActivity(requesterEmail, 'Update User', `Updated user: ${email}`);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(cleanCustomerFields(userResponse));
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

// Middleware to check role (supports JWT and email-based auth)
function requireRole(roles, allowQuery = false) {
  return async (req, res, next) => {
    // Try JWT token first
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'savoria-secret-key-change-in-production');
        if (!roles.includes(decoded.role)) {
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
        req.user = decoded;
        return next();
      } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
    }
    
    // Fallback to email-based check for backward compatibility
    let requesterEmail;
    if (allowQuery && req.method === 'GET') {
      requesterEmail = req.query.requesterEmail;
    } else {
      requesterEmail = req.body.requesterEmail;
    }
    
    if (!requesterEmail) return res.status(403).json({ message: 'Authentication required' });
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester || !roles.includes(requester.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    req.user = { email: requesterEmail, role: requester.role };
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
    res.json(cleanCustomerFields(userResponse));
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

    // Fetch recent orders for this user (only for customer role)
    if (userResponse.role === 'customer') {
      const Order = require('../models/Order');
      const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5);
      userResponse.history = orders.map(order => ({
        id: order.orderId,
        date: order.createdAt,
        items: order.items.map(i => i.name),
        total: order.total,
        status: order.status
      }));
    }

    res.json(cleanCustomerFields(userResponse));
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
  } else {
    // Ensure existing master has correct role
    await User.updateOne({ email: 'master@savoria.com' }, { role: 'masterAdmin' });
  }

  const adminExists = await User.findOne({ email: 'admin@savoria.com' });
  if (!adminExists) {
    const adminPassword = 'Admin@1234';
    const hashed = await bcrypt.hash(adminPassword, 10);
    await User.create({ name: 'Admin Owner', email: 'admin@savoria.com', password: hashed, role: 'admin', phone: '000-000-0000' });
    console.log(`👑 Admin account created: admin@savoria.com / ${adminPassword}`);
  } else {
    // Ensure existing admin has correct role
    await User.updateOne({ email: 'admin@savoria.com' }, { role: 'admin' });
  }

  const staffExists = await User.findOne({ email: 'staff@savoria.com' });
  if (!staffExists) {
    const staffPassword = 'Staff@1234';
    const hashed = await bcrypt.hash(staffPassword, 10);
    await User.create({ name: 'Kitchen Staff', email: 'staff@savoria.com', password: hashed, role: 'staff', phone: '000-000-0000' });
    console.log(`👨‍🍳 Staff account created: staff@savoria.com / ${staffPassword}`);
  } else {
    // Ensure existing staff has correct role
    await User.updateOne({ email: 'staff@savoria.com' }, { role: 'staff' });
  }
};
seedAccounts();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, address, birthday } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password required' });
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      phone, 
      address, 
      birthday, 
      role: 'customer',
      verificationCode,
      verificationCodeExpires,
      emailVerified: false
    });
    
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(email, verificationCode);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.verificationCode;
    delete userResponse.refreshTokens;
    
    res.status(201).json({
      ...userResponse,
      message: 'Account created. Please check your email to verify.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'savoria-refresh-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Update refresh tokens
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600
    });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

// Email verification endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check if code is expired (24 hours)
    if (Date.now() > user.verificationCodeExpires) {
      return res.status(400).json({ message: 'Verification code expired' });
    }

    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    await sendVerificationEmail(email, verificationCode);
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { email, refreshToken } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove the specific refresh token or all if not specified
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    } else {
      user.refreshTokens = [];
    }
    await user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all admins (masterAdmin only)
router.get('/admins', requireRole(['masterAdmin'], true), async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }, '-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update admin (masterAdmin only)
router.put('/admins/:id', requireRole(['masterAdmin']), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (password && password.trim() !== '') {
      updates.password = await bcrypt.hash(password, 10);
    }

    const admin = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const adminResponse = admin.toObject();
    delete adminResponse.password;
    res.json(cleanCustomerFields(adminResponse));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete admin (masterAdmin only)
router.delete('/admins/:id', requireRole(['masterAdmin']), async (req, res) => {
  try {
    const admin = await User.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified (only for customers)
    if (user.role === 'customer' && !user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email first', action: 'verify_email' });
    }

    // Strong password validation for masterAdmin
    if (user.role === 'masterAdmin') {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({ message: 'Master admin password must meet requirements' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in user document
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.verificationCode;
    
    const cleanedUser = cleanCustomerFields(userResponse);
    
    console.log('Login response - user object:', {
      _id: cleanedUser._id,
      id: cleanedUser.id,
      email: cleanedUser.email,
      name: cleanedUser.name,
      role: cleanedUser.role,
      tier: cleanedUser.tier,
      loyaltyPoints: cleanedUser.loyaltyPoints
    });
    
    res.json({
      user: cleanedUser,
      token: accessToken,
      refreshToken,
      expiresIn: 3600
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.logActivity = logActivity;