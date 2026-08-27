const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['USER_MOBILE', 'USER_EMAIL', 'ORGANIZER_EMAIL', 'VOLUNTEER_EMAIL', 'ORGANIZER_SIGNUP_EMAIL'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto delete after TTL expires
    },
    resendAvailableAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OTPVerification', otpVerificationSchema);
