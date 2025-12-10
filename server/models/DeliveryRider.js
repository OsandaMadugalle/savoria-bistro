const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deliveryRiderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'rider'
  },
  vehicleType: {
    type: String,
    enum: ['Bike', 'Scooter', 'Car', 'Bicycle'],
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['Available', 'On Delivery', 'Offline'],
    default: 'Available'
  },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  assignedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  totalDeliveries: {
    type: Number,
    default: 0
  },
  completedDeliveries: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  earnings: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshTokens: [String],
  lastLogin: Date
}, { 
  timestamps: true 
});

// Hash password before saving
deliveryRiderSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Index for faster queries
deliveryRiderSchema.index({ status: 1, isActive: 1 });

// Method to calculate average rating
deliveryRiderSchema.methods.updateRating = function(newRating) {
  const totalRatings = this.completedDeliveries || 1;
  this.rating = ((this.rating * (totalRatings - 1)) + newRating) / totalRatings;
  return this.save();
};

// Method to mark rider as available
deliveryRiderSchema.methods.setAvailable = function() {
  this.status = 'Available';
  return this.save();
};

// Method to mark rider as on delivery
deliveryRiderSchema.methods.setOnDelivery = function() {
  this.status = 'On Delivery';
  return this.save();
};

const DeliveryRider = mongoose.model('DeliveryRider', deliveryRiderSchema);

module.exports = DeliveryRider;
