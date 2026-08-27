const dotenv = require('dotenv');
dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventculture',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'eventculture_default_access_secret_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'eventculture_default_refresh_secret_2026',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
  EMAIL_USER: process.env.EMAIL_USER || process.env.EMAIL_HOST_USER || '',
  EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_HOST_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || (process.env.EMAIL_USER || process.env.EMAIL_HOST_USER ? `EventCulture <${process.env.EMAIL_USER || process.env.EMAIL_HOST_USER}>` : 'EventCulture <no-reply@eventculture.io>'),
};

module.exports = env;
