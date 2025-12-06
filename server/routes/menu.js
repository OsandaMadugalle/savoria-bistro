const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

// Helper: Check if user is admin or masterAdmin
const checkAdminPermission = async (requesterEmail) => {
  if (!requesterEmail) return false;
  const user = await User.findOne({ email: requesterEmail });
  return user && (user.role === 'admin' || user.role === 'masterAdmin');
};

router.get('/', async (req, res) => {
    try {
      const items = await MenuItem.find();
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
  try {
    const { requesterEmail } = req.body;
    
    // Check admin permission
    const hasPermission = await checkAdminPermission(requesterEmail);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Only admins can add menu items' });
    }

    const newItem = new MenuItem(req.body);
    await newItem.save();
      // Log menu item addition
      if (requesterEmail) {
        const { logActivity } = require('../routes/auth');
        await logActivity(requesterEmail, 'Add Menu Item', `Added menu item: ${newItem.name}`);
      }
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { requesterEmail } = req.body;
    
    // Check admin permission
    const hasPermission = await checkAdminPermission(requesterEmail);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Only admins can edit menu items' });
    }

    // Try to update by custom id, then by MongoDB _id
    let updatedItem = await MenuItem.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updatedItem) {
      updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    }
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
      // Log menu item edit
      if (requesterEmail) {
        const { logActivity } = require('../routes/auth');
        await logActivity(requesterEmail, 'Edit Menu Item', `Edited menu item: ${updatedItem.name}`);
      }
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { requesterEmail } = req.body;
    
    // Check admin permission
    const hasPermission = await checkAdminPermission(requesterEmail);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Only admins can delete menu items' });
    }

    // Try to delete by custom id, then by MongoDB _id
    let deleted = await MenuItem.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      deleted = await MenuItem.findByIdAndDelete(req.params.id);
    }
    if (!deleted) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Log deletion
    if (requesterEmail) {
      const { logActivity } = require('../routes/auth');
      await logActivity(requesterEmail, 'Delete Menu Item', `Deleted menu item: ${deleted.name}`);
    }
    
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;