const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadImage } = require('../middleware/upload.middleware');

router.post('/image', authenticate, uploadImage.single('image'), uploadController.uploadSingleImage);
router.delete('/image/:publicId', authenticate, uploadController.deleteImageHandler);

module.exports = router;
