const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  maxTableCapacity: { type: Number, default: 50 },
  depositAmount: { type: Number, default: 2500 }, // in cents
  reservationDuration: { type: Number, default: 120 }, // in minutes
  cancellationHours: { type: Number, default: 2 }, // hours before reservation
  operatingHoursOpen: { type: String, default: '11:00' },
  operatingHoursClose: { type: String, default: '22:00' },
  restDaysOpen: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: String
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
