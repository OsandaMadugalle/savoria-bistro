const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  description: String,
  price: Number,
  category: { type: String, enum: ['Starter', 'Main', 'Dessert', 'Drink'] },
  image: String,
  tags: [String],
  ingredients: [String],
  calories: Number,
  prepTime: Number
});

module.exports = mongoose.model('MenuItem', menuItemSchema);