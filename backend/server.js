const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const dbInit = require('./src/database/init');

// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3501;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3200';

// Middleware
app.use(cors({
  origin: FRONTEND_URL, // Frontend URL from environment
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'educonnect-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Import routes
const studentRoutes = require('./src/routes/students');
const authRoutes = require('./src/routes/auth');

// Basic route for health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'EduConnect Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await dbInit.initialize();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`EduConnect Backend server is running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
      console.log(`Using port ${PORT} to avoid conflicts with existing services`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if this file is run directly (not imported for tests)
if (require.main === module) {
  startServer();
}

module.exports = app;