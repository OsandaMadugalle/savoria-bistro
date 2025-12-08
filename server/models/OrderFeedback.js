const mongoose = require('mongoose');

const orderFeedbackSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  items: [{
    itemId: String,
    itemName: String,
    quantity: Number,
    itemRating: { type: Number, min: 1, max: 5 },
    comment: String
  }],
  serviceRating: { type: Number, min: 1, max: 5 },
  deliveryRating: { type: Number, min: 1, max: 5 },
  comment: String,
  wouldRecommend: { type: Boolean, default: true },
  improvementSuggestions: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrderFeedback', orderFeedbackSchema);
