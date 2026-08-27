const rateLimit = require('express-rate-limit');

/**
 * Rate limit OTP generation requests to prevent spam / abuse
 */
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OTP requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this device/IP. Please try again after 15 minutes.',
  },
});

/**
 * General authentication rate limiter
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

module.exports = {
  otpRateLimiter,
  authRateLimiter,
};
