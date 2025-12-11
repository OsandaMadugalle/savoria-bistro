const express = require('express');
const router = express.Router();
const DeliveryRider = require('../models/DeliveryRider');
const Order = require('../models/Order');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');

// JWT Authentication Middleware
function requireRole(roles, allowQuery = false) {
  return async (req, res, next) => {
    // Try JWT token first
    const authHeader = req.headers['authorization'];
    // console.log('Auth header:', authHeader); // Debug log
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'savoria-secret-key-change-in-production');
        // console.log('Decoded token:', decoded); // Debug log
        if (!roles.includes(decoded.role)) {
          // console.log('Role not allowed:', decoded.role, 'Required:', roles); // Debug log
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
        req.user = decoded;
        return next();
      } catch (err) {
        // console.log('Token verification error:', err.message); // Debug log
        return res.status(403).json({ message: 'Invalid token' });
      }
    }
    
    // console.log('No bearer token, checking fallback'); // Debug log
    // Fallback to email-based check for backward compatibility
    let requesterEmail;
    if (allowQuery && req.method === 'GET') {
      requesterEmail = req.query.requesterEmail;
    } else {
      requesterEmail = req.body.requesterEmail;
    }
    
    if (!requesterEmail) return res.status(403).json({ message: 'Authentication required' });
    
    const user = await User.findOne({ email: requesterEmail });
    if (!user) return res.status(403).json({ message: 'User not found' });
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    req.user = { userId: user._id, email: user.email, role: user.role };
    next();
  };
}

// CREATE: Register a new delivery rider
router.post('/riders', requireRole(['admin', 'masterAdmin', 'deliveryManager']), async (req, res) => {
  try {
    const { name, phone, email, vehicleType, vehicleNumber, password } = req.body;

    // Create rider profile
    const rider = new DeliveryRider({
      name,
      phone,
      email,
      vehicleType,
      vehicleNumber,
      password // Password will be hashed by pre-save hook
    });

    await rider.save();

    // Log activity
    await ActivityLog.create({
      userEmail: req.user.email,
      action: 'CREATE_RIDER',
      details: `Created delivery rider: ${name}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Delivery rider registered successfully',
      rider: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        vehicleType: rider.vehicleType,
        vehicleNumber: rider.vehicleNumber,
        status: rider.status
      }
    });
  } catch (error) {
    console.error('Error creating rider:', error);
    res.status(500).json({ error: error.message });
  }
});

// READ: Get all delivery riders
router.get('/riders', requireRole(['admin', 'masterAdmin', 'deliveryManager']), async (req, res) => {
  try {
    // console.log('📋 GET /riders - Request received');
    // console.log('User:', req.user);
    // console.log('Query:', req.query);
    
    const { status, isActive } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // console.log('Filter:', filter);
    const riders = await DeliveryRider.find(filter)
      .populate('assignedOrders', 'orderId status')
      .sort({ createdAt: -1 });

    // console.log('✅ Found riders:', riders.length);
    res.json(riders);
  } catch (error) {
    console.error('❌ Error fetching riders:', error);
    res.status(500).json({ error: error.message });
  }
});

// READ: Get available riders
router.get('/riders/available', requireRole(['admin', 'masterAdmin', 'deliveryManager']), async (req, res) => {
  try {
    const availableRiders = await DeliveryRider.find({
      status: 'Available',
      isActive: true
    })
    .sort({ totalDeliveries: 1 }); // Prioritize riders with fewer deliveries

    res.json(availableRiders);
  } catch (error) {
    console.error('Error fetching available riders:', error);
    res.status(500).json({ error: error.message });
  }
});

// READ: Get rider by ID
router.get('/riders/:id', requireRole(['admin', 'masterAdmin', 'deliveryManager']), async (req, res) => {
  try {
    const rider = await DeliveryRider.findById(req.params.id)
      .populate('assignedOrders');

    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    res.json(rider);
  } catch (error) {
    console.error('Error fetching rider:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE: Update rider details
router.put('/riders/:id', requireRole(['admin', 'masterAdmin', 'deliveryManager']), async (req, res) => {
  try {
    const { name, phone, vehicleType, vehicleNumber, status, isActive } = req.body;
    
    const rider = await DeliveryRider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    if (name) rider.name = name;
    if (phone) rider.phone = phone;
    if (vehicleType) rider.vehicleType = vehicleType;
    if (vehicleNumber) rider.vehicleNumber = vehicleNumber;
    if (status) rider.status = status;
    if (isActive !== undefined) rider.isActive = isActive;

    await rider.save();

    await ActivityLog.create({
      userEmail: req.user.email,
      action: 'UPDATE_RIDER',
      details: `Updated rider: ${rider.name}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Rider updated successfully', rider });
  } catch (error) {
    console.error('Error updating rider:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Delete/deactivate rider
router.delete('/riders/:id', requireRole(['admin', 'masterAdmin', 'deliveryManager']), async (req, res) => {
  try {
    const rider = await DeliveryRider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    // Soft delete - just deactivate
    rider.isActive = false;
    rider.status = 'Offline';
    await rider.save();

    await ActivityLog.create({
      userEmail: req.user.email,
      action: 'DEACTIVATE_RIDER',
      details: `Deactivated rider: ${rider.name}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Rider deactivated successfully' });
  } catch (error) {
    console.error('Error deleting rider:', error);
    res.status(500).json({ error: error.message });
  }
});

// ASSIGN: Assign rider to order
router.put('/assign/:orderId', requireRole(['admin', 'masterAdmin', 'deliveryManager']), async (req, res) => {
  try {
    const { riderId, estimatedDeliveryTime } = req.body;
    
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const rider = await DeliveryRider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    if (rider.status !== 'Available') {
      return res.status(400).json({ error: 'Rider is not available' });
    }

    // Update order
    order.assignedRider = riderId;
    order.assignedAt = new Date();
    order.status = 'Assigned';
    if (estimatedDeliveryTime) {
      order.estimatedDeliveryTime = estimatedDeliveryTime;
    }
    await order.save();

    // Update rider
    rider.assignedOrders.push(order._id);
    rider.status = 'On Delivery';
    rider.totalDeliveries += 1;
    await rider.save();

    await ActivityLog.create({
      userEmail: req.user.email,
      action: 'ASSIGN_DELIVERY',
      details: `Assigned order ${order.orderId} to rider ${rider.name}`,
      ipAddress: req.ip
    });

    res.json({ 
      message: 'Rider assigned successfully',
      order: {
        orderId: order.orderId,
        status: order.status,
        assignedRider: rider.name
      }
    });
  } catch (error) {
    console.error('Error assigning rider:', error);
    res.status(500).json({ error: error.message });
  }
});

// PICKUP: Mark order as picked up by rider
router.put('/pickup/:orderId', requireRole(['rider', 'admin', 'masterAdmin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('assignedRider');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only restrict pickup to assigned rider if role is 'rider'
    if (req.user.role === 'rider') {
      const rider = await DeliveryRider.findById(req.user.userId);
      if (!rider || !order.assignedRider || rider._id.toString() !== order.assignedRider._id.toString()) {
        return res.status(403).json({ error: 'This order is not assigned to you' });
      }
    }
    // If role is admin or masterAdmin, allow pickup for any order

    order.pickedUpAt = new Date();
    order.status = 'Picked Up';
    await order.save();

    await ActivityLog.create({
      userEmail: req.user.email,
      action: 'PICKUP_ORDER',
      details: `Order ${order.orderId} picked up`,
      ipAddress: req.ip
    });

    res.json({ message: 'Order marked as picked up', order });
  } catch (error) {
    console.error('Error marking pickup:', error);
    res.status(500).json({ error: error.message });
  }
});

// OUT FOR DELIVERY: Mark order as out for delivery (rider en route)
router.put('/out-for-delivery/:orderId', requireRole(['rider', 'admin', 'masterAdmin']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('assignedRider');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify rider is the one assigned
    if (req.user.role === 'rider') {
      const rider = await DeliveryRider.findById(req.user.userId);
      if (!rider || !order.assignedRider || rider._id.toString() !== order.assignedRider._id.toString()) {
        return res.status(403).json({ error: 'This order is not assigned to you' });
      }
    }

    if (order.status !== 'Picked Up') {
      return res.status(400).json({ error: 'Order must be picked up first' });
    }

    order.status = 'Out for Delivery';
    await order.save();

    await ActivityLog.create({
      userEmail: req.user.email,
      action: 'OUT_FOR_DELIVERY',
      details: `Order ${order.orderId} is out for delivery`,
      ipAddress: req.ip
    });

    res.json({ message: 'Order marked as out for delivery', order });
  } catch (error) {
    console.error('Error marking out for delivery:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELIVER: Mark order as delivered
router.put('/deliver/:orderId', requireRole(['rider', 'admin', 'masterAdmin']), async (req, res) => {
  try {
    const { deliveryProof, deliveryNotes, rating, codAmount } = req.body;
    
    const order = await Order.findById(req.params.orderId)
      .populate('assignedRider');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify rider is the one assigned
    if (req.user.role === 'rider') {
      const rider = await DeliveryRider.findById(req.user.userId);
      if (!rider || !order.assignedRider || rider._id.toString() !== order.assignedRider._id.toString()) {
        return res.status(403).json({ error: 'This order is not assigned to you' });
      }
    }

    // Handle COD payment
    if (order.paymentMethod === 'cod') {
      if (!codAmount || codAmount < order.total) {
        return res.status(400).json({ error: 'COD amount must be provided and match order total' });
      }
      order.paymentStatus = 'Paid';
      order.codAmount = codAmount;
    }

    // Update order
    order.status = 'Delivered';
    order.deliveredAt = new Date();
    if (deliveryProof) order.deliveryProof = deliveryProof;
    if (deliveryNotes) order.deliveryNotes = deliveryNotes;
    await order.save();

    // Update rider
    const rider = await DeliveryRider.findById(order.assignedRider._id);
    if (rider) {
      rider.assignedOrders = rider.assignedOrders.filter(
        id => id.toString() !== order._id.toString()
      );
      rider.completedDeliveries += 1;
      rider.status = 'Available';
      rider.earnings += Math.floor(order.total * 0.1); // 10% commission
      
      if (rating) {
        await rider.updateRating(rating);
      }
      
      await rider.save();
    }

    await ActivityLog.create({
      userEmail: req.user.email,
      action: 'DELIVER_ORDER',
      details: `Order ${order.orderId} delivered`,
      ipAddress: req.ip
    });

    res.json({ message: 'Order marked as delivered', order });
  } catch (error) {
    console.error('Error marking delivery:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Delivery statistics
router.get('/stats', requireRole(['admin', 'masterAdmin', 'deliveryManager']), async (req, res) => {
  try {
    const totalRiders = await DeliveryRider.countDocuments({ isActive: true });
    const availableRiders = await DeliveryRider.countDocuments({ status: 'Available', isActive: true });
    const onDeliveryRiders = await DeliveryRider.countDocuments({ status: 'On Delivery', isActive: true });
    
    const pendingDeliveries = await Order.countDocuments({ 
      status: { $in: ['Packed & Ready'] }
    });
    
    const outForDelivery = await Order.countDocuments({ 
      status: 'Out for Delivery'
    });

    const completedToday = await Order.countDocuments({
      status: 'Delivered',
      deliveredAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    const topRiders = await DeliveryRider.find({ isActive: true })
      .sort({ completedDeliveries: -1, rating: -1 })
      .limit(5)
      .select('name completedDeliveries rating earnings');

    res.json({
      riders: {
        total: totalRiders,
        available: availableRiders,
        onDelivery: onDeliveryRiders
      },
      deliveries: {
        pending: pendingDeliveries,
        outForDelivery,
        completedToday
      },
      topRiders
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Rider's own deliveries (for rider app)
router.get('/my-deliveries', requireRole(['rider']), async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const rider = await DeliveryRider.findById(req.user._id);
    if (!rider) {
      return res.status(404).json({ error: 'Rider profile not found' });
    }

    const activeDeliveries = await Order.find({
      assignedRider: rider._id,
      status: { $in: ['Out for Delivery'] }
    }).populate('userId', 'name phone');

    const completedDeliveries = await Order.find({
      assignedRider: rider._id,
      status: 'Delivered'
    }).sort({ deliveredAt: -1 }).limit(20);

    res.json({
      rider: {
        name: rider.name,
        status: rider.status,
        totalDeliveries: rider.totalDeliveries,
        completedDeliveries: rider.completedDeliveries,
        rating: rider.rating,
        earnings: rider.earnings
      },
      activeDeliveries,
      recentCompletedDeliveries: completedDeliveries
    });
  } catch (error) {
    console.error('Error fetching rider deliveries:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE: Update rider location (for live tracking)
router.put('/location', requireRole(['rider']), async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { lat, lng } = req.body;
    
    const rider = await DeliveryRider.findById(req.user._id);
    if (!rider) {
      return res.status(404).json({ error: 'Rider profile not found' });
    }

    rider.currentLocation = { lat, lng };
    await rider.save();

    res.json({ message: 'Location updated', location: rider.currentLocation });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
