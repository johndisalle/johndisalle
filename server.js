require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/obligations', require('./routes/obligations'));
app.use('/api/completions', require('./routes/completions'));
app.use('/api/snoozes', require('./routes/snoozes'));
app.use('/api/technicians', require('./routes/technicians'));
app.use('/api/activity', require('./routes/activity'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function start() {
  try {
    console.log(`Starting server on port ${PORT}...`);
    const dbUrl = process.env.DATABASE_URL || '';
    const dbHost = dbUrl ? new URL(dbUrl).host : 'N/A';
    console.log(`DATABASE_URL is set, host: ${dbHost}`);
    console.log(`JWT_SECRET is ${process.env.JWT_SECRET ? 'set' : 'NOT SET'}`);
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Dove IT Obligations Tracker running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

start();
