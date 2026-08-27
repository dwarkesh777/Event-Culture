const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OTPVerification = require('../models/OTPVerification');

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;

/**
 * Generate a 6-digit cryptographic OTP
 */
const generateOtpCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Create or replace OTP record for identifier
 */
const createOtp = async (identifier, type) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  // Check existing active OTP for cooldown
  const existingOtp = await OTPVerification.findOne({
    identifier: normalizedIdentifier,
    type,
    expiresAt: { $gt: new Date() },
  });

  if (existingOtp && existingOtp.resendAvailableAt > new Date()) {
    const waitSeconds = Math.ceil((existingOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
    throw new Error(`Please wait ${waitSeconds}s before requesting a new OTP`);
  }

  // Generate 6-digit OTP
  const rawOtp = generateOtpCode();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(rawOtp, salt);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const resendAvailableAt = new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);

  // Remove existing OTPs for this identifier and type
  await OTPVerification.deleteMany({ identifier: normalizedIdentifier, type });

  // Save new hashed OTP
  await OTPVerification.create({
    identifier: normalizedIdentifier,
    otpHash,
    type,
    attempts: 0,
    expiresAt,
    resendAvailableAt,
  });

  return {
    rawOtp,
    expiresAt,
  };
};

/**
 * Verify OTP for identifier
 */
const verifyOtp = async (identifier, type, inputOtp) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  const record = await OTPVerification.findOne({
    identifier: normalizedIdentifier,
    type,
  });

  if (!record) {
    return {
      valid: false,
      message: 'OTP has expired or was not requested. Please request a new OTP.',
    };
  }

  if (record.expiresAt < new Date()) {
    await OTPVerification.deleteOne({ _id: record._id });
    return {
      valid: false,
      message: 'OTP has expired. Please request a new one.',
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await OTPVerification.deleteOne({ _id: record._id });
    return {
      valid: false,
      message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
    };
  }

  const isMatch = await bcrypt.compare(inputOtp.toString().trim(), record.otpHash);

  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // Successful verification -> delete OTP record
  await OTPVerification.deleteOne({ _id: record._id });

  return {
    valid: true,
    message: 'OTP verified successfully.',
  };
};

module.exports = {
  createOtp,
  verifyOtp,
  OTP_EXPIRY_MINUTES,
};
