const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participant.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/:id', authenticate, participantController.getParticipantById);
router.patch('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), participantController.updateParticipant);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), participantController.deleteParticipant);

module.exports = router;
