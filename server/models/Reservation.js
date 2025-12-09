const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  date: String,
  time: String,
  guests: Number,
  notes: String,
  status: { type: String, default: 'Pending', enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'] },
  confirmationCode: { type: String, unique: true, sparse: true },
  tableNumber: { type: String, default: null }, // Assigned by staff
  duration: { type: Number, default: 120 }, // Table duration in minutes (default 2 hours)
  userId: String, // Link to user
  paymentRequired: { type: Boolean, default: true }, // Whether this reservation requires a deposit
  depositAmount: { type: Number, default: 2500 }, // Deposit in cents ($25.00 default)
  paymentStatus: { type: String, enum: ['unpaid', 'pending', 'completed', 'failed', 'refunded'], default: 'unpaid' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } // Auto-expiry for pending reservations
});

// Index for expiring old pending reservations
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

module.exports = mongoose.model('Reservation', reservationSchema);