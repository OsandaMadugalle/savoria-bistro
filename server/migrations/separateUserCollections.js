/**
 * Migration Script: Separate Admin, Staff, and Riders into dedicated collections
 * 
 * This script moves:
 * - Admins (role: admin, masterAdmin) from User → Admin collection
 * - Staff (role: staff) from User → Staff collection  
 * - Riders (role: rider) from User → DeliveryRider collection
 * - Keeps Customers (role: customer) in User collection
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const DeliveryRider = require('../models/DeliveryRider');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/savoria-bistro';

async function migrateUsersToSeparateCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let migratedCount = 0;

    // 1. Migrate Admins (admin and masterAdmin roles)
    const admins = await User.find({ role: { $in: ['admin', 'masterAdmin'] } });
    console.log(`\n📋 Found ${admins.length} admin(s) to migrate`);
    
    for (const user of admins) {
      const existingAdmin = await Admin.findOne({ email: user.email });
      if (!existingAdmin) {
        await Admin.create({
          name: user.name,
          email: user.email,
          password: user.password, // Already hashed
          phone: user.phone,
          role: user.role,
          permissions: user.permissions || {
            manageMenu: true,
            viewOrders: true,
            manageUsers: true,
            manageReservations: true,
            viewReports: true
          },
          isActive: true,
          refreshTokens: user.refreshTokens || [],
          createdAt: user.createdAt || new Date(),
          updatedAt: new Date()
        });
        console.log(`  ✅ Migrated admin: ${user.email}`);
        migratedCount++;
      } else {
        console.log(`  ⏭️  Admin already exists: ${user.email}`);
      }
    }

    // 2. Migrate Staff
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`\n📋 Found ${staffUsers.length} staff member(s) to migrate`);
    
    for (const user of staffUsers) {
      const existingStaff = await Staff.findOne({ email: user.email });
      if (!existingStaff) {
        await Staff.create({
          name: user.name,
          email: user.email,
          password: user.password, // Already hashed
          phone: user.phone,
          role: 'staff',
          permissions: user.permissions || {
            manageMenu: false,
            viewOrders: true,
            manageUsers: false
          },
          isActive: true,
          shift: 'Morning',
          position: 'Server',
          refreshTokens: user.refreshTokens || [],
          createdAt: user.createdAt || new Date(),
          updatedAt: new Date()
        });
        console.log(`  ✅ Migrated staff: ${user.email}`);
        migratedCount++;
      } else {
        console.log(`  ⏭️  Staff already exists: ${user.email}`);
      }
    }

    // 3. Migrate Riders
    const riderUsers = await User.find({ role: 'rider' });
    console.log(`\n📋 Found ${riderUsers.length} rider(s) to migrate`);
    
    for (const user of riderUsers) {
      const existingRider = await DeliveryRider.findOne({ email: user.email });
      if (!existingRider) {
        await DeliveryRider.create({
          name: user.name,
          email: user.email,
          password: user.password, // Already hashed
          phone: user.phone,
          role: 'rider',
          vehicleType: 'Bike',
          vehicleNumber: 'TEMP-' + Date.now().toString().slice(-4),
          status: 'Available',
          isActive: true,
          refreshTokens: user.refreshTokens || [],
          createdAt: user.createdAt || new Date(),
          updatedAt: new Date()
        });
        console.log(`  ✅ Migrated rider: ${user.email}`);
        migratedCount++;
      } else {
        console.log(`  ⏭️  Rider already exists: ${user.email}`);
      }
    }

    // 4. Delete migrated users from User collection (keep only customers)
    console.log('\n🗑️  Removing migrated users from User collection...');
    const deleteResult = await User.deleteMany({ 
      role: { $in: ['admin', 'masterAdmin', 'staff', 'rider'] } 
    });
    console.log(`  ✅ Deleted ${deleteResult.deletedCount} non-customer users`);

    // 5. Summary
    const remainingCustomers = await User.countDocuments();
    console.log('\n📊 Migration Summary:');
    console.log(`  • Migrated: ${migratedCount} users`);
    console.log(`  • Remaining customers in User collection: ${remainingCustomers}`);
    console.log(`  • Admins in Admin collection: ${await Admin.countDocuments()}`);
    console.log(`  • Staff in Staff collection: ${await Staff.countDocuments()}`);
    console.log(`  • Riders in DeliveryRider collection: ${await DeliveryRider.countDocuments()}`);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsersToSeparateCollections();
