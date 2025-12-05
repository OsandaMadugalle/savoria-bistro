const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  loyaltyPoints: { type: Number, default: 0 },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold'], default: 'Bronze' },
  role: { type: String, enum: ['customer', 'staff', 'admin', 'masterAdmin'], default: 'customer' },
  memberSince: { type: String, default: () => new Date().getFullYear().toString() },
  history: [{
    orderId: String,
    date: String,
    items: [String],
    total: Number,
    status: String
  }],
  permissions: {
    manageMenu: { type: Boolean, default: false },
    viewOrders: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('User', userSchema);