const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

// Fix for Node.js SRV lookup issues on Windows networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not allowed
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return mongoose.connection;
  }

  if (!env.MONGODB_URI || (env.NODE_ENV === 'production' && env.MONGODB_URI.includes('127.0.0.1'))) {
    throw new Error('MONGODB_URI is not configured for the production API.');
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (env.NODE_ENV === 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
    throw new Error('Database connection failed. Check the production MONGODB_URI setting.');
  }
};

module.exports = connectDB;
