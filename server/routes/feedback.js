const express = require('express');
const router = express.Router();
const OrderFeedback = require('../models/OrderFeedback');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const { logActivity } = require('./auth');

// Helper: Check if user is admin
const checkAdminPermission = async (requesterEmail) => {
  if (!requesterEmail) return false;
  const user = await User.findOne({ email: requesterEmail });
  return user && (user.role === 'admin' || user.role === 'masterAdmin');
};

// Submit or update order feedback
router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      userId,
      overallRating,
      items,
      serviceRating,
      deliveryRating,
      comment,
      wouldRecommend,
      improvementSuggestions
    } = req.body;

    // Validate required fields
    if (!orderId || !userId || !overallRating) {
      return res.status(400).json({
        message: 'Missing required fields: orderId, userId, overallRating'
      });
    }

    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ message: 'Overall rating must be between 1 and 5' });
    }

    // Verify order exists and belongs to user
    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or does not belong to user' });
    }

    // Check if feedback already exists
    let feedback = await OrderFeedback.findOne({ orderId });

    if (feedback) {
      // Update existing feedback
      feedback.overallRating = overallRating;
      feedback.items = items || feedback.items;
      feedback.serviceRating = serviceRating || feedback.serviceRating;
      feedback.deliveryRating = deliveryRating || feedback.deliveryRating;
      feedback.comment = comment || feedback.comment;
      feedback.wouldRecommend = wouldRecommend !== undefined ? wouldRecommend : feedback.wouldRecommend;
      feedback.improvementSuggestions = improvementSuggestions || feedback.improvementSuggestions;
      feedback.updatedAt = new Date();
    } else {
      // Create new feedback
      feedback = new OrderFeedback({
        orderId,
        userId,
        overallRating,
        items: items || [],
        serviceRating: serviceRating || null,
        deliveryRating: deliveryRating || null,
        comment: comment || '',
        wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
        improvementSuggestions: improvementSuggestions || ''
      });
    }

    await feedback.save();

    // Update item ratings if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.itemId && item.itemRating) {
          const menuItem = await MenuItem.findOne({ id: item.itemId });
          if (menuItem) {
            // Update running average
            const newTotal = menuItem.totalRatings + 1;
            const newAverage =
              (menuItem.averageRating * menuItem.totalRatings + item.itemRating) / newTotal;

            await MenuItem.findByIdAndUpdate(menuItem._id, {
              averageRating: parseFloat(newAverage.toFixed(2)),
              totalRatings: newTotal
            });
          }
        }
      }
    }

    // Mark order as having feedback
    if (!order.hasFeedback) {
      await Order.findByIdAndUpdate(order._id, {
        hasFeedback: true,
        feedbackSubmittedAt: new Date()
      });
    }

    // Log activity
    const user = await User.findById(userId);
    if (user) {
      await logActivity(
        user.email,
        'Submit Order Feedback',
        `Order ${orderId}: ${overallRating}★ rating${wouldRecommend ? ' - Would recommend' : ''}`
      );
    }

    res.status(feedback._id ? 200 : 201).json({
      message: 'Feedback submitted successfully',
      feedback,
      itemsRated: items?.filter(i => i.itemRating).length || 0
    });
  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get feedback for an order
router.get('/order/:orderId', async (req, res) => {
  try {
    const feedback = await OrderFeedback.findOne({ orderId: req.params.orderId });
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's feedback history
router.get('/user/:userId', async (req, res) => {
  try {
    const feedbacks = await OrderFeedback.find({ userId: req.params.userId }).sort({
      createdAt: -1
    });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all feedback (admin only)
router.get('/', async (req, res) => {
  try {
    const { requesterEmail, limit = 50, skip = 0 } = req.query;
    const isAdmin = await checkAdminPermission(requesterEmail);

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin permission required' });
    }

    const feedbacks = await OrderFeedback.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await OrderFeedback.countDocuments();

    res.json({
      feedbacks,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get feedback statistics (admin only)
router.get('/stats/summary', async (req, res) => {
  try {
    const { requesterEmail, requesterRole } = req.query;
    let isAdmin = false;
    if (requesterRole === 'admin' || requesterRole === 'masterAdmin') {
      isAdmin = true;
    } else {
      isAdmin = await checkAdminPermission(requesterEmail);
    }
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin permission required' });
    }

    const allFeedback = await OrderFeedback.find();

    const totalFeedback = allFeedback.length;
    const averageRating =
      totalFeedback > 0
        ? parseFloat(
            (
              allFeedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback
            ).toFixed(2)
          )
        : 0;

    const ratingDistribution = {
      '5': allFeedback.filter(f => f.overallRating === 5).length,
      '4': allFeedback.filter(f => f.overallRating === 4).length,
      '3': allFeedback.filter(f => f.overallRating === 3).length,
      '2': allFeedback.filter(f => f.overallRating === 2).length,
      '1': allFeedback.filter(f => f.overallRating === 1).length
    };

    const wouldRecommendCount = allFeedback.filter(f => f.wouldRecommend).length;
    const recommendationRate = totalFeedback > 0
      ? parseFloat(((wouldRecommendCount / totalFeedback) * 100).toFixed(2))
      : 0;

    // Top rated items
    const topItems = await MenuItem.find()
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(10);

    // Low rated items
    const lowItems = await MenuItem.find({ totalRatings: { $gt: 0 } })
      .sort({ averageRating: 1 })
      .limit(10);

    res.json({
      totalFeedback,
      averageRating,
      ratingDistribution,
      wouldRecommendCount,
      recommendationRate,
      topRatedItems: topItems.map(item => ({
        id: item.id,
        name: item.name,
        rating: item.averageRating,
        totalRatings: item.totalRatings
      })),
      needsAttention: lowItems
        .filter(item => item.totalRatings >= 3) // Only items with 3+ ratings
        .map(item => ({
          id: item.id,
          name: item.name,
          rating: item.averageRating,
          totalRatings: item.totalRatings
        }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get feedback for a specific menu item
router.get('/item/:itemId/feedback', async (req, res) => {
  try {
    const feedbacks = await OrderFeedback.find({
      'items.itemId': req.params.itemId
    });

    const itemFeedback = feedbacks
      .map(f => f.items.find(i => i.itemId === req.params.itemId))
      .filter(Boolean);

    const averageRating = itemFeedback.length > 0
      ? parseFloat(
          (
            itemFeedback.reduce((sum, item) => sum + (item.itemRating || 0), 0) /
            itemFeedback.length
          ).toFixed(2)
        )
      : 0;

    res.json({
      itemId: req.params.itemId,
      totalFeedback: itemFeedback.length,
      averageRating,
      feedback: itemFeedback
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete feedback (admin only)
router.delete('/:feedbackId', async (req, res) => {
  try {
    const { requesterEmail } = req.body;
    const isAdmin = await checkAdminPermission(requesterEmail);

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin permission required' });
    }

    const feedback = await OrderFeedback.findByIdAndDelete(req.params.feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await logActivity(requesterEmail, 'Delete Feedback', `Removed feedback for order ${feedback.orderId}`);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
