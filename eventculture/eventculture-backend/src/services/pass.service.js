const UserPass = require('../models/UserPass');
const PassType = require('../models/PassType');
const EventParticipant = require('../models/EventParticipant');
const { generatePassQRToken } = require('../utils/token');

/**
 * Assign a PassType to a single participant
 */
const assignPassToParticipant = async (eventId, participantId, passTypeId) => {
  const passType = await PassType.findOne({ _id: passTypeId, eventId });
  if (!passType) {
    throw new Error('Pass type not found for this event');
  }

  const participant = await EventParticipant.findOne({ _id: participantId, eventId });
  if (!participant) {
    throw new Error('Participant not found for this event');
  }

  // Check if participant already has an active pass of this type
  const existingPass = await UserPass.findOne({
    eventId,
    participantId,
    passTypeId,
  });

  if (existingPass) {
    return existingPass;
  }

  const qrToken = generatePassQRToken();

  const userPass = await UserPass.create({
    eventId,
    organizerId: passType.organizerId,
    organizerCode: passType.organizerCode,
    participantId,
    passTypeId,
    qrToken,
    status: 'ACTIVE',
    usedCount: 0,
    scanLimit: passType.scanLimit || 1,
    validFrom: passType.validFrom || new Date(),
    validUntil: passType.validUntil,
  });

  return userPass;
};

/**
 * Bulk assign a PassType to ALL participants of an event
 */
const bulkAssignPass = async (eventId, passTypeId, filterCriteria = {}) => {
  const passType = await PassType.findOne({ _id: passTypeId, eventId });
  if (!passType) {
    throw new Error('Pass type not found for this event');
  }

  const query = { eventId, status: { $ne: 'CANCELLED' } };
  if (filterCriteria.ticketType) {
    query.ticketType = filterCriteria.ticketType;
  }
  if (filterCriteria.role) {
    query.role = filterCriteria.role;
  }

  const participants = await EventParticipant.find(query);
  let assignedCount = 0;

  for (const p of participants) {
    const existing = await UserPass.findOne({
      eventId,
      participantId: p._id,
      passTypeId,
    });

    if (!existing) {
      await UserPass.create({
        eventId,
        organizerId: passType.organizerId,
        organizerCode: passType.organizerCode,
        participantId: p._id,
        passTypeId,
        qrToken: generatePassQRToken(),
        status: 'ACTIVE',
        usedCount: 0,
        scanLimit: passType.scanLimit || 1,
        validFrom: passType.validFrom || new Date(),
        validUntil: passType.validUntil,
      });
      assignedCount++;
    }
  }

  return {
    totalEligible: participants.length,
    assignedCount,
  };
};

/**
 * Get all passes for a participant by user email or mobile number
 */
const getParticipantPasses = async (emailOrMobile) => {
  const normalized = emailOrMobile.trim().toLowerCase();

  // Find all participant records matching email or phone
  const participants = await EventParticipant.find({
    $or: [{ email: normalized }, { mobileNumber: normalized }],
  }).select('_id eventId');

  if (!participants || participants.length === 0) {
    return [];
  }

  const participantIds = participants.map((p) => p._id);

  const passes = await UserPass.find({ participantId: { $in: participantIds } })
    .populate({
      path: 'eventId',
      select: 'name description location startDate endDate bannerImage status',
    })
    .populate({
      path: 'passTypeId',
      select: 'name description category icon color scanLimit requiredPermission validFrom validUntil',
    })
    .populate({
      path: 'participantId',
      select: 'name email mobileNumber registrationId ticketType csvData',
    })
    .sort({ createdAt: -1 });

  return passes;
};

module.exports = {
  assignPassToParticipant,
  bulkAssignPass,
  getParticipantPasses,
};
