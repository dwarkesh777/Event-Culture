const { validatePass, redeemPass } = require('../services/scan.service');
const ScanLog = require('../models/ScanLog');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Validate QR token (Pre-check)
 */
const validatePassHandler = async (req, res, next) => {
  try {
    const { qrToken, location, deviceId, expectedPassTypeId } = req.body;
    if (!qrToken) {
      return errorResponse(res, 'QR token is required', 400);
    }

    const result = await validatePass(qrToken, req.user._id, location, deviceId, expectedPassTypeId);

    if (result.status === 'SUCCESS') {
      return successResponse(res, result.message, result);
    } else {
      return errorResponse(res, result.message, 400, result);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Redeem QR Pass
 */
const scanPassHandler = async (req, res, next) => {
  try {
    const { qrToken, location, deviceId, expectedPassTypeId } = req.body;
    if (!qrToken) {
      return errorResponse(res, 'QR token is required', 400);
    }

    const result = await redeemPass(qrToken, req.user._id, location, deviceId, expectedPassTypeId);

    if (result.status === 'SUCCESS') {
      return successResponse(res, result.message, result);
    } else {
      return errorResponse(res, result.message, 400, result);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get Scan History (for Volunteer or Event)
 */
const getScanHistory = async (req, res, next) => {
  try {
    const { eventId, result, limit = 50, page = 1 } = req.query;
    const query = {};

    if (req.user.role === 'VOLUNTEER') {
      query.volunteerId = req.user._id;
    }

    if (eventId) {
      query.eventId = eventId;
    }

    if (result) {
      query.result = result;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ScanLog.countDocuments(query);
    const scans = await ScanLog.find(query)
      .populate('passTypeId', 'name category color icon')
      .populate('participantId', 'name email mobileNumber registrationId ticketType')
      .populate('volunteerId', 'name email')
      .populate('eventId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 'Scan history retrieved', {
      scans,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validatePassHandler,
  scanPassHandler,
  getScanHistory,
};
