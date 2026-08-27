const { uploadImageBuffer, deleteImage } = require('../services/cloudinary.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Upload single image to Cloudinary
 */
const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No image file uploaded', 400);
    }

    const folder = req.body.folder || 'eventculture';
    const result = await uploadImageBuffer(req.file.buffer, folder);

    return successResponse(res, 'Image uploaded successfully', {
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete image from Cloudinary
 */
const deleteImageHandler = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return errorResponse(res, 'Image public ID is required', 400);
    }

    await deleteImage(publicId);
    return successResponse(res, 'Image deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingleImage,
  deleteImageHandler,
};
