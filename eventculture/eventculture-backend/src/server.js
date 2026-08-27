const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/database');

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`
===================================================
🚀 EVENTCULTURE BACKEND API SERVER RUNNING
===================================================
Port:        ${env.PORT}
Environment: ${env.NODE_ENV}
Database:    ${env.MONGODB_URI}
Tagline:     ONE SCAN. ZERO QUEUES.
Health Check: http://localhost:${env.PORT}/health
===================================================
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
};

startServer();
