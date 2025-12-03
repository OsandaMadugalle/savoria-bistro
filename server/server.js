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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);

// Mock Data for Seeding
const MOCK_MENU = [
  {
    id: 's1', name: 'Truffle Arancini', description: 'Crispy risotto balls infused with black truffle, served with garlic aioli.', price: 14, category: 'Starter', image: 'https://picsum.photos/400/300?random=1', tags: ['Vegetarian'], ingredients: ['Arborio Rice', 'Black Truffle', 'Parmesan'], calories: 420, prepTime: 15
  },
  {
    id: 'm1', name: 'Wagyu Beef Burger', description: 'Premium Wagyu patty, aged cheddar, caramelized onions, brioche bun.', price: 24, category: 'Main', image: 'https://picsum.photos/400/300?random=3', tags: [], ingredients: ['Wagyu Beef', 'Aged Cheddar', 'Brioche Bun'], calories: 850, prepTime: 25
  },
  {
    id: 'd1', name: 'Dark Chocolate Fondant', description: 'Molten center chocolate cake served with vanilla bean ice cream.', price: 12, category: 'Dessert', image: 'https://picsum.photos/400/300?random=6', tags: ['Vegetarian'], ingredients: ['Dark Chocolate', 'Butter', 'Eggs'], calories: 520, prepTime: 20
  }
];

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/savoria')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Seed Data if empty
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log('Seeding initial menu data...');
      await MenuItem.insertMany(MOCK_MENU);
      console.log('✅ Data seeded');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));