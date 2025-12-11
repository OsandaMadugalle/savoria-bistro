const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get current settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create defaults
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    
    res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings', error: err.message });
  }
});

// Update settings (admin only)
router.put('/', async (req, res) => {
  try {
    const { maxTableCapacity, depositAmount, reservationDuration, cancellationHours, operatingHoursOpen, operatingHoursClose, restDaysOpen, showPromoSection, adminEmail } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    // Update only provided fields
    if (maxTableCapacity !== undefined) settings.maxTableCapacity = maxTableCapacity;
    if (depositAmount !== undefined) settings.depositAmount = depositAmount;
    if (reservationDuration !== undefined) settings.reservationDuration = reservationDuration;
    if (cancellationHours !== undefined) settings.cancellationHours = cancellationHours;
    if (operatingHoursOpen !== undefined) settings.operatingHoursOpen = operatingHoursOpen;
    if (operatingHoursClose !== undefined) settings.operatingHoursClose = operatingHoursClose;
    if (restDaysOpen !== undefined) settings.restDaysOpen = restDaysOpen;
    if (showPromoSection !== undefined) settings.showPromoSection = showPromoSection;
    
    settings.updatedBy = adminEmail || 'admin';
    
    await settings.save();
    
    res.json({ success: true, message: 'Settings updated successfully', settings });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Failed to update settings', error: err.message });
  }
});

module.exports = router;
