const UserPass = require('../models/UserPass');
const PassType = require('../models/PassType');
const VolunteerAssignment = require('../models/VolunteerAssignment');
const ScanLog = require('../models/ScanLog');
const EventParticipant = require('../models/EventParticipant');
const Event = require('../models/Event');

/**
 * Validate QR pass (Pre-check before redemption)
 */
const validatePass = async (qrToken, volunteerUserId, location = '', deviceId = '', expectedPassTypeId = null) => {
  if (!qrToken) {
    return {
      status: 'INVALID',
      message: 'No QR token provided',
    };
  }

  // 1. Look up UserPass by secure random QR token
  const pass = await UserPass.findOne({ qrToken })
    .populate('eventId', 'name status startDate endDate')
    .populate('passTypeId')
    .populate('participantId', 'name email mobileNumber registrationId ticketType csvData');

  if (!pass) {
    return {
      status: 'INVALID',
      message: 'Pass does not exist or invalid QR code format.',
    };
  }

  // 1b. Check if this is the expected pass type (if specified)
  if (expectedPassTypeId && pass.passTypeId._id.toString() !== expectedPassTypeId.toString()) {
    return {
      status: 'INVALID',
      message: `Invalid Pass Type! Expected a different pass, but scanned: ${pass.passTypeId.name}`,
    };
  }

  // 2. Validate volunteer assignment and permissions for this event
  const assignment = await VolunteerAssignment.findOne({
    volunteerId: volunteerUserId,
    eventId: pass.eventId._id,
    isActive: true,
  });

  if (!assignment) {
    // Log unauthorized attempt
    await ScanLog.create({
      eventId: pass.eventId._id,
      passId: pass._id,
      participantId: pass.participantId._id,
      volunteerId: volunteerUserId,
      passTypeId: pass.passTypeId._id,
      result: 'UNAUTHORIZED',
      message: 'Volunteer is not assigned to this event or is deactivated.',
      location,
      deviceId,
    });

    return {
      status: 'UNAUTHORIZED',
      message: 'You are not assigned to volunteer for this event.',
      passInfo: {
        eventName: pass.eventId.name,
      },
    };
  }

  // Check category permission
  const requiredPermission = pass.passTypeId.requiredPermission;
  const hasPermission =
    assignment.permissions.includes('ALL') ||
    assignment.permissions.includes(requiredPermission) ||
    assignment.allowedPassTypes.some((ptId) => ptId.toString() === pass.passTypeId._id.toString());

  if (!hasPermission) {
    await ScanLog.create({
      eventId: pass.eventId._id,
      passId: pass._id,
      participantId: pass.participantId._id,
      volunteerId: volunteerUserId,
      passTypeId: pass.passTypeId._id,
      result: 'UNAUTHORIZED',
      message: `Volunteer lacks '${requiredPermission}' permission.`,
      location,
      deviceId,
    });

    return {
      status: 'UNAUTHORIZED',
      message: `You do not have permission to scan ${pass.passTypeId.name} passes. Required permission: ${requiredPermission}.`,
      passInfo: {
        passName: pass.passTypeId.name,
        participantName: pass.participantId.name,
      },
    };
  }

  // 3. Check pass status & scan limits
  if (pass.status === 'USED' || pass.usedCount >= pass.scanLimit) {
    const lastScan = await ScanLog.findOne({ passId: pass._id, result: 'SUCCESS' }).sort({ createdAt: -1 });

    return {
      status: 'ALREADY_USED',
      message: `This pass was already redeemed (${pass.usedCount}/${pass.scanLimit} scans used).`,
      passInfo: {
        passName: pass.passTypeId.name,
        participantName: pass.participantId.name,
        registrationId: pass.participantId.registrationId,
        lastUsedAt: lastScan ? lastScan.createdAt : pass.updatedAt,
      },
    };
  }

  // Prevent multiple scans on the same day for multi-use passes
  if (pass.scanLimit > 1 && pass.usedCount > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastScanToday = await ScanLog.findOne({
      passId: pass._id,
      result: 'SUCCESS',
      createdAt: { $gte: today }
    });

    if (lastScanToday) {
      return {
        status: 'ALREADY_USED_TODAY',
        message: `This pass has already been scanned today. Please try again tomorrow.`,
        passInfo: {
          passName: pass.passTypeId.name,
          participantName: pass.participantId.name,
          registrationId: pass.participantId.registrationId,
          lastUsedAt: lastScanToday.createdAt,
        },
      };
    }
  }

  if (pass.status === 'DISABLED') {
    return {
      status: 'INVALID',
      message: 'This pass has been disabled by the event organizer.',
    };
  }

  // 4. Check validity window
  const now = new Date();
  if (pass.validFrom && now < new Date(pass.validFrom)) {
    return {
      status: 'EXPIRED',
      message: `This pass is not active yet. Valid from: ${new Date(pass.validFrom).toLocaleTimeString()}`,
    };
  }

  if (pass.validUntil && now > new Date(pass.validUntil)) {
    return {
      status: 'EXPIRED',
      message: `This pass expired on ${new Date(pass.validUntil).toLocaleTimeString()}`,
    };
  }

  // Pass is Valid & Ready for redemption
  return {
    status: 'SUCCESS',
    message: 'Pass is valid and ready to be redeemed.',
    passInfo: {
      passId: pass._id,
      qrToken: pass.qrToken,
      passName: pass.passTypeId.name,
      passCategory: pass.passTypeId.category,
      color: pass.passTypeId.color,
      icon: pass.passTypeId.icon,
      eventName: pass.eventId.name,
      participantName: pass.participantId.name,
      registrationId: pass.participantId.registrationId,
      email: pass.participantId.email,
      ticketType: pass.participantId.ticketType,
      usedCount: pass.usedCount,
      scanLimit: pass.scanLimit,
    },
  };
};

/**
 * Redeem QR pass with Atomic MongoDB Concurrency Protection
 */
const redeemPass = async (qrToken, volunteerUserId, location = '', deviceId = '', expectedPassTypeId = null) => {
  // 1. First validate pass & permissions
  const validation = await validatePass(qrToken, volunteerUserId, location, deviceId, expectedPassTypeId);
  if (validation.status !== 'SUCCESS') {
    return validation;
  }

  const pass = await UserPass.findOne({ qrToken })
    .populate('eventId')
    .populate('passTypeId')
    .populate('participantId');

  // 2. ATOMIC UPDATE: Ensure usedCount is still strictly less than scanLimit
  // This prevents race conditions when multiple scanners scan identical QR code simultaneously.
  const updatedPass = await UserPass.findOneAndUpdate(
    {
      _id: pass._id,
      status: { $in: ['ACTIVE'] },
      $expr: { $lt: ['$usedCount', '$scanLimit'] },
    },
    [
      {
        $set: {
          usedCount: { $add: ['$usedCount', 1] },
          status: {
            $cond: {
              if: { $gte: [{ $add: ['$usedCount', 1] }, '$scanLimit'] },
              then: 'USED',
              else: 'ACTIVE',
            },
          },
        },
      },
    ],
    { new: true }
  );

  if (!updatedPass) {
    // Atomic update failed because another scan won the race
    await ScanLog.create({
      eventId: pass.eventId._id,
      passId: pass._id,
      participantId: pass.participantId._id,
      volunteerId: volunteerUserId,
      passTypeId: pass.passTypeId._id,
      result: 'ALREADY_USED',
      message: 'Concurrent scan conflict: pass was just redeemed by another volunteer.',
      location,
      deviceId,
    });

    return {
      status: 'ALREADY_USED',
      message: 'Pass was just redeemed a moment ago.',
      passInfo: {
        passName: pass.passTypeId.name,
        participantName: pass.participantId.name,
      },
    };
  }

  // 3. Mark participant checked in if this was an entry pass
  if (pass.passTypeId.category === 'ENTRY') {
    await EventParticipant.findByIdAndUpdate(pass.participantId._id, {
      status: 'CHECKED_IN',
    });
  }

  // 4. Create successful ScanLog record
  const scanLog = await ScanLog.create({
    eventId: pass.eventId._id,
    passId: pass._id,
    participantId: pass.participantId._id,
    volunteerId: volunteerUserId,
    passTypeId: pass.passTypeId._id,
    scanTime: new Date(),
    result: 'SUCCESS',
    message: 'Pass successfully redeemed.',
    location,
    deviceId,
  });

  return {
    status: 'SUCCESS',
    message: 'Pass redeemed successfully!',
    scanId: scanLog._id,
    passInfo: {
      passName: pass.passTypeId.name,
      participantName: pass.participantId.name,
      registrationId: pass.participantId.registrationId,
      usedCount: updatedPass.usedCount,
      scanLimit: updatedPass.scanLimit,
      redeemedAt: scanLog.scanTime,
    },
  };
};

module.exports = {
  validatePass,
  redeemPass,
};
