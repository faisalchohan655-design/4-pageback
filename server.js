// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import leadsRoutes from './routes/leads.js';
import emailRoutes from './routes/email.js';
import mapsRoutes from './routes/maps.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Advanced CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Routes
app.use('/api/leads', leadsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/maps', mapsRoutes);

// ✅ Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ✅ MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
