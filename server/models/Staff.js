const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: 'staff' },
  permissions: {
    manageMenu: { type: Boolean, default: false },
    viewOrders: { type: Boolean, default: true },
    manageUsers: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  shift: { type: String, enum: ['Morning', 'Evening', 'Night'], default: 'Morning' },
  position: { type: String, default: 'Server' },
  lastLogin: { type: Date },
  refreshTokens: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
