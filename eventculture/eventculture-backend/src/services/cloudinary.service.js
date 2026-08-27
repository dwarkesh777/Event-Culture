const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image file buffer
 * @param {string} folder - Destination folder in Cloudinary
 * @param {string} publicId - Optional custom public ID
 */
const uploadImageBuffer = async (buffer, folder = 'eventculture', publicId = null) => {
  // If Cloudinary is not configured, generate a high quality data URI placeholder
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    const base64Data = buffer.toString('base64');
    const mockUrl = `data:image/jpeg;base64,${base64Data}`;
    return {
      url: mockUrl,
      publicId: `local_${Date.now()}`,
    };
  }

  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image',
    };
    if (publicId) {
      options.public_id = publicId;
      options.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      });
    });

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

/**
 * Delete image from Cloudinary by public ID
 */
const deleteImage = async (publicId) => {
  if (!publicId || publicId.startsWith('local_')) {
    return { result: 'ok' };
  }

  return cloudinary.uploader.destroy(publicId);
};

module.exports = {
  uploadImageBuffer,
  deleteImage,
};
