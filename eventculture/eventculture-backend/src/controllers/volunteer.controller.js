const VolunteerAssignment = require('../models/VolunteerAssignment');
const User = require('../models/User');
const Event = require('../models/Event');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { normalizeEmail } = require('../services/csv.service');

/**
 * Add / Assign volunteer to event
 */
const addVolunteer = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { email, name, mobileNumber, permissions, allowedPassTypes } = req.body;

    if (!email) {
      return errorResponse(res, 'Volunteer email is required', 400);
    }

    const cleanEmail = normalizeEmail(email);

    const event = await Event.findById(eventId);
    const organizerId = event ? event.organizerId : req.user._id;
    const organizerCode = event ? event.organizerCode : (req.user.organizerCode || '');

    // Find or create volunteer User record
    let volunteer = await User.findOne({ email: cleanEmail });
    if (!volunteer) {
      volunteer = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        mobileNumber: mobileNumber || '',
        role: 'VOLUNTEER',
        assignedOrganizerCode: organizerCode,
        isVerified: true,
      });
    } else {
      if (volunteer.role === 'USER') {
        volunteer.role = 'VOLUNTEER';
      }
      if (organizerCode && !volunteer.assignedOrganizerCode) {
        volunteer.assignedOrganizerCode = organizerCode;
      }
      await volunteer.save();
    }

    // Upsert volunteer assignment
    const assignment = await VolunteerAssignment.findOneAndUpdate(
      { volunteerId: volunteer._id, eventId },
      {
        $set: {
          organizerId,
          organizerCode,
          permissions: permissions || ['ENTRY', 'FOOD', 'GOODIE_BAG'],
          allowedPassTypes: allowedPassTypes || [],
          isActive: true,
        },
      },
      { upsert: true, new: true }
    ).populate('volunteerId', 'name email mobileNumber profileImage');

    return successResponse(res, 'Volunteer assigned successfully', assignment, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all volunteers for an event
 */
const getEventVolunteers = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const volunteers = await VolunteerAssignment.find({ eventId })
      .populate('volunteerId', 'name email mobileNumber profileImage')
      .populate('allowedPassTypes', 'name category color icon')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Volunteers fetched', volunteers);
  } catch (error) {
    next(error);
  }
};

/**
 * Update volunteer assignment
 */
const updateVolunteerAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await VolunteerAssignment.findByIdAndUpdate(id, req.body, { new: true })
      .populate('volunteerId', 'name email mobileNumber profileImage')
      .populate('allowedPassTypes');

    if (!updated) {
      return errorResponse(res, 'Volunteer assignment not found', 404);
    }

    return successResponse(res, 'Volunteer assignment updated', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete / Unassign volunteer from event
 */
const deleteVolunteerAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await VolunteerAssignment.findByIdAndDelete(id);
    if (!deleted) {
      return errorResponse(res, 'Volunteer assignment not found', 404);
    }
    return successResponse(res, 'Volunteer assignment removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get volunteer's own assignment for an event
 */
const getMyAssignment = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const assignment = await VolunteerAssignment.findOne({
      volunteerId: req.user._id,
      eventId,
      isActive: true,
    }).populate('allowedPassTypes');

    if (!assignment) {
      return errorResponse(res, 'No active volunteer assignment found for this event', 404);
    }

    return successResponse(res, 'Assignment fetched', assignment);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addVolunteer,
  getEventVolunteers,
  updateVolunteerAssignment,
  deleteVolunteerAssignment,
  getMyAssignment,
};
