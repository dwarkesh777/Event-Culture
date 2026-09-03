const {
  generateAuthenticatorSecret,
  createOtpAuthUri,
  generateQrCodeDataUrl,
  verifyAuthenticatorCode,
  generateDevToken,
} = require('../src/services/authenticator.service');

async function runTests() {
  console.log('Testing Google Authenticator Service...');

  // 1. Generate Secret
  const secret = generateAuthenticatorSecret();
  console.log('1. Generated Secret:', secret ? 'PASS (' + secret.substring(0, 6) + '...)' : 'FAIL');

  // 2. Generate URI
  const email = 'user@example.com';
  const uri = createOtpAuthUri(email, secret, 'EventCulture');
  console.log('2. Generated OTPAuth URI:', uri.startsWith('otpauth://totp/') ? 'PASS' : 'FAIL');

  // 3. Generate QR Code
  const qrCodeData = await generateQrCodeDataUrl(uri);
  console.log('3. Generated QR Data URL:', qrCodeData.startsWith('data:image/png;base64,') ? 'PASS' : 'FAIL');

  // 4. Generate Token & Verify
  const devToken = generateDevToken(secret);
  console.log('4. Generated Dev Token:', devToken);
  const isValid = verifyAuthenticatorCode(secret, devToken);
  console.log('5. Verification of valid token:', isValid ? 'PASS' : 'FAIL');

  // 5. Verify Invalid Code
  const isInvalidRejected = !verifyAuthenticatorCode(secret, '000000') || devToken === '000000';
  console.log('6. Rejection of invalid token:', isInvalidRejected ? 'PASS' : 'FAIL');

  console.log('\n--- Authenticator Service Tests Completed ---');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
