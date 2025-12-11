const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const StockAlert = require('../models/StockAlert');
const User = require('../models/User');
const { logActivity } = require('./auth');

// Helper: Check if user is admin (User or Admin collections)
const Admin = require('../models/Admin');
const checkAdminPermission = async (requesterEmail) => {
  if (!requesterEmail) return false;
  const admin = await Admin.findOne({ email: requesterEmail });
  if (admin) {
    console.log('[checkAdminPermission] requesterEmail:', requesterEmail, '| found admin:', { email: admin.email, role: admin.role });
    return admin.role === 'admin' || admin.role === 'masterAdmin';
  }
  console.log('[checkAdminPermission] requesterEmail:', requesterEmail, '| found admin: null');
  return false;
};

// Helper: Create or update stock alert
const createStockAlert = async (item, alertType) => {
  try {
    const existingAlert = await StockAlert.findOne({
      itemId: item.id,
      alertType: alertType,
      isActive: true
    });

    if (existingAlert) {
      await StockAlert.findByIdAndUpdate(existingAlert._id, {
        currentStock: item.stock,
        updatedAt: new Date()
      });
      return existingAlert._id;
    }

    const alert = new StockAlert({
      itemId: item.id,
      itemName: item.name,
      currentStock: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      alertType: alertType
    });
    await alert.save();
    return alert._id;
  } catch (err) {
    console.error('Stock alert creation error:', err);
  }
};

// Get all stock alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await StockAlert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get active stock alerts
router.get('/alerts/active', async (req, res) => {
  try {
    const alerts = await StockAlert.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const lowStockItems = await MenuItem.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });
    res.json(lowStockItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get out of stock items
router.get('/out-of-stock', async (req, res) => {
  try {
    const outOfStockItems = await MenuItem.find({ stock: 0 });
    res.json(outOfStockItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update item stock
router.patch('/:itemId/stock', async (req, res) => {
  try {
    const { requesterEmail, quantity, reason } = req.body;
    const isAdmin = await checkAdminPermission(requesterEmail);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin permission required' });
    }

    const item = await MenuItem.findOne({ id: req.params.itemId });
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const oldStock = item.stock;
    const newStock = Math.max(0, oldStock + quantity);
    const wasOutOfStock = oldStock === 0;
    const isNowOutOfStock = newStock === 0;

    item.stock = newStock;
    item.isAvailable = newStock > 0;

    // Handle alerts
    if (isNowOutOfStock && !wasOutOfStock) {
      await createStockAlert(item, 'OUT_OF_STOCK');
    } else if (!isNowOutOfStock && wasOutOfStock) {
      // Deactivate out of stock alert and create back in stock alert
      await StockAlert.updateOne(
        { itemId: item.id, alertType: 'OUT_OF_STOCK', isActive: true },
        { isActive: false }
      );
      await createStockAlert(item, 'BACK_IN_STOCK');
    } else if (newStock <= item.lowStockThreshold && newStock > 0) {
      await createStockAlert(item, 'LOW_STOCK');
    } else if (newStock > item.lowStockThreshold) {
      // Deactivate low stock alert if stock recovers above threshold
      await StockAlert.updateOne(
        { itemId: item.id, alertType: 'LOW_STOCK', isActive: true },
        { isActive: false }
      );
    }

    await item.save();

    // Log activity
    await logActivity(
      requesterEmail,
      'Update Stock',
      `${item.name}: ${oldStock} → ${newStock} units (${reason || 'No reason provided'})`
    );

    res.json({
      message: 'Stock updated successfully',
      item,
      oldStock,
      newStock,
      isAvailable: item.isAvailable
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Acknowledge stock alert
router.patch('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { requesterEmail } = req.body;
    const isAdmin = await checkAdminPermission(requesterEmail);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin permission required' });
    }

    const alert = await StockAlert.findByIdAndUpdate(
      req.params.alertId,
      {
        acknowledged: true,
        acknowledgedBy: requesterEmail,
        acknowledgedAt: new Date()
      },
      { new: true }
    );

    res.json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Set low stock threshold
router.patch('/:itemId/threshold', async (req, res) => {
  try {
    const { requesterEmail, threshold } = req.body;
    const isAdmin = await checkAdminPermission(requesterEmail);
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin permission required' });
    }

    const item = await MenuItem.findOneAndUpdate(
      { id: req.params.itemId },
      { lowStockThreshold: Math.max(0, threshold) },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await logActivity(requesterEmail, 'Update Threshold', `${item.name}: threshold set to ${threshold} units`);

    res.json({ message: 'Threshold updated', item });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get stock statistics
router.get('/stats', async (req, res) => {
  try {
    const totalItems = await MenuItem.countDocuments();
    const availableItems = await MenuItem.countDocuments({ isAvailable: true });
    const outOfStockItems = await MenuItem.countDocuments({ stock: 0 });
    const lowStockItems = await MenuItem.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      stock: { $gt: 0 }
    });
    const totalStock = await MenuItem.aggregate([
      { $group: { _id: null, totalStock: { $sum: '$stock' } } }
    ]);

    res.json({
      totalItems,
      availableItems,
      outOfStockItems,
      lowStockItems,
      totalStock: totalStock[0]?.totalStock || 0,
      averageStockPerItem: totalItems > 0 ? Math.round(totalStock[0]?.totalStock / totalItems) : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
