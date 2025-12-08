const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  description: String,
  price: Number,
  category: { type: String, enum: ['Starter', 'Main', 'Dessert', 'Drink'] },
  image: String,
  cloudinaryId: String,
  tags: [String],
  ingredients: [String],
  dietary: [String],
  calories: Number,
  prepTime: Number,
  featured: { type: Boolean, default: false },
  // Stock tracking fields
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5, min: 0 },
  isAvailable: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 }
}, { timestamps: true });

menuItemSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('MenuItem', menuItemSchema);