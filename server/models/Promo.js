const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true 
  },
  discount: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

promoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if promo is currently valid
promoSchema.methods.isValid = function() {
  return this.active && new Date() <= this.expiryDate;
};

module.exports = mongoose.model('Promo', promoSchema);
