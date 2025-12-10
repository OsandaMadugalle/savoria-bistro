const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['admin', 'masterAdmin'], default: 'admin' },
  permissions: {
    manageMenu: { type: Boolean, default: true },
    viewOrders: { type: Boolean, default: true },
    manageUsers: { type: Boolean, default: true },
    manageReservations: { type: Boolean, default: true },
    viewReports: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  refreshTokens: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Admin', adminSchema);
