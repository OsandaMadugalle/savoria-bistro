const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Admin = require('../models/Admin');
const cloudinary = require('cloudinary').v2;
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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_secret'
});

const uploadMenuImage = async (imageData) => {
  if (!imageData) return null;
  try {
    return await cloudinary.uploader.upload(imageData, {
      folder: 'savoria-bistro/menu',
      resource_type: 'auto',
      public_id: `menu-${Date.now()}`
    });
  } catch (err) {
    console.error('Cloudinary menu upload error:', err);
    return null;
  }
};

const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary asset deletion failed:', err);
  }
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
    const { requesterEmail, imageData, cloudinaryId, ...menuData } = req.body;
    const hasPermission = await checkAdminPermission(requesterEmail);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Only admins can add menu items' });
    }

    const uploadResult = await uploadMenuImage(imageData);
    const newItem = new MenuItem({
      ...menuData,
      image: uploadResult?.secure_url || menuData.image || '',
      cloudinaryId: uploadResult?.public_id || ''
    });

    await newItem.save();
    if (requesterEmail) {
      await logActivity(requesterEmail, 'Add Menu Item', `Added menu item: ${newItem.name}`);
    }
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { requesterEmail, imageData, cloudinaryId, ...menuData } = req.body;
    
    // Check admin permission
    const hasPermission = await checkAdminPermission(requesterEmail);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Only admins can edit menu items' });
    }

    const existingItem = await MenuItem.findOne({ id: req.params.id }) || await MenuItem.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const uploadResult = await uploadMenuImage(imageData);
    const updates = { ...menuData };
    if (uploadResult) {
      updates.image = uploadResult.secure_url;
      updates.cloudinaryId = uploadResult.public_id;
      if (existingItem.cloudinaryId) {
        await deleteCloudinaryAsset(existingItem.cloudinaryId);
      }
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(existingItem._id, updates, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found after update' });
    }
    if (requesterEmail) {
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
    if (deleted.cloudinaryId) {
      await deleteCloudinaryAsset(deleted.cloudinaryId);
    }
    if (requesterEmail) {
      await logActivity(requesterEmail, 'Delete Menu Item', `Deleted menu item: ${deleted.name}`);
    }
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;