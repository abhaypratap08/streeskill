const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/user');
const communityRoutes = require('./routes/community');
const marketplaceRoutes = require('./routes/marketplace');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const searchRoutes = require('./routes/search');
const youtubeRoutes = require('./routes/youtube');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/products', marketplaceRoutes);

// Orders route - maps to /seller endpoint in marketplace
app.get('/api/v1/orders', (req, res, next) => {
  req.url = '/seller';
  marketplaceRoutes(req, res, next);
});

// Earnings route - maps to /summary endpoint in marketplace
app.get('/api/v1/earnings', (req, res, next) => {
  req.url = '/summary';
  marketplaceRoutes(req, res, next);
});
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1', searchRoutes);
app.use('/api/v1/youtube', youtubeRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 StreeSkill API running on http://localhost:${PORT}`);
  console.log(`📚 API Base: http://localhost:${PORT}/api/v1`);
});
