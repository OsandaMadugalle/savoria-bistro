const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  description: String,
  price: Number,
  category: { type: String, enum: ['Starter', 'Main', 'Dessert', 'Drink'] },
  image: String,
  tags: [String],
  ingredients: [String],
  calories: Number,
  prepTime: Number,
  featured: { type: Boolean, default: false }
}, { timestamps: true });

menuItemSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('MenuItem', menuItemSchema);