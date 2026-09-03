const app = require('../src/app');
const connectDB = require('../src/config/database');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('API startup error:', error);
    return res.status(503).json({
      success: false,
      message: error.message || 'API temporarily unavailable.',
    });
  }
};
