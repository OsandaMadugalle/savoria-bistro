const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_secret'
});

// Get all gallery images
router.get('/gallery', async (req, res) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ message: 'Error fetching gallery images' });
  }
});

// Upload new gallery image (admin only)
router.post('/gallery', async (req, res) => {
  try {
    const { caption, category, imageBase64, uploadedBy, uploadedByName } = req.body;

    if (!caption || !category || !imageBase64) {
      return res.status(400).json({ message: 'Caption, category, and image are required' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageBase64, {
      folder: 'savoria-bistro/gallery',
      resource_type: 'auto',
      public_id: `gallery-${Date.now()}`
    });

    const newImage = new Gallery({
      caption,
      category,
      src: result.secure_url, // Store Cloudinary URL
      cloudinaryId: result.public_id, // Store Cloudinary ID for deletion
      uploadedBy: uploadedBy,
      uploadedByName: uploadedByName
    });

    const savedImage = await newImage.save();
    res.status(201).json(savedImage);
  } catch (error) {
    console.error('Error uploading gallery image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Update gallery image
router.put('/gallery/:id', async (req, res) => {
  try {
    const { caption, category } = req.body;
    const image = await Gallery.findByIdAndUpdate(
      req.params.id,
      { caption, category, updatedAt: new Date() },
      { new: true }
    );
    res.json(image);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({ message: 'Error updating image' });
  }
});

// Delete gallery image (admin only)
router.delete('/gallery/:id', async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    
    // Delete from Cloudinary if cloudinaryId exists
    if (image && image.cloudinaryId) {
      await cloudinary.uploader.destroy(image.cloudinaryId);
    }

    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router;
