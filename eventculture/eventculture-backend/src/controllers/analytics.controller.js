const EventParticipant = require('../models/EventParticipant');
const UserPass = require('../models/UserPass');
const PassType = require('../models/PassType');
const ScanLog = require('../models/ScanLog');
const VolunteerAssignment = require('../models/VolunteerAssignment');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Get Real-time Event Operations Analytics
 */
const getEventAnalytics = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;

    // 1. Total participants & checked-in
    const totalParticipants = await EventParticipant.countDocuments({ eventId });
    const checkedInCount = await EventParticipant.countDocuments({ eventId, status: 'CHECKED_IN' });

    // 2. Pass category breakdowns
    const passTypes = await PassType.find({ eventId });
    const passTypeStats = await Promise.all(
      passTypes.map(async (pt) => {
        const totalAssigned = await UserPass.countDocuments({ passTypeId: pt._id });
        const redeemedCount = await UserPass.countDocuments({ passTypeId: pt._id, usedCount: { $gt: 0 } });
        return {
          id: pt._id,
          name: pt.name,
          category: pt.category,
          color: pt.color,
          icon: pt.icon,
          totalAssigned,
          redeemedCount,
          redemptionRate: totalAssigned > 0 ? Math.round((redeemedCount / totalAssigned) * 100) : 0,
        };
      })
    );

    // 3. Scan counts by result
    const totalScans = await ScanLog.countDocuments({ eventId });
    const successfulScans = await ScanLog.countDocuments({ eventId, result: 'SUCCESS' });
    const alreadyUsedScans = await ScanLog.countDocuments({ eventId, result: 'ALREADY_USED' });
    const invalidScans = await ScanLog.countDocuments({ eventId, result: { $in: ['INVALID', 'EXPIRED', 'UNAUTHORIZED'] } });

    // 4. Quick key metrics: Food redeemed, Goodie bags collected
    const foodPassTypeIds = passTypes.filter((pt) => pt.category === 'FOOD').map((pt) => pt._id);
    const goodiePassTypeIds = passTypes.filter((pt) => pt.category === 'GOODIE_BAG').map((pt) => pt._id);

    const foodRedeemed = await UserPass.countDocuments({
      eventId,
      passTypeId: { $in: foodPassTypeIds },
      usedCount: { $gt: 0 },
    });

    const goodieBagsCollected = await UserPass.countDocuments({
      eventId,
      passTypeId: { $in: goodiePassTypeIds },
      usedCount: { $gt: 0 },
    });

    // 5. Active volunteers count
    const totalVolunteers = await VolunteerAssignment.countDocuments({ eventId, isActive: true });

    return successResponse(res, 'Event analytics fetched', {
      totalParticipants,
      checkedInCount,
      checkInPercentage: totalParticipants > 0 ? Math.round((checkedInCount / totalParticipants) * 100) : 0,
      foodRedeemed,
      goodieBagsCollected,
      totalScans,
      successfulScans,
      alreadyUsedScans,
      invalidScans,
      totalVolunteers,
      passTypeStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Recent Live Scan Activity
 */
const getRecentScans = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { limit = 20 } = req.query;

    const recentScans = await ScanLog.find({ eventId })
      .populate('passTypeId', 'name category color icon')
      .populate('participantId', 'name email mobileNumber registrationId ticketType')
      .populate('volunteerId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return successResponse(res, 'Recent scan activity fetched', recentScans);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEventAnalytics,
  getRecentScans,
};
