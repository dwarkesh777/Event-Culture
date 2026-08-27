const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { otpRateLimiter, authRateLimiter } = require('../middleware/rateLimit.middleware');

// User / Participant Mobile Login
router.post('/send-user-otp', otpRateLimiter, authController.sendUserOtp);
router.post('/verify-user-otp', authRateLimiter, authController.verifyUserOtp);

// Organizer Signup & Login
router.post('/send-organizer-signup-otp', otpRateLimiter, authController.sendOrganizerSignupOtp);
router.post('/verify-organizer-signup-otp', authRateLimiter, authController.verifyOrganizerSignupOtp);
router.post('/send-organizer-otp', otpRateLimiter, authController.sendOrganizerOtp);

// Volunteer Login
router.post('/send-volunteer-otp', otpRateLimiter, authController.sendVolunteerOtp);

// Common OTP Verification for Organizer / Volunteer
router.post('/verify-otp', authRateLimiter, authController.verifyOtpHandler);

// Refresh Token & Session
router.post('/refresh-token', authController.refreshAccessToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
