const mongoose = require('mongoose');

const reservationPaymentSchema = new mongoose.Schema({
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true, unique: true },
  userId: String,
  confirmationCode: String,
  amount: { type: Number, required: true }, // Deposit amount in cents
  currency: { type: String, default: 'usd' },
  paymentMethod: { type: String, enum: ['credit_card', 'debit_card', 'cash_at_restaurant'], default: 'credit_card' },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded', 'unpaid'], 
    default: 'pending'
  },
  stripePaymentIntentId: String,
  stripeCustomerId: String,
  last4Digits: String, // Last 4 digits of card
  cardBrand: String, // e.g., 'visa', 'mastercard'
  transactionId: String,
  refundId: String,
  refundReason: String,
  refundedAt: Date,
  paidAt: Date,
  failureReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reservationPaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ReservationPayment', reservationPaymentSchema);
