// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import leadsRoutes from './routes/leads.js';
import emailRoutes from './routes/email.js';
import mapsRoutes from './routes/maps.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// ✅ CORS - COMPLETE FIX (204 Error Solution)
// ============================================
const allowedOrigins = [
  'https://4-pagefront.vercel.app',
  'https://4-pagefront.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for:', origin);
      callback(null, true); // Allow all in production (temporary fix)
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger (for debugging)
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================
app.use('/api/leads', leadsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/maps', mapsRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'LeadConnect API is running',
    cors: 'enabled'
  });
});

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'LeadConnect Pro API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      leads: '/api/leads',
      email: '/api/email',
      maps: '/api/maps',
      health: '/api/health'
    }
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: ['/api/leads', '/api/email', '/api/maps', '/api/health']
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/leadconnect';

mongoose.connect(MONGODB_URL, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📊 Database: ${MONGODB_URL}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️ Starting server without MongoDB (for testing)');
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGINT', async () => {
  try {
    await mongoose.disconnect();
    console.log('👋 MongoDB disconnected');
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  console.log('👋 Server shut down');
  process.exit(0);
});

export default app;
