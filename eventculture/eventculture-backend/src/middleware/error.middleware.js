const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Server Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 'Validation error', 400, messages);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, `A record with this ${field} already exists.`, 409);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return errorResponse(res, `File upload error: ${err.message}`, 400);
  }

  return errorResponse(res, err.message || 'Internal Server Error', err.statusCode || 500);
};

const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
