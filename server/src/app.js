require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mountRoutes = require('./routes/index');
const errorMiddleware = require('./middleware/error');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── HTTP logger ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health check (before route auto-mount so it's always available) ───────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auto-mount all *.routes.js files ─────────────────────────────────────────
mountRoutes(app);

// ── Global error handler (must be last middleware) ────────────────────────────
app.use(errorMiddleware);

module.exports = app;
