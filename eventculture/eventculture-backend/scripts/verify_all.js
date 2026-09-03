const fs = require('fs');
const path = require('path');

console.log('Verifying backend models and controllers...');

try {
  // Check models
  const User = require('../src/models/User');
  console.log('User model loaded successfully.');

  // Check services
  const authService = require('../src/services/authenticator.service');
  console.log('Authenticator service loaded successfully.');

  // Check controllers
  const authController = require('../src/controllers/auth.controller');
  console.log('Auth controller loaded successfully.');

  // Check routes
  const authRoutes = require('../src/routes/auth.routes');
  console.log('Auth routes loaded successfully.');

  console.log('All backend components verified successfully!');
} catch (error) {
  console.error('Verification failed:', error);
  process.exit(1);
}
