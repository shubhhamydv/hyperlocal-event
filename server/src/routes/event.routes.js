// Event routes definition

const express = require('express');
const { protect, requireRole, optionalAuth } = require('../middleware/auth');
const {
  createEvent,
  getEvents,
  getMyEvents,
  getEvent,
  updateEvent,
  cancelEvent,
} = require('../controllers/event.controller');

const router = express.Router();

// Public list
router.get('/', getEvents);

// Organizer's own events – must appear before '/:id'
router.get('/mine', protect, requireRole('organizer'), getMyEvents);

// Create event (organizer only)
router.post('/', protect, requireRole('organizer'), createEvent);

// Get single event (optional auth)
router.get('/:id', optionalAuth, getEvent);

// Update event (owner only)
router.patch('/:id', protect, requireRole('organizer'), updateEvent);

// Cancel event (owner only)
router.post('/:id/cancel', protect, requireRole('organizer'), cancelEvent);

module.exports = {
  basePath: '/events',
  router,
};
