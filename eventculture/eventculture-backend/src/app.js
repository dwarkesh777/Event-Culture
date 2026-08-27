const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const participantRoutes = require('./routes/participant.routes');
const passRoutes = require('./routes/pass.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const scanRoutes = require('./routes/scan.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const uploadRoutes = require('./routes/upload.routes');

const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'EVENTCULTURE API',
    tagline: 'ONE SCAN. ZERO QUEUES.',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to EventCulture API - Real-World Event Operations Platform',
    documentation: '/api',
    status: 'active',
  });
});

// Static files (Privacy Policies, Legal Portal, Public Assets)
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Privacy Policy Routes
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/privacy/user', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/privacy-user.html'));
});

app.get('/privacy/organizer', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/privacy-organizer.html'));
});

app.get('/privacy/volunteer', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/privacy-volunteer.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
