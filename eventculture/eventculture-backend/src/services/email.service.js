const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (env.EMAIL_USER && env.EMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_APP_PASSWORD,
      },
    });
    console.log(`✅ Nodemailer initialized with account: ${env.EMAIL_USER}`);
  } else {
    console.log('ℹ️ Nodemailer credentials not configured. OTPs will be logged to console in dev mode.');
  }

  return transporter;
};

/**
 * Send OTP Email with modern HTML template
 */
const sendOtpEmail = async (toEmail, otpCode, roleTitle = 'Participant') => {
  const mailTransporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F9FF; margin: 0; padding: 20px; color: #0F172A; }
        .card { max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 4px 12px rgba(21, 101, 249, 0.08); }
        .header { text-align: center; margin-bottom: 24px; }
        .logo-title { font-size: 24px; font-weight: 800; color: #1565F9; margin: 0; letter-spacing: -0.5px; }
        .tagline { font-size: 11px; font-weight: 700; color: #64748B; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
        .otp-box { background: #EAF2FF; border: 2px dashed #1565F9; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-digits { font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0B3B91; margin: 0; font-family: monospace; }
        .info-text { font-size: 14px; color: #64748B; line-height: 1.6; text-align: center; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo-title">EVENTCULTURE</h1>
          <div class="tagline">ONE SCAN. ZERO QUEUES.</div>
        </div>
        <p style="font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 8px;">
          Login Verification Code
        </p>
        <p class="info-text">
          Use the following 6-digit one-time password to verify your <strong>${roleTitle}</strong> login. This code is valid for 5 minutes.
        </p>
        <div class="otp-box">
          <div class="otp-digits">${otpCode}</div>
        </div>
        <p class="info-text" style="font-size: 13px;">
          If you did not request this login code, you can safely ignore this email. Never share this code with anyone.
        </p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} EventCulture Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // Always log OTP to server terminal for instant local developer experience
  console.log(`\n========================================`);
  console.log(`📩 [EVENTCULTURE OTP DELIVERY]`);
  console.log(`To: ${toEmail} (${roleTitle})`);
  console.log(`OTP Code: >>> ${otpCode} <<< (Expires in 5 mins)`);
  console.log(`========================================\n`);

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: env.EMAIL_FROM,
        to: toEmail,
        subject: `Your EventCulture Verification Code: ${otpCode}`,
        html: htmlContent,
      });
      return { success: true };
    } catch (err) {
      console.error('Failed to send email via SMTP transporter:', err.message);
      // Fallback allowed in dev
      return { success: true, fallback: true };
    }
  }

  return { success: true, localOnly: true };
};

/**
 * Send Organizer Signup OTP Email with welcome styling
 */
const sendSignupOtpEmail = async (toEmail, otpCode, organizerName, organizerCode) => {
  const mailTransporter = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F9FF; margin: 0; padding: 20px; color: #0F172A; }
        .card { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 4px 12px rgba(21, 101, 249, 0.08); }
        .header { text-align: center; margin-bottom: 24px; }
        .logo-title { font-size: 24px; font-weight: 800; color: #1565F9; margin: 0; letter-spacing: -0.5px; }
        .tagline { font-size: 11px; font-weight: 700; color: #64748B; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
        .badge { display: inline-block; background: #EAF2FF; color: #1565F9; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-top: 10px; }
        .otp-box { background: #EAF2FF; border: 2px dashed #1565F9; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-digits { font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0B3B91; margin: 0; font-family: monospace; }
        .info-text { font-size: 14px; color: #64748B; line-height: 1.6; text-align: center; }
        .details-box { background: #F8FAFC; border-radius: 10px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #334155; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo-title">EVENTCULTURE</h1>
          <div class="tagline">ONE SCAN. ZERO QUEUES.</div>
          <div class="badge">ORGANIZER ONBOARDING</div>
        </div>
        <p style="font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 8px; color: #0F172A;">
          Verify Your Organizer Account
        </p>
        <p class="info-text">
          Welcome <strong>${organizerName}</strong>! Use the code below to complete your organizer registration and initialize your event workspace.
        </p>
        <div class="details-box">
          <div><strong>Organizer Code:</strong> ${organizerCode}</div>
          <div><strong>Workspace Folder:</strong> organizer_${organizerCode.toLowerCase()}</div>
        </div>
        <div class="otp-box">
          <div class="otp-digits">${otpCode}</div>
        </div>
        <p class="info-text" style="font-size: 13px;">
          This verification code expires in 5 minutes. If you did not request this registration, you can safely ignore this email.
        </p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} EventCulture Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n========================================`);
  console.log(`📩 [EVENTCULTURE SIGNUP OTP DELIVERY]`);
  console.log(`To: ${toEmail} (Organizer: ${organizerName} [${organizerCode}])`);
  console.log(`OTP Code: >>> ${otpCode} <<< (Expires in 5 mins)`);
  console.log(`========================================\n`);

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: env.EMAIL_FROM,
        to: toEmail,
        subject: `Your EventCulture Organizer Signup Code: ${otpCode}`,
        html: htmlContent,
      });
      return { success: true };
    } catch (err) {
      console.error('Failed to send email via SMTP transporter:', err.message);
      return { success: true, fallback: true };
    }
  }

  return { success: true, localOnly: true };
};

module.exports = {
  sendOtpEmail,
  sendSignupOtpEmail,
};

