const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  currentStock: { type: Number, required: true },
  lowStockThreshold: { type: Number, required: true },
  alertType: { type: String, enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'BACK_IN_STOCK'], required: true },
  isActive: { type: Boolean, default: true },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: String },
  acknowledgedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockAlert', stockAlertSchema);
