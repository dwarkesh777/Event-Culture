const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const passController = require('../controllers/pass.controller');
const participantController = require('../controllers/participant.controller');
const volunteerController = require('../controllers/volunteer.controller');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadCsv } = require('../middleware/upload.middleware');

// Public / Authenticated Event Routes
router.get('/', authenticate, eventController.getEvents);
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), eventController.createEvent);
router.get('/:id', authenticate, eventController.getEventById);
router.patch('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), eventController.updateEvent);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), eventController.deleteEvent);
router.delete('/:id/clear-data', authenticate, authorize('ORGANIZER', 'ADMIN'), eventController.clearEventData);

// CSV Import Routes
router.post('/:id/preview-csv', authenticate, authorize('ORGANIZER', 'ADMIN'), uploadCsv.single('file'), eventController.previewCsvHandler);
router.post('/:id/import-csv', authenticate, authorize('ORGANIZER', 'ADMIN'), uploadCsv.single('file'), eventController.importCsvHandler);
router.get('/:id/imports', authenticate, authorize('ORGANIZER', 'ADMIN'), eventController.getImportsHistory);

// Event Participants Routes
router.get('/:id/participants', authenticate, authorize('ORGANIZER', 'ADMIN', 'VOLUNTEER'), participantController.getEventParticipants);

// Event Pass Types Routes
router.post('/:id/pass-types', authenticate, authorize('ORGANIZER', 'ADMIN'), passController.createPassType);
router.get('/:id/pass-types', authenticate, passController.getEventPassTypes);

// Event Volunteers Routes
router.post('/:id/volunteers', authenticate, authorize('ORGANIZER', 'ADMIN'), volunteerController.addVolunteer);
router.get('/:id/volunteers', authenticate, authorize('ORGANIZER', 'ADMIN'), volunteerController.getEventVolunteers);

// Event Analytics & Live Stream
router.get('/:id/analytics', authenticate, authorize('ORGANIZER', 'ADMIN'), analyticsController.getEventAnalytics);
router.get('/:id/recent-scans', authenticate, authorize('ORGANIZER', 'ADMIN'), analyticsController.getRecentScans);

module.exports = router;
