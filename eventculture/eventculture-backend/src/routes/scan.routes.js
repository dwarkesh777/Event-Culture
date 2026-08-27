const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scan.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Validate pass preview
router.post('/validate', authenticate, authorize('VOLUNTEER', 'ORGANIZER', 'ADMIN'), scanController.validatePassHandler);

// Redeem pass atomically
router.post('/scan', authenticate, authorize('VOLUNTEER', 'ORGANIZER', 'ADMIN'), scanController.scanPassHandler);

// Scan history
router.get('/history', authenticate, authorize('VOLUNTEER', 'ORGANIZER', 'ADMIN'), scanController.getScanHistory);

module.exports = router;
