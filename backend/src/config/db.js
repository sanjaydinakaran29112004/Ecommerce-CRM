const mongoose = require('mongoose');
const config = require('./env');

/**
 * Connect to MongoDB with enterprise event monitoring
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      autoIndex: config.env !== 'production', // Build indexes in dev, manage manually in prod
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging
    });

    console.log(`\x1b[32m[DATABASE] MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}\x1b[0m`);

    // Auto-seed default staff accounts if not yet created in MongoDB
    await autoSeedDefaultUsers();

    mongoose.connection.on('error', (err) => {
      console.error('\x1b[31m[DATABASE ERROR]\x1b[0m', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('\x1b[33m[DATABASE WARN] MongoDB disconnected. Attempting reconnection...\x1b[0m');
    });

    return conn;
  } catch (error) {
    console.error(`\x1b[31m[DATABASE FATAL] Connection failed: ${error.message}\x1b[0m`);
    // In production we exit with failure; during local setup we log guidance
    console.error('\x1b[33m[TIP] Check your MONGODB_URI in the .env file. Ensure your MongoDB Atlas cluster or local MongoDB service is running.\x1b[0m');
    throw error;
  }
};

const autoSeedDefaultUsers = async () => {
  try {
    const User = require('../modules/users/user.model');
    const sanjayUser = await User.findOne({ email: 'sanjay@entrykode.com' });
    if (!sanjayUser) {
      console.log('\x1b[36m[AUTO-SEED] Seeding 4 default enterprise employees into MongoDB...\x1b[0m');
      const seedUsers = [
        {
          firstName: 'Sanjay',
          lastName: 'D',
          email: 'sanjay@entrykode.com',
          phone: '+91 98401 23456',
          password: 'superadmin@123',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        {
          firstName: 'Ishwarya',
          lastName: 'R',
          email: 'ishwarya@entrykode.com',
          phone: '+91 98840 54321',
          password: 'admin@123',
          role: 'ADMIN',
          isActive: true,
        },
        {
          firstName: 'Karthik',
          lastName: 'Raja',
          email: 'karthik@entrykode.com',
          phone: '+91 94432 99887',
          password: 'sales@123',
          role: 'SALES_EMPLOYEE',
          isActive: true,
        },
        {
          firstName: 'Priya',
          lastName: 'Sundaram',
          email: 'priya@entrykode.com',
          phone: '+91 97910 11223',
          password: 'support@123',
          role: 'SUPPORT_EMPLOYEE',
          isActive: true,
        },
      ];
      for (const u of seedUsers) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          await User.create(u);
        }
      }
      console.log('\x1b[32m[AUTO-SEED] 4 default employees successfully created in MongoDB!\x1b[0m');
    }
  } catch (err) {
    console.warn('[AUTO-SEED WARN] Could not seed users:', err.message);
  }
};

module.exports = connectDB;

