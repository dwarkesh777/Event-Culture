const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteer.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/me/assignments/:eventId', authenticate, authorize('VOLUNTEER'), volunteerController.getMyAssignment);
router.patch('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), volunteerController.updateVolunteerAssignment);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), volunteerController.deleteVolunteerAssignment);

module.exports = router;
