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
const privateEventRoutes = require('./routes/privateEvents');
const stockRoutes = require('./routes/stock');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Restrict to specific domain(s)
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.CLIENT_URL || 'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      // Allow all origins in development
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Rate Limiting Configuration
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production', // Skip in development
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', galleryRoutes);
app.use('/api', newsletterRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/private-events', privateEventRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/feedback', feedbackRoutes);


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