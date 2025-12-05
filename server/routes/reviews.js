const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_secret'
});

// Get all approved reviews (for customers)
router.get('/approved', async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all reviews (for admin)
router.get('/all', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending reviews (for admin moderation)
router.get('/pending', async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's reviews
router.get('/user/:userEmail', async (req, res) => {
  try {
    const reviews = await Review.find({ userEmail: req.params.userEmail }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new review
router.post('/', async (req, res) => {
  try {
    const { image, ...reviewData } = req.body;
    let imageUrl = '';
    let cloudinaryId = '';

    // Upload image to Cloudinary if provided
    if (image) {
      try {
        const result = await cloudinary.uploader.upload(image, {
          folder: 'savoria-bistro/reviews',
          resource_type: 'auto',
          public_id: `review-${Date.now()}`
        });
        imageUrl = result.secure_url;
        cloudinaryId = result.public_id;
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        // Continue without image if upload fails
      }
    }

    const review = new Review({
      ...reviewData,
      image: imageUrl,
      cloudinaryId: cloudinaryId
    });
    
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update review status (approve/reject - admin only)
router.put('/:id/status', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    review.status = req.body.status;
    review.adminNotes = req.body.adminNotes || '';
    review.updatedAt = new Date();
    
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a review (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    // Delete from Cloudinary if image exists
    if (review.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(review.cloudinaryId);
      } catch (deleteErr) {
        console.error('Cloudinary deletion error:', deleteErr);
        // Continue even if deletion fails
      }
    }
    
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;