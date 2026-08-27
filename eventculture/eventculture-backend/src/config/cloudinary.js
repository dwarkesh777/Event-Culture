const cloudinary = require('cloudinary').v2;
const env = require('./env');

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('✅ Cloudinary initialized with cloud:', env.CLOUDINARY_CLOUD_NAME);
} else {
  console.warn('⚠️ Cloudinary credentials missing or incomplete. Image uploads will use base64/mock fallback.');
}

module.exports = cloudinary;
