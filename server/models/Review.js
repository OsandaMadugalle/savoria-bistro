const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  author: String,
  rating: Number,
  text: String,
  date: String
});

module.exports = mongoose.model('Review', reviewSchema);