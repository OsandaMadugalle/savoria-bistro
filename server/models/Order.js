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
  status: { type: String, enum: ['Confirmed', 'Preparing', 'Quality Check', 'Ready', 'Delivered'], default: 'Confirmed' },
  hasFeedback: { type: Boolean, default: false },
  feedbackSubmittedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);