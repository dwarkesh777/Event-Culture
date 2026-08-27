const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');

/**
 * Generate JWT Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
};

/**
 * Generate and store Refresh Token
 */
const generateRefreshToken = async (userId) => {
  const plainToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

  // Expires in 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Remove existing refresh tokens for this user
  await RefreshToken.deleteMany({ userId });

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return plainToken;
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = async (plainToken) => {
  const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
  const record = await RefreshToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).populate('userId');

  if (!record || !record.userId) {
    return null;
  }
  return record.userId;
};

/**
 * Generate Secure High-Entropy QR Token for Passes
 */
const generatePassQRToken = () => {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `evtpass_${randomBytes}`;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generatePassQRToken,
};
