const express = require('express');
const router = express.Router();
const passController = require('../controllers/pass.controller');
const scanController = require('../controllers/scan.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Pass validation & scanning aliases
router.post('/validate', authenticate, authorize('VOLUNTEER', 'ORGANIZER', 'ADMIN'), scanController.validatePassHandler);
router.post('/scan', authenticate, authorize('VOLUNTEER', 'ORGANIZER', 'ADMIN'), scanController.scanPassHandler);

// Pass Type modifications
router.patch('/types/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), passController.updatePassType);
router.delete('/types/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), passController.deletePassType);

// Pass Assignment
router.post('/assign', authenticate, authorize('ORGANIZER', 'ADMIN'), passController.assignPassHandler);
router.post('/bulk-assign', authenticate, authorize('ORGANIZER', 'ADMIN'), passController.bulkAssignPassHandler);

// Participant Pass Retrieval
router.get('/my-passes', authenticate, passController.getMyPasses);
router.get('/:id', authenticate, passController.getPassById);

module.exports = router;
