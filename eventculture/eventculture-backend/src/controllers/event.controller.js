const Event = require('../models/Event');
const EventParticipant = require('../models/EventParticipant');
const PassType = require('../models/PassType');
const UserPass = require('../models/UserPass');
const VolunteerAssignment = require('../models/VolunteerAssignment');
const CsvImport = require('../models/CsvImport');
const { previewCsv, importCsv } = require('../services/csv.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Create a new event (Organizer / Admin)
 */
const createEvent = async (req, res, next) => {
  try {
    const { name, description, location, startDate, endDate, bannerImage, status } = req.body;

    if (!name || !startDate || !endDate) {
      return errorResponse(res, 'Event name, start date, and end date are required.', 400);
    }

    const organizerCode = req.user.organizerCode || '';
    const folderPath = req.user.folderName || (organizerCode ? `organizers/${organizerCode.toLowerCase()}` : '');

    const newEvent = await Event.create({
      organizerId: req.user._id,
      organizerCode,
      folderPath,
      name,
      description: description || '',
      location: location || {},
      startDate,
      endDate,
      bannerImage: bannerImage || {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
        publicId: '',
      },
      status: status || 'UPCOMING',
    });

    // Auto-create default "Event Entry" pass type
    await PassType.create({
      eventId: newEvent._id,
      organizerId: req.user._id,
      organizerCode,
      name: 'Event Entry Pass',
      description: 'Standard event access pass',
      category: 'ENTRY',
      scanLimit: 1,
      validFrom: startDate,
      validUntil: endDate,
      icon: 'ticket-outline',
      color: '#1565F9',
      requiredPermission: 'ENTRY',
    });

    return successResponse(res, 'Event created successfully', newEvent, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all events (with role-based filtering)
 */
const getEvents = async (req, res, next) => {
  try {
    const query = {};

    // If organizer, only fetch their events (unless admin)
    if (req.user && req.user.role === 'ORGANIZER') {
      query.organizerId = req.user._id;
    }

    // If volunteer, only fetch events assigned to them
    if (req.user && req.user.role === 'VOLUNTEER') {
      const assignments = await VolunteerAssignment.find({
        volunteerId: req.user._id,
        isActive: true,
      }).select('eventId');
      const assignedEventIds = assignments.map((a) => a.eventId);
      query._id = { $in: assignedEventIds };
    }

    let participations = [];
    if (req.user && req.user.role === 'USER') {
      const userOrConditions = [{ userId: req.user._id }];
      if (req.user.email) {
        userOrConditions.push({ email: req.user.email.toLowerCase() });
      }
      if (req.user.mobileNumber) {
        userOrConditions.push({ mobileNumber: req.user.mobileNumber });
      }
      
      participations = await EventParticipant.find({
        $or: userOrConditions
      }).select('eventId role');
      const participantEventIds = participations.map((p) => p.eventId);
      query._id = { $in: participantEventIds };
    }

    const events = await Event.find(query)
      .populate('organizerId', 'name email organizerCode organizationName folderName')
      .sort({ startDate: -1 });

    // Populate participant counts for each event
    const eventsWithStats = await Promise.all(
      events.map(async (ev) => {
        const participantCount = await EventParticipant.countDocuments({ eventId: ev._id });
        const passTypesCount = await PassType.countDocuments({ eventId: ev._id });
        
        let userRole = null;
        if (req.user && req.user.role === 'USER') {
          const userParticipation = participations.find(p => p.eventId.toString() === ev._id.toString());
          if (userParticipation) {
            userRole = userParticipation.role || 'PARTICIPANT';
          }
        }

        return {
          ...ev.toObject(),
          totalParticipants: participantCount,
          totalPassTypes: passTypesCount,
          userRole,
        };
      })
    );

    return successResponse(res, 'Events fetched successfully', eventsWithStats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single event details by ID
 */
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('organizerId', 'name email mobileNumber profileImage');

    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    const participantCount = await EventParticipant.countDocuments({ eventId: event._id });
    const checkedInCount = await EventParticipant.countDocuments({ eventId: event._id, status: 'CHECKED_IN' });
    const passTypes = await PassType.find({ eventId: event._id });

    return successResponse(res, 'Event details fetched', {
      ...event.toObject(),
      totalParticipants: participantCount,
      checkedInParticipants: checkedInCount,
      passTypes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Event
 */
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    // Check ownership
    if (req.user.role !== 'ADMIN' && event.organizerId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to edit this event', 403);
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return successResponse(res, 'Event updated successfully', updatedEvent);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Event
 */
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    if (req.user.role !== 'ADMIN' && event.organizerId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to delete this event', 403);
    }

    // Cascade delete associated records
    await EventParticipant.deleteMany({ eventId: id });
    await PassType.deleteMany({ eventId: id });
    await UserPass.deleteMany({ eventId: id });
    await VolunteerAssignment.deleteMany({ eventId: id });
    await CsvImport.deleteMany({ eventId: id });
    await Event.findByIdAndDelete(id);

    return successResponse(res, 'Event and all associated records deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Clear Event Data (keep event, remove participants, passes, volunteers, imports)
 */
const clearEventData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    if (req.user.role !== 'ADMIN' && event.organizerId.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Unauthorized to clear this event', 403);
    }

    await EventParticipant.deleteMany({ eventId: id });
    await PassType.deleteMany({ eventId: id });
    await UserPass.deleteMany({ eventId: id });
    await VolunteerAssignment.deleteMany({ eventId: id });
    await CsvImport.deleteMany({ eventId: id });

    return successResponse(res, 'All event data cleared successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Preview CSV file headers and sample rows (POST /api/events/:id/preview-csv)
 */
const previewCsvHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No CSV file uploaded. Please attach a .csv file.', 400);
    }

    const preview = await previewCsv(req.file.buffer);
    return successResponse(res, 'CSV preview parsed successfully', preview);
  } catch (error) {
    next(error);
  }
};

/**
 * Import Participants from CSV with Column Mapping (POST /api/events/:id/import-csv)
 */
const importCsvHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 'Event not found', 404);
    }

    if (!req.file) {
      return errorResponse(res, 'Please upload a CSV file.', 400);
    }

    let columnMapping = {};
    if (req.body.columnMapping) {
      try {
        columnMapping = typeof req.body.columnMapping === 'string'
          ? JSON.parse(req.body.columnMapping)
          : req.body.columnMapping;
      } catch (err) {
        columnMapping = {};
      }
    }

    const result = await importCsv(
      req.file.buffer,
      id,
      req.user._id,
      req.file.originalname,
      columnMapping,
      req.body.role || 'PARTICIPANT'
    );

    // Optionally auto-assign default "Event Entry" pass to newly imported participants
    const defaultEntryPass = await PassType.findOne({ eventId: id, category: 'ENTRY' });
    if (defaultEntryPass) {
      const { bulkAssignPass } = require('../services/pass.service');
      await bulkAssignPass(id, defaultEntryPass._id);
    }

    return successResponse(res, 'CSV participants imported successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get CSV imports history (GET /api/events/:id/imports)
 */
const getImportsHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await CsvImport.find({ eventId: id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Import history retrieved', history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  clearEventData,
  previewCsvHandler,
  importCsvHandler,
  getImportsHistory,
};
