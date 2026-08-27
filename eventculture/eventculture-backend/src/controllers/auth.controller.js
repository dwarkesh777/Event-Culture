const User = require('../models/User');
const EventParticipant = require('../models/EventParticipant');
const VolunteerAssignment = require('../models/VolunteerAssignment');
const RefreshToken = require('../models/RefreshToken');
const { createOtp, verifyOtp } = require('../services/otp.service');
const { sendOtpEmail } = require('../services/email.service');
const { normalizePhone, normalizeEmail } = require('../services/csv.service');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * 1. Participant Login: Request OTP (Email based)
 */
const sendUserOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return errorResponse(res, 'Please enter a valid email address.', 400);
    }

    const cleanEmail = normalizeEmail(email);

    // Search in EventParticipants to see if participant is registered in any event
    const participant = await EventParticipant.findOne({ email: cleanEmail });

    if (!participant) {
      // Check if user exists in User collection as fallback
      const user = await User.findOne({ email: cleanEmail, role: 'USER' });
      if (!user) {
        return errorResponse(
          res,
          'This email is not registered for any EventCulture event.',
          404
        );
      }
    }

    const participantName = participant ? participant.name : 'Participant';

    // Generate & Save hashed OTP
    const { rawOtp } = await createOtp(cleanEmail, 'USER_EMAIL');

    // Send OTP to registered email
    await sendOtpEmail(cleanEmail, rawOtp, `Participant (${participantName})`);

    return successResponse(res, `OTP sent successfully to your email.`, {
      email: cleanEmail,
      // For developer ease in non-production
      ...(process.env.NODE_ENV !== 'production' && { devOtp: rawOtp }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Participant Login: Verify OTP
 */
const verifyUserOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return errorResponse(res, 'Email and 6-digit OTP are required.', 400);
    }

    const cleanEmail = normalizeEmail(email);

    // Verify OTP
    const verification = await verifyOtp(cleanEmail, 'USER_EMAIL', otp);
    if (!verification.valid) {
      return errorResponse(res, verification.message, 400);
    }

    // Find or create User record
    let participant = await EventParticipant.findOne({ email: cleanEmail });
    let user = await User.findOne({ email: cleanEmail });

    if (!user && participant) {
      user = await User.create({
        name: participant.name,
        email: participant.email,
        mobileNumber: participant.mobileNumber || '',
        role: 'USER',
        isVerified: true,
      });
    }

    if (!user) {
      return errorResponse(res, 'User record not found.', 404);
    }

    // Link user ID to participant record if not linked
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
 * 3. Organizer Login: Send OTP
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

    const { rawOtp } = await createOtp(cleanEmail, 'ORGANIZER_EMAIL');
    await sendOtpEmail(cleanEmail, rawOtp, `Organizer (${user.name})`);

    return successResponse(res, 'Verification code sent to your email.', {
      email: cleanEmail,
      ...(process.env.NODE_ENV !== 'production' && { devOtp: rawOtp }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Volunteer Login: Send OTP
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

    const { rawOtp } = await createOtp(cleanEmail, 'VOLUNTEER_EMAIL');
    await sendOtpEmail(cleanEmail, rawOtp, `Volunteer (${user.name})`);

    return successResponse(res, 'Verification code sent to your volunteer email.', {
      email: cleanEmail,
      ...(process.env.NODE_ENV !== 'production' && { devOtp: rawOtp }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. General Verify OTP (For Organizer and Volunteer)
 */
const verifyOtpHandler = async (req, res, next) => {
  try {
    const { email, otp, role } = req.body;
    if (!email || !otp) {
      return errorResponse(res, 'Email and OTP are required.', 400);
    }

    const cleanEmail = normalizeEmail(email);
    const otpType = role === 'VOLUNTEER' ? 'VOLUNTEER_EMAIL' : 'ORGANIZER_EMAIL';

    const verification = await verifyOtp(cleanEmail, otpType, otp);
    if (!verification.valid) {
      return errorResponse(res, verification.message, 400);
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return errorResponse(res, 'User record not found.', 404);
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
 * 9. Organizer Registration: Send Signup OTP
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

    // Check if organizer email is already registered as an active organizer
    const existingOrganizer = await User.findOne({ email: cleanEmail, role: 'ORGANIZER' });
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

    // Generate & Save hashed OTP
    const { rawOtp } = await createOtp(cleanEmail, 'ORGANIZER_SIGNUP_EMAIL');

    // Send dedicated signup OTP email
    const { sendSignupOtpEmail } = require('../services/email.service');
    await sendSignupOtpEmail(cleanEmail, rawOtp, name.trim(), cleanOrganizerCode);

    return successResponse(res, 'Signup verification code sent to your email.', {
      email: cleanEmail,
      organizerCode: cleanOrganizerCode,
      folderName: `organizer_${cleanOrganizerCode.toLowerCase()}`,
      ...(process.env.NODE_ENV !== 'production' && { devOtp: rawOtp }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Organizer Registration: Verify OTP & Create Account + Tenant Folder
 */
const verifyOrganizerSignupOtp = async (req, res, next) => {
  try {
    const { name, email, mobileNumber, organizerCode, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 'Email and 6-digit OTP code are required.', 400);
    }
    if (!name || !organizerCode) {
      return errorResponse(res, 'Organizer Name and Organizer Code are required.', 400);
    }

    const cleanEmail = normalizeEmail(email);
    const cleanOrganizerCode = organizerCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const folderName = `organizer_${cleanOrganizerCode.toLowerCase()}`;

    // Verify OTP against ORGANIZER_SIGNUP_EMAIL type
    const verification = await verifyOtp(cleanEmail, 'ORGANIZER_SIGNUP_EMAIL', otp);
    if (!verification.valid) {
      return errorResponse(res, verification.message, 400);
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

    // Find or create User record with ORGANIZER role and multi-tenant folder
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      user.name = name.trim();
      user.mobileNumber = mobileNumber ? normalizePhone(mobileNumber) : user.mobileNumber;
      user.role = 'ORGANIZER';
      user.organizerCode = cleanOrganizerCode;
      user.organizationName = name.trim();
      user.folderName = folderName;
      user.isVerified = true;
      user.isActive = true;
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        mobileNumber: mobileNumber ? normalizePhone(mobileNumber) : '',
        role: 'ORGANIZER',
        organizerCode: cleanOrganizerCode,
        organizationName: name.trim(),
        folderName,
        isVerified: true,
        isActive: true,
      });
    }

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

