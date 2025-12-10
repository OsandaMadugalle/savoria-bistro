const express = require('express');
const router = express.Router();
const Promo = require('../models/Promo');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { logActivity } = require('./auth');

// Helper: Check if user is admin or masterAdmin
const checkAdminPermission = async (requesterEmail) => {
  if (!requesterEmail) return false;
  
  // Check Admin collection first
  const admin = await Admin.findOne({ email: requesterEmail });
  if (admin && (admin.role === 'admin' || admin.role === 'masterAdmin')) return true;

  // Fallback to User collection
  const user = await User.findOne({ email: requesterEmail });
  return user && (user.role === 'admin' || user.role === 'masterAdmin');
};

// Get all active promos
router.get('/', async (req, res) => {
  try {
    const promos = await Promo.find({ active: true, expiryDate: { $gte: new Date() } }).sort({ createdAt: -1 });
    res.json(promos);
  } catch (err) {
    console.error('Get promos error:', err);
    res.status(500).json({ message: 'Failed to fetch promos', error: err.message });
  }
});

// Get all promos (admin - includes inactive/expired)
router.get('/admin/all', async (req, res) => {
  try {
    const requesterEmail = req.query.requesterEmail;
    const isAdmin = await checkAdminPermission(requesterEmail);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can view all promos' });
    }

    const promos = await Promo.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (err) {
    console.error('Get all promos error:', err);
    res.status(500).json({ message: 'Failed to fetch promos', error: err.message });
  }
});

// Create new promo (admin)
router.post('/', async (req, res) => {
  try {
    const { code, discount, expiryDate, active, requesterEmail } = req.body;

    const isAdmin = await checkAdminPermission(requesterEmail);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can create promos' });
    }

    if (!code || discount === undefined || !expiryDate) {
      return res.status(400).json({ message: 'Missing required fields: code, discount, expiryDate' });
    }

    // Check if code already exists
    const existing = await Promo.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    const promo = new Promo({
      code: code.toUpperCase(),
      discount,
      expiryDate: new Date(expiryDate),
      active: active !== false
    });

    await promo.save();
    
    // Log activity
    await logActivity(requesterEmail, 'PROMO_CREATE', `Created promo code "${code.toUpperCase()}" with ${discount}% discount`);
    
    res.status(201).json(promo);
  } catch (err) {
    console.error('Create promo error:', err);
    res.status(500).json({ message: 'Failed to create promo', error: err.message });
  }
});

// Update promo (admin)
router.put('/:id', async (req, res) => {
  try {
    const { code, discount, expiryDate, active, requesterEmail } = req.body;

    const isAdmin = await checkAdminPermission(requesterEmail);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can update promos' });
    }

    const promo = await Promo.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }

    const oldCode = promo.code;
    const oldDiscount = promo.discount;

    // If changing code, check if new code already exists
    if (code && code.toUpperCase() !== promo.code) {
      const existing = await Promo.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ message: 'Promo code already exists' });
      }
      promo.code = code.toUpperCase();
    }

    if (discount !== undefined) promo.discount = discount;
    if (expiryDate) promo.expiryDate = new Date(expiryDate);
    if (active !== undefined) promo.active = active;

    await promo.save();
    
    // Log activity
    await logActivity(requesterEmail, 'PROMO_UPDATE', `Updated promo from "${oldCode}" (${oldDiscount}%) to "${promo.code}" (${promo.discount}%)`);
    
    res.json(promo);
  } catch (err) {
    console.error('Update promo error:', err);
    res.status(500).json({ message: 'Failed to update promo', error: err.message });
  }
});

// Delete promo (admin)
router.delete('/:id', async (req, res) => {
  try {
    const requesterEmail = req.body.requesterEmail;
    
    const isAdmin = await checkAdminPermission(requesterEmail);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can delete promos' });
    }

    const promo = await Promo.findByIdAndDelete(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }
    
    // Log activity
    await logActivity(requesterEmail, 'PROMO_DELETE', `Deleted promo code "${promo.code}" (${promo.discount}%)`);
    
    res.json({ message: 'Promo deleted successfully' });
  } catch (err) {
    console.error('Delete promo error:', err);
    res.status(500).json({ message: 'Failed to delete promo', error: err.message });
  }
});

// Toggle promo active status (admin)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const requesterEmail = req.body.requesterEmail;
    
    const isAdmin = await checkAdminPermission(requesterEmail);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can toggle promos' });
    }

    const promo = await Promo.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }

    const oldStatus = promo.active;
    promo.active = !promo.active;
    await promo.save();
    
    // Log activity
    await logActivity(requesterEmail, 'PROMO_TOGGLE', `Toggled promo "${promo.code}" from ${oldStatus ? 'active' : 'inactive'} to ${promo.active ? 'active' : 'inactive'}`);
    
    res.json(promo);
  } catch (err) {
    console.error('Toggle promo error:', err);
    res.status(500).json({ message: 'Failed to toggle promo', error: err.message });
  }
});

module.exports = router;
