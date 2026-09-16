require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/database');
const redisClient = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    const redisCheck = await redisClient.ping();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbCheck ? 'connected' : 'disconnected',
      redis: redisCheck ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message
    });
  }
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.API_PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 VAWUG Backend API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = server;
