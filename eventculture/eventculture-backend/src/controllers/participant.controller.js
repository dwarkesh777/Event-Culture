const EventParticipant = require('../models/EventParticipant');
const UserPass = require('../models/UserPass');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get all participants for an event with search, filtering, and pagination
 */
const getEventParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { search, status, ticketType, role, page = 1, limit = 50 } = req.query;

    const query = { eventId: id };

    if (status) {
      query.status = status;
    }

    if (ticketType) {
      query.ticketType = ticketType;
    }

    if (role) {
      query.role = role;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex },
        { registrationId: searchRegex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await EventParticipant.countDocuments(query);
    const participants = await EventParticipant.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Attach pass counts
    const participantsWithPasses = await Promise.all(
      participants.map(async (p) => {
        const passes = await UserPass.find({ participantId: p._id }).populate('passTypeId', 'name category color icon');
        return {
          ...p.toObject(),
          passes,
        };
      })
    );

    return successResponse(res, 'Participants fetched successfully', {
      participants: participantsWithPasses,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single participant details by ID
 */
const getParticipantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const participant = await EventParticipant.findById(id).populate('eventId', 'name startDate endDate bannerImage');

    if (!participant) {
      return errorResponse(res, 'Participant not found', 404);
    }

    const passes = await UserPass.find({ participantId: participant._id })
      .populate('passTypeId')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Participant details fetched', {
      ...participant.toObject(),
      passes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Participant details
 */
const updateParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const participant = await EventParticipant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!participant) {
      return errorResponse(res, 'Participant not found', 404);
    }

    return successResponse(res, 'Participant updated successfully', participant);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Participant & associated passes
 */
const deleteParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const participant = await EventParticipant.findById(id);

    if (!participant) {
      return errorResponse(res, 'Participant not found', 404);
    }

    await UserPass.deleteMany({ participantId: id });
    await EventParticipant.findByIdAndDelete(id);

    return successResponse(res, 'Participant and assigned passes removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventParticipants,
  getParticipantById,
  updateParticipant,
  deleteParticipant,
};
