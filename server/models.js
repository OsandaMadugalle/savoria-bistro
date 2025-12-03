const mongoose = require('mongoose');

// --- Menu Item Schema ---
const menuItemSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // Keeping string ID to match frontend mock
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

// --- User Schema ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  loyaltyPoints: { type: Number, default: 0 },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold'], default: 'Bronze' },
  memberSince: { type: String, default: () => new Date().getFullYear().toString() },
  history: [{
    orderId: String,
    date: String,
    items: [String],
    total: Number,
    status: String
  }]
});

// --- Order Schema ---
const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional
  items: [{
    itemId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: { type: String, enum: ['Confirmed', 'Preparing', 'Quality Check', 'Ready', 'Delivered'], default: 'Confirmed' },
  createdAt: { type: Date, default: Date.now }
});

// --- Reservation Schema ---
const reservationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  date: String,
  time: String,
  guests: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// --- Review Schema ---
const reviewSchema = new mongoose.Schema({
  author: String,
  rating: Number,
  text: String,
  date: String
});

module.exports = {
  MenuItem: mongoose.model('MenuItem', menuItemSchema),
  User: mongoose.model('User', userSchema),
  Order: mongoose.model('Order', orderSchema),
  Reservation: mongoose.model('Reservation', reservationSchema),
  Review: mongoose.model('Review', reviewSchema)
};