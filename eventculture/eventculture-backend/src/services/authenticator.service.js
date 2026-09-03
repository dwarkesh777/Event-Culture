const { authenticator } = require('otplib');
const QRCode = require('qrcode');

/**
 * Generate a new random base32 secret for Google Authenticator
 */
const generateAuthenticatorSecret = () => {
  return authenticator.generateSecret();
};

/**
 * Generate an otpauth:// URI for the user and issuer
 */
const createOtpAuthUri = (email, secret, issuer = 'EventCulture') => {
  return authenticator.keyuri(email, issuer, secret);
};

/**
 * Generate a Base64 QR code Data URL from otpauth URL
 */
const generateQrCodeDataUrl = async (otpauthUrl) => {
  return await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 250,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
};

/**
 * Verify a 6-digit TOTP code against a user's secret
 */
const verifyAuthenticatorCode = (secret, token) => {
  if (!secret || !token) return false;
  try {
    const cleanToken = token.toString().trim().replace(/\s+/g, '');
    // Allow +/- 1 window (30 seconds before and after) for clock drift tolerance
    authenticator.options = { window: 1 };
    return authenticator.check(cleanToken, secret);
  } catch (error) {
    console.error('Authenticator verification error:', error);
    return false;
  }
};

/**
 * Generate the current TOTP token (for dev/testing environments)
 */
const generateDevToken = (secret) => {
  if (!secret) return null;
  try {
    return authenticator.generate(secret);
  } catch {
    return null;
  }
};

module.exports = {
  generateAuthenticatorSecret,
  createOtpAuthUri,
  generateQrCodeDataUrl,
  verifyAuthenticatorCode,
  generateDevToken,
};
