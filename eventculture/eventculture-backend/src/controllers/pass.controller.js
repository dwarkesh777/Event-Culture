const PassType = require('../models/PassType');
const UserPass = require('../models/UserPass');
const EventParticipant = require('../models/EventParticipant');
const { assignPassToParticipant, bulkAssignPass, getParticipantPasses } = require('../services/pass.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Create Pass Type for an Event (Organizer)
 */
const createPassType = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { name, description, category, scanLimit, validFrom, validUntil, icon, color, requiredPermission, targetRole } = req.body;

    if (!name) {
      return errorResponse(res, 'Pass type name is required', 400);
    }

    const passType = await PassType.create({
      eventId,
      name,
      description: description || '',
      category: category || 'ENTRY',
      scanLimit: scanLimit ? parseInt(scanLimit) : 1,
      validFrom: validFrom || new Date(),
      validUntil: validUntil || null,
      icon: icon || 'ticket-outline',
      color: color || '#1565F9',
      requiredPermission: requiredPermission || category || 'ENTRY',
      targetRole: targetRole || 'ALL',
    });

    return successResponse(res, 'Pass type created successfully', passType, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Pass Types for an Event
 */
const getEventPassTypes = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const passTypes = await PassType.find({ eventId }).sort({ createdAt: 1 });

    // Attach count of issued passes for each type
    const passTypesWithStats = await Promise.all(
      passTypes.map(async (pt) => {
        const totalIssued = await UserPass.countDocuments({ passTypeId: pt._id });
        const totalRedeemed = await UserPass.countDocuments({ passTypeId: pt._id, usedCount: { $gt: 0 } });
        return {
          ...pt.toObject(),
          totalIssued,
          totalRedeemed,
        };
      })
    );

    return successResponse(res, 'Pass types fetched', passTypesWithStats);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Pass Type
 */
const updatePassType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await PassType.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return errorResponse(res, 'Pass type not found', 404);
    }
    return successResponse(res, 'Pass type updated', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Pass Type
 */
const deletePassType = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserPass.deleteMany({ passTypeId: id });
    const deleted = await PassType.findByIdAndDelete(id);
    if (!deleted) {
      return errorResponse(res, 'Pass type not found', 404);
    }
    return successResponse(res, 'Pass type and related passes deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * Assign Pass to single participant
 */
const assignPassHandler = async (req, res, next) => {
  try {
    const { eventId, participantId, passTypeId } = req.body;
    if (!eventId || !participantId || !passTypeId) {
      return errorResponse(res, 'eventId, participantId, and passTypeId are required', 400);
    }

    const pass = await assignPassToParticipant(eventId, participantId, passTypeId);
    return successResponse(res, 'Pass assigned successfully', pass, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Assign Pass to all participants of event
 */
const bulkAssignPassHandler = async (req, res, next) => {
  try {
    const { eventId, passTypeId, filterCriteria } = req.body;
    if (!eventId || !passTypeId) {
      return errorResponse(res, 'eventId and passTypeId are required', 400);
    }

    const result = await bulkAssignPass(eventId, passTypeId, filterCriteria || {});
    return successResponse(res, 'Bulk passes assigned successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get My Passes (for logged in Participant)
 */
const getMyPasses = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const userPhone = req.user.mobileNumber;

    const passes = await getParticipantPasses(userEmail || userPhone);
    return successResponse(res, 'Passes retrieved successfully', passes);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single pass by ID
 */
const getPassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pass = await UserPass.findById(id)
      .populate('eventId')
      .populate('passTypeId')
      .populate('participantId');

    if (!pass) {
      return errorResponse(res, 'Pass not found', 404);
    }

    return successResponse(res, 'Pass details fetched', pass);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPassType,
  getEventPassTypes,
  updatePassType,
  deletePassType,
  assignPassHandler,
  bulkAssignPassHandler,
  getMyPasses,
  getPassById,
};
