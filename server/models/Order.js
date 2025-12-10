const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    itemId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: { 
    type: String, 
    enum: ['Confirmed', 'Preparing', 'Quality Check', 'Packing', 'Packed & Ready', 'Assigned', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'], 
    default: 'Confirmed' 
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'cod'],
    default: 'stripe'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Paid'
  },
  deliveryAddress: {
    street: String,
    city: String,
    postalCode: String,
    phone: String,
    notes: String
  },
  assignedRider: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DeliveryRider' 
  },
  assignedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  deliveryProof: String, // URL to proof of delivery photo
  deliveryNotes: String,
  estimatedDeliveryTime: Date,
  hasFeedback: { type: Boolean, default: false },
  feedbackSubmittedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);