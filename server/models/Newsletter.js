const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String },
  subscribedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  unsubscribedAt: { type: Date }
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
