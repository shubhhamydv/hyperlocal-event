const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getRegistrationStatus,
  getEventRegistrations,
} = require('../controllers/registration.controller');

const router = express.Router();

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/registrations
 * Attendee registers for an event.
 * Organizers cannot register (requireRole blocks them with 403).
 */
router.post(
  '/',
  protect,
  requireRole('attendee'),
  registerForEvent
);

/**
 * GET /api/registrations/mine
 * All registrations for the authenticated user, newest first.
 * Must be declared BEFORE /:id to avoid "mine" being treated as an id.
 */
router.get('/mine', protect, getMyRegistrations);

/**
 * GET /api/registrations/status/:eventId
 * Check if the current user is registered for a specific event.
 */
router.get('/status/:eventId', protect, getRegistrationStatus);

/**
 * GET /api/registrations/event/:eventId
 * All registrations for an event — event owner only.
 */
router.get('/event/:eventId', protect, getEventRegistrations);

/**
 * DELETE /api/registrations/:id
 * Cancel a registration — registration owner only.
 */
router.delete('/:id', protect, cancelRegistration);

module.exports = { basePath: '/registrations', router };
