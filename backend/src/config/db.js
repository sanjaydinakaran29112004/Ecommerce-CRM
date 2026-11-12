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

module.exports = connectDB;

