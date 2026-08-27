const multer = require('multer');

// Store files in memory buffer for streaming to Cloudinary or parsing CSV
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed!'), false);
  }
};

// File filter for CSV
const csvFilter = (req, file, cb) => {
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    file.originalname.endsWith('.csv')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files (.csv) are allowed!'), false);
  }
};

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max image size
});

const uploadCsv = multer({
  storage,
  fileFilter: csvFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max CSV size
});

module.exports = {
  uploadImage,
  uploadCsv,
};
