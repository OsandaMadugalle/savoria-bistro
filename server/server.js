require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Models for Seeding
const MenuItem = require('./models/MenuItem');

// Import Routes
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const reservationRoutes = require('./routes/reservations');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const galleryRoutes = require('./routes/gallery');
const newsletterRoutes = require('./routes/newsletter');
const paymentRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', galleryRoutes);
app.use('/api', newsletterRoutes);
app.use('/api/payments', paymentRoutes);


// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/savoria')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // No seeding of mock data
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));