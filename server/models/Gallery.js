const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  caption: { type: String, required: true },
  category: { type: String, required: true },
  src: { type: String, required: true }, // Cloudinary URL
  cloudinaryId: { type: String }, // Cloudinary public_id for deletion
  uploadedBy: { type: String, required: true }, // user email
  uploadedByName: { type: String, required: true }, // user name
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', gallerySchema);
