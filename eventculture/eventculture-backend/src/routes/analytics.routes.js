const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), analyticsController.getEventAnalytics);
router.get('/:id/recent', authenticate, authorize('ORGANIZER', 'ADMIN'), analyticsController.getRecentScans);

module.exports = router;
