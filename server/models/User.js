const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  address: String,
  birthday: String,
  favoriteCuisine: String,
  dietaryRestrictions: String,
  preferredDiningTime: String,
  specialRequests: String,
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

// Pre-save hook to remove customer fields from non-customer users
userSchema.pre('save', function(next) {
  if (['admin', 'staff', 'masterAdmin'].includes(this.role)) {
    // Remove customer-specific fields for non-customer roles
    this.loyaltyPoints = undefined;
    this.tier = undefined;
    this.memberSince = undefined;
    this.history = undefined;
    this.address = undefined;
    this.birthday = undefined;
    this.favoriteCuisine = undefined;
    this.dietaryRestrictions = undefined;
    this.preferredDiningTime = undefined;
    this.specialRequests = undefined;
  }
  next();
});

// Pre-update hook for findOneAndUpdate operations
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update && update.$set && update.role && ['admin', 'staff', 'masterAdmin'].includes(update.$set.role)) {
    // Remove customer-specific fields for non-customer roles
    update.$set.loyaltyPoints = undefined;
    update.$set.tier = undefined;
    update.$set.memberSince = undefined;
    update.$set.history = undefined;
  }
  next();
});

// Pre-update hook for findByIdAndUpdate operations
userSchema.pre('findByIdAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update && update.$set && update.role && ['admin', 'staff', 'masterAdmin'].includes(update.$set.role)) {
    // Remove customer-specific fields for non-customer roles
    update.$set.loyaltyPoints = undefined;
    update.$set.tier = undefined;
    update.$set.memberSince = undefined;
    update.$set.history = undefined;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);