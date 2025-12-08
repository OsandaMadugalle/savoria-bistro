const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

async function removeCustomerFieldsFromStaff() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/savoria');
    console.log('✅ Connected to MongoDB');

    // Update all non-customer users to remove customer-related fields
    const result = await User.updateMany(
      { role: { $in: ['admin', 'staff', 'masterAdmin'] } },
      {
        $unset: {
          loyaltyPoints: '',
          tier: '',
          memberSince: '',
          history: '',
          address: '',
          birthday: '',
          favoriteCuisine: '',
          dietaryRestrictions: '',
          preferredDiningTime: '',
          specialRequests: ''
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} staff/admin records`);
    console.log('Customer fields removed from admin, staff, and masterAdmin users');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
}

removeCustomerFieldsFromStaff();
