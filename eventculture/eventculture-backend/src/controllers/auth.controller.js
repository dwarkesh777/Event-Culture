const User = require('../models/User');
const EventParticipant = require('../models/EventParticipant');
const VolunteerAssignment = require('../models/VolunteerAssignment');
const RefreshToken = require('../models/RefreshToken');
const {
  generateAuthenticatorSecret,
  createOtpAuthUri,
  generateQrCodeDataUrl,
  verifyAuthenticatorCode,
  generateDevToken,
} = require('../services/authenticator.service');
const { normalizePhone, normalizeEmail } = require('../services/csv.service');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * 1. Participant Login: Initiate Authenticator (First-time setup or verification request)
 */
const sendUserOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return errorResponse(res, 'Please enter a valid email address.', 400);
    }

    const cleanEmail = normalizeEmail(email);

    // Search in EventParticipants or User
    const participant = await EventParticipant.findOne({ email: cleanEmail });
    let user = await User.findOne({ email: cleanEmail });

    if (!participant && !user) {
      return errorResponse(
        res,
        'This email is not registered for any EventCulture event.',
        404
      );
    }

    // Auto-create user record for registered participant if not exists
    if (!user && participant) {
      user = await User.create({
        name: participant.name,
        email: cleanEmail,
        mobileNumber: participant.mobileNumber || '',
        role: 'USER',
        isVerified: false,
        isAuthenticatorSetup: false,
      });
    }

    // If Authenticator is already configured for this user
    if (user && user.isAuthenticatorSetup && user.authenticatorSecret) {
      return successResponse(res, 'Please enter the 6-digit code from Google Authenticator.', {
        email: cleanEmail,
        isSetupRequired: false,
        ...(process.env.NODE_ENV !== 'production' && {
          devOtp: generateDevToken(user.authenticatorSecret),
        }),
      });
    }

    // First time setup: Generate TOTP secret and QR code
    const secret = generateAuthenticatorSecret();
    user.tempAuthenticatorSecret = secret;
    await user.save();

    const otpauthUrl = createOtpAuthUri(cleanEmail, secret, 'EventCulture Passes');
    const qrCodeUrl = await generateQrCodeDataUrl(otpauthUrl);

    return successResponse(res, 'Google Authenticator setup required. Scan QR code or enter key.', {
      email: cleanEmail,
      isSetupRequired: true,
      qrCodeUrl,
      secretKey: secret,
      ...(process.env.NODE_ENV !== 'production' && {
        devOtp: generateDevToken(secret),
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Participant Login: Verify Google Authenticator Code
 */
const verifyUserOtp = async (req, res, next) => {
  try {
    const { email, otp, code } = req.body;
    const inputCode = otp || code;

    if (!email || !inputCode) {
      return errorResponse(res, 'Email and 6-digit Authenticator code are required.', 400);
    }

    const cleanEmail = normalizeEmail(email);
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return errorResponse(res, 'User record not found.', 404);
    }

    let isValid = false;

    if (!user.isAuthenticatorSetup) {
      // First-time setup verification
      if (!user.tempAuthenticatorSecret) {
        return errorResponse(res, 'Authenticator setup session expired. Please enter email again.', 400);
      }

      isValid = verifyAuthenticatorCode(user.tempAuthenticatorSecret, inputCode);
      if (!isValid) {
        return errorResponse(res, 'Invalid Google Authenticator code. Please check your app and try again.', 400);
      }

      // Activate authenticator
      user.authenticatorSecret = user.tempAuthenticatorSecret;
      user.tempAuthenticatorSecret = '';
      user.isAuthenticatorSetup = true;
      user.isVerified = true;
      await user.save();
    } else {
      // Standard recurring verification
      isValid = verifyAuthenticatorCode(user.authenticatorSecret, inputCode);
      if (!isValid) {
        return errorResponse(res, 'Invalid Google Authenticator code. Please check your app and try again.', 400);
      }
    }

    // Link user ID to participant record if not linked
    const participant = await EventParticipant.findOne({ email: cleanEmail });
    if (participant && !participant.userId) {
      participant.userId = user._id;
      await participant.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    return successResponse(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        profileImage: user.profileImage,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Organizer Login: Initiate Google Authenticator
 */
const sendOrganizerOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Please enter your registered organizer email.', 400);
    }

    const cleanEmail = normalizeEmail(email);
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return errorResponse(res, 'No organizer account found with this email address.', 404);
    }

    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return errorResponse(res, 'This account does not have Organizer privileges.', 403);
    }

    // If Authenticator is already set up
    if (user.isAuthenticatorSetup && user.authenticatorSecret) {
      return successResponse(res, 'Please enter the 6-digit code from Google Authenticator.', {
        email: cleanEmail,
        isSetupRequired: false,
        ...(process.env.NODE_ENV !== 'production' && {
          devOtp: generateDevToken(user.authenticatorSecret),
        }),
      });
    }

    // First-time setup: Generate secret & QR code
    const secret = generateAuthenticatorSecret();
    user.tempAuthenticatorSecret = secret;
    await user.save();

    const otpauthUrl = createOtpAuthUri(cleanEmail, secret, 'EventCulture Organizer');
    const qrCodeUrl = await generateQrCodeDataUrl(otpauthUrl);

    return successResponse(res, 'Google Authenticator setup required. Scan QR code or enter key.', {
      email: cleanEmail,
      isSetupRequired: true,
      qrCodeUrl,
      secretKey: secret,
      ...(process.env.NODE_ENV !== 'production' && {
        devOtp: generateDevToken(secret),
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Volunteer Login: Initiate Google Authenticator
 */
const sendVolunteerOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Please enter your registered volunteer email.', 400);
    }

    const cleanEmail = normalizeEmail(email);
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return errorResponse(res, 'No volunteer account found with this email address.', 404);
    }

    if (user.role !== 'VOLUNTEER' && user.role !== 'ADMIN') {
      return errorResponse(res, 'This account is not registered as a volunteer.', 403);
    }

    // Check if volunteer has active event assignment
    const assignment = await VolunteerAssignment.findOne({
      volunteerId: user._id,
      isActive: true,
    });

    if (!assignment && user.role !== 'ADMIN') {
      return errorResponse(
        res,
        'Your volunteer account is not currently assigned to any active event.',
        403
      );
    }

    // If Authenticator is already set up
    if (user.isAuthenticatorSetup && user.authenticatorSecret) {
      return successResponse(res, 'Please enter the 6-digit code from Google Authenticator.', {
        email: cleanEmail,
        isSetupRequired: false,
        ...(process.env.NODE_ENV !== 'production' && {
          devOtp: generateDevToken(user.authenticatorSecret),
        }),
      });
    }

    // First time setup: Generate secret & QR code
    const secret = generateAuthenticatorSecret();
    user.tempAuthenticatorSecret = secret;
    await user.save();

    const otpauthUrl = createOtpAuthUri(cleanEmail, secret, 'EventCulture Volunteer');
    const qrCodeUrl = await generateQrCodeDataUrl(otpauthUrl);

    return successResponse(res, 'Google Authenticator setup required. Scan QR code or enter key.', {
      email: cleanEmail,
      isSetupRequired: true,
      qrCodeUrl,
      secretKey: secret,
      ...(process.env.NODE_ENV !== 'production' && {
        devOtp: generateDevToken(secret),
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. General Verify Authenticator Code (For Organizer and Volunteer)
 */
const verifyOtpHandler = async (req, res, next) => {
  try {
    const { email, otp, code, role } = req.body;
    const inputCode = otp || code;

    if (!email || !inputCode) {
      return errorResponse(res, 'Email and 6-digit Authenticator code are required.', 400);
    }

    const cleanEmail = normalizeEmail(email);
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return errorResponse(res, 'User record not found.', 404);
    }

    let isValid = false;

    if (!user.isAuthenticatorSetup) {
      if (!user.tempAuthenticatorSecret) {
        return errorResponse(res, 'Authenticator setup session expired. Please enter email again.', 400);
      }

      isValid = verifyAuthenticatorCode(user.tempAuthenticatorSecret, inputCode);
      if (!isValid) {
        return errorResponse(res, 'Invalid Google Authenticator code. Please check your app and try again.', 400);
      }

      // Activate authenticator
      user.authenticatorSecret = user.tempAuthenticatorSecret;
      user.tempAuthenticatorSecret = '';
      user.isAuthenticatorSetup = true;
      user.isVerified = true;
      await user.save();
    } else {
      isValid = verifyAuthenticatorCode(user.authenticatorSecret, inputCode);
      if (!isValid) {
        return errorResponse(res, 'Invalid Google Authenticator code. Please check your app and try again.', 400);
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    return successResponse(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        profileImage: user.profileImage,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Refresh Token
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    const user = await verifyRefreshToken(refreshToken);
    if (!user || !user.isActive) {
      return errorResponse(res, 'Invalid or expired refresh token. Please login again.', 401);
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user._id);

    return successResponse(res, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteMany({ tokenHash: refreshToken });
    }
    if (req.user) {
      await RefreshToken.deleteMany({ userId: req.user._id });
    }
    return successResponse(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Current Authenticated User (GET /api/auth/me)
 */
const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 'User profile fetched', {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mobileNumber: req.user.mobileNumber,
        role: req.user.role,
        profileImage: req.user.profileImage,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Organizer Registration: Send Signup Setup Code
 */
const sendOrganizerSignupOtp = async (req, res, next) => {
  try {
    const { name, email, mobileNumber, organizerCode } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Please provide the Organizer / Organization Name.', 400);
    }
    if (!email || !email.includes('@')) {
      return errorResponse(res, 'Please enter a valid email address.', 400);
    }
    if (!organizerCode || !organizerCode.trim()) {
      return errorResponse(res, 'Please provide an Organizer Code.', 400);
    }

    const cleanEmail = normalizeEmail(email);
    const cleanOrganizerCode = organizerCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (cleanOrganizerCode.length < 3) {
      return errorResponse(res, 'Organizer code must be at least 3 alphanumeric characters.', 400);
    }

    // Check if organizer email is already registered and verified
    const existingOrganizer = await User.findOne({ email: cleanEmail, role: 'ORGANIZER', isVerified: true });
    if (existingOrganizer) {
      return errorResponse(res, 'An organizer account with this email already exists. Please log in.', 400);
    }

    // Check if organizer code is already taken by another organizer
    const existingCode = await User.findOne({ organizerCode: cleanOrganizerCode });
    if (existingCode && existingCode.email !== cleanEmail) {
      return errorResponse(
        res,
        `Organizer code "${cleanOrganizerCode}" is already in use. Please choose a different code.`,
        400
      );
    }

    // Generate TOTP secret and QR code for organizer signup
    const secret = generateAuthenticatorSecret();
    const folderName = `organizer_${cleanOrganizerCode.toLowerCase()}`;

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        mobileNumber: mobileNumber ? normalizePhone(mobileNumber) : '',
        role: 'ORGANIZER',
        organizerCode: cleanOrganizerCode,
        organizationName: name.trim(),
        folderName,
        isVerified: false,
        isActive: true,
        isAuthenticatorSetup: false,
        tempAuthenticatorSecret: secret,
      });
    } else {
      user.name = name.trim();
      user.mobileNumber = mobileNumber ? normalizePhone(mobileNumber) : user.mobileNumber;
      user.role = 'ORGANIZER';
      user.organizerCode = cleanOrganizerCode;
      user.organizationName = name.trim();
      user.folderName = folderName;
      user.tempAuthenticatorSecret = secret;
      await user.save();
    }

    const otpauthUrl = createOtpAuthUri(cleanEmail, secret, 'EventCulture Organizer');
    const qrCodeUrl = await generateQrCodeDataUrl(otpauthUrl);

    return successResponse(res, 'Scan QR code in Google Authenticator to complete organizer registration.', {
      email: cleanEmail,
      organizerCode: cleanOrganizerCode,
      folderName,
      isSetupRequired: true,
      qrCodeUrl,
      secretKey: secret,
      ...(process.env.NODE_ENV !== 'production' && {
        devOtp: generateDevToken(secret),
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Organizer Registration: Verify Authenticator & Finalize Account
 */
const verifyOrganizerSignupOtp = async (req, res, next) => {
  try {
    const { name, email, mobileNumber, organizerCode, otp, code } = req.body;
    const inputCode = otp || code;

    if (!email || !inputCode) {
      return errorResponse(res, 'Email and 6-digit Authenticator code are required.', 400);
    }
    if (!name || !organizerCode) {
      return errorResponse(res, 'Organizer Name and Organizer Code are required.', 400);
    }

    const cleanEmail = normalizeEmail(email);
    const cleanOrganizerCode = organizerCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const folderName = `organizer_${cleanOrganizerCode.toLowerCase()}`;

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.tempAuthenticatorSecret) {
      return errorResponse(res, 'Registration session expired. Please restart signup.', 400);
    }

    // Verify Authenticator code
    const isValid = verifyAuthenticatorCode(user.tempAuthenticatorSecret, inputCode);
    if (!isValid) {
      return errorResponse(res, 'Invalid Google Authenticator code. Please check your app and try again.', 400);
    }

    // Check if code was taken in the meantime
    const existingCode = await User.findOne({ organizerCode: cleanOrganizerCode });
    if (existingCode && existingCode.email !== cleanEmail) {
      return errorResponse(
        res,
        `Organizer code "${cleanOrganizerCode}" was already claimed. Please restart signup with another code.`,
        400
      );
    }

    // Finalize organizer account
    user.name = name.trim();
    user.mobileNumber = mobileNumber ? normalizePhone(mobileNumber) : user.mobileNumber;
    user.role = 'ORGANIZER';
    user.organizerCode = cleanOrganizerCode;
    user.organizationName = name.trim();
    user.folderName = folderName;
    user.authenticatorSecret = user.tempAuthenticatorSecret;
    user.tempAuthenticatorSecret = '';
    user.isAuthenticatorSetup = true;
    user.isVerified = true;
    user.isActive = true;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);

    return successResponse(
      res,
      'Organizer account created successfully! Workspace folder initialized.',
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobileNumber: user.mobileNumber,
          role: user.role,
          organizerCode: user.organizerCode,
          organizationName: user.organizationName,
          folderName: user.folderName,
          profileImage: user.profileImage,
        },
        folderCreated: true,
        folderName,
        organizerCode: cleanOrganizerCode,
        accessToken,
        refreshToken,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendUserOtp,
  verifyUserOtp,
  sendOrganizerOtp,
  sendVolunteerOtp,
  verifyOtpHandler,
  refreshAccessToken,
  logout,
  getMe,
  sendOrganizerSignupOtp,
  verifyOrganizerSignupOtp,
};
