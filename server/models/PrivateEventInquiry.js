const mongoose = require('mongoose');

const privateEventInquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['wedding', 'birthday', 'corporate', 'anniversary', 'other'],
    default: 'other'
  },
  guestCount: { type: Number, min: 0 },
  eventDate: Date,
  message: String,
  status: {
    type: String,
    enum: ['new', 'contacted'],
    default: 'new'
  }
}, { timestamps: true });

privateEventInquirySchema.add({
  contactHistory: [
    {
      staffName: String,
      subject: String,
      body: String,
      sentAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('PrivateEventInquiry', privateEventInquirySchema);
