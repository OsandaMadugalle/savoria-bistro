require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Models for Seeding
const MenuItem = require('./models/MenuItem');
const Promo = require('./models/Promo');

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
const settingsRoutes = require('./routes/settings');
const promoRoutes = require('./routes/promos');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Allow Vercel frontend and localhost
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://savoria-bistro.vercel.app',
      process.env.CLIENT_URL
    ].filter(Boolean); // Remove undefined/null values
    
    // Always allow if no origin (same-origin requests)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    
    // In development or if origin matches Vercel pattern, allow it
    if (process.env.NODE_ENV !== 'production' || origin.includes('vercel.app')) {
      callback(null, true);
      return;
    }
    
    console.warn(`CORS blocked request from: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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

// Explicit preflight handling
app.options('*', cors(corsOptions));

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
app.use('/api/settings', settingsRoutes);
app.use('/api/promos', promoRoutes);

// Health check endpoint for deployment
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Savoria Bistro API', version: '1.0.0', status: 'running' });
});
// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/savoria')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Seed default promo if none exists
    try {
      const existingPromos = await Promo.countDocuments();
      if (existingPromos === 0) {
        const defaultPromo = new Promo({
          code: 'SAVE10',
          discount: 10,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          active: true
        });
        await defaultPromo.save();
        console.log('✅ Default promo code created: SAVE10 (10% off)');
      }
    } catch (err) {
      console.error('Promo seeding error (non-critical):', err.message);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));