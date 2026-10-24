const crypto = require('crypto');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Shape a registration for API responses */
const formatRegistration = (reg) => ({
  id: reg.id || reg._id,
  status: reg.status,
  qrToken: reg.qrToken,
  checkedIn: reg.checkedIn,
  checkedInAt: reg.checkedInAt,
  createdAt: reg.createdAt,
  event: reg.event,
  user: reg.user,
});

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/registrations
 * Attendee registers for an event.
 * Follows exact seat safety contract:
 * - Validate event existence, published status, registration deadline, capacity
 * - Check if already registered (409)
 * - If cancelled registration exists: re-activate using atomic seat decrement
 * - Otherwise: create registration first (unique index prevents duplicates),
 *   then decrement seat count atomically. If decrement fails, delete registration and return 400.
 */
const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const now = new Date();

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not published.' });
    }

    if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
      return res.status(400).json({ message: 'Registration deadline has passed.' });
    }

    if (event.seatsAvailable <= 0) {
      return res.status(400).json({ message: 'Event is full. No seats available.' });
    }

    const existing = await Registration.findOne({ user: userId, event: eventId });

    if (existing && existing.status === 'registered') {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }

    // Atomic seat decrement filter
    const seatDecrementFilter = {
      _id: eventId,
      status: 'published',
      seatsAvailable: { $gt: 0 },
      registrationDeadline: { $gte: now },
    };

    if (existing && existing.status === 'cancelled') {
      // Re-activate cancelled registration with atomic seat decrement
      const updatedEvent = await Event.findOneAndUpdate(
        seatDecrementFilter,
        { $inc: { seatsAvailable: -1 } },
        { new: true }
      );

      if (!updatedEvent) {
        const freshEvent = await Event.findById(eventId);
        if (freshEvent.status !== 'published') {
          return res.status(400).json({ message: 'Event is not published.' });
        }
        if (freshEvent.registrationDeadline && new Date(freshEvent.registrationDeadline) < now) {
          return res.status(400).json({ message: 'Registration deadline has passed.' });
        }
        return res.status(400).json({ message: 'Event is full. No seats available.' });
      }

      existing.status = 'registered';
      existing.qrToken = crypto.randomBytes(12).toString('hex');
      existing.checkedIn = false;
      existing.checkedInAt = null;
      await existing.save();

      return res.status(201).json({ registration: formatRegistration(existing) });
    }

    // New registration: Create first so unique compound index blocks duplicates
    let registration;
    try {
      registration = await Registration.create({
        user: userId,
        event: eventId,
        status: 'registered',
        qrToken: crypto.randomBytes(12).toString('hex'),
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        return res.status(409).json({ message: 'You are already registered for this event.' });
      }
      throw createErr;
    }

    // Now decrement seat atomically
    const updatedEvent = await Event.findOneAndUpdate(
      seatDecrementFilter,
      { $inc: { seatsAvailable: -1 } },
      { new: true }
    );

    if (!updatedEvent) {
      // Seat decrement failed: clean up registration
      await Registration.findByIdAndDelete(registration._id);
      const freshEvent = await Event.findById(eventId);
      if (freshEvent.status !== 'published') {
        return res.status(400).json({ message: 'Event is not published.' });
      }
      if (freshEvent.registrationDeadline && new Date(freshEvent.registrationDeadline) < now) {
        return res.status(400).json({ message: 'Registration deadline has passed.' });
      }
      return res.status(400).json({ message: 'Event is full. No seats available.' });
    }

    return res.status(201).json({ registration: formatRegistration(registration) });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/registrations/:id
 * Cancel a registration (owner only).
 * Refunds one seat, capped at capacity.
 * Only allowed if event has not started.
 */
const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id).populate('event');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    // Check ownership
    const regUserId = registration.user?._id ? registration.user._id.toString() : registration.user.toString();
    if (regUserId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only cancel your own registration.' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled.' });
    }

    const event = registration.event;
    if (!event) {
      return res.status(404).json({ message: 'Associated event not found.' });
    }

    const now = new Date();
    if (event.startDate && new Date(event.startDate) <= now) {
      return res.status(400).json({ message: 'Cannot cancel registration after the event has started.' });
    }

    // Mark as cancelled
    registration.status = 'cancelled';
    await registration.save();

    // Increment seatsAvailable capped at capacity
    await Event.findOneAndUpdate(
      {
        _id: event._id,
        $expr: { $lt: ['$seatsAvailable', '$capacity'] }
      },
      { $inc: { seatsAvailable: 1 } }
    );

    return res.json({ registration: formatRegistration(registration) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/registrations/mine
 * All registrations for the logged-in user, newest first with populated event.
 */
const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ user: req.user.id })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.json({
      registrations: registrations.map((r) => formatRegistration(r)),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/registrations/status/:eventId
 * Returns whether current user is registered for an event.
 */
const getRegistrationStatus = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      user: req.user.id,
      event: req.params.eventId,
      status: 'registered',
    });

    return res.json({
      registered: Boolean(registration),
      registration: registration ? formatRegistration(registration) : null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/registrations/event/:eventId
 * All registrations for an event — event owner only.
 */
const getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const organizerId = event.organizer?._id ? event.organizer._id.toString() : event.organizer.toString();
    if (organizerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this event.' });
    }

    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      registrations: registrations.map((r) => ({
        id: r.id || r._id,
        status: r.status,
        checkedIn: r.checkedIn,
        createdAt: r.createdAt,
        user: r.user
          ? { name: r.user.name, email: r.user.email }
          : null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getRegistrationStatus,
  getEventRegistrations,
};
