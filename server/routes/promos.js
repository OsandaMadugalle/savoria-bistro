const express = require('express');
const router = express.Router();
const Promo = require('../models/Promo');

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
    const { code, discount, expiryDate, active } = req.body;

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
    res.status(201).json(promo);
  } catch (err) {
    console.error('Create promo error:', err);
    res.status(500).json({ message: 'Failed to create promo', error: err.message });
  }
});

// Update promo (admin)
router.put('/:id', async (req, res) => {
  try {
    const { code, discount, expiryDate, active } = req.body;

    const promo = await Promo.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }

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
    res.json(promo);
  } catch (err) {
    console.error('Update promo error:', err);
    res.status(500).json({ message: 'Failed to update promo', error: err.message });
  }
});

// Delete promo (admin)
router.delete('/:id', async (req, res) => {
  try {
    const promo = await Promo.findByIdAndDelete(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }
    res.json({ message: 'Promo deleted successfully' });
  } catch (err) {
    console.error('Delete promo error:', err);
    res.status(500).json({ message: 'Failed to delete promo', error: err.message });
  }
});

// Toggle promo active status (admin)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo not found' });
    }

    promo.active = !promo.active;
    await promo.save();
    res.json(promo);
  } catch (err) {
    console.error('Toggle promo error:', err);
    res.status(500).json({ message: 'Failed to toggle promo', error: err.message });
  }
});

module.exports = router;
