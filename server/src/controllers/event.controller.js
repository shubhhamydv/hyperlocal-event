// Event controller implementation

const Event = require('../models/Event');
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function buildPublicFilters(req) {
  const now = new Date();
  const filters = { status: 'published', startDate: { $gte: now } };
  const { category, mode, free, q } = req.query;
  if (category) filters.category = category;
  if (mode) filters.mode = mode;
  if (free === 'true') filters.price = 0;
  if (q) {
    const regex = new RegExp(q, 'i');
    filters.$or = [{ title: regex }, { description: regex }, { 'venue.city': regex }];
  }
  return filters;
}

// CREATE event (organizer only)
const createEvent = asyncHandler(async (req, res) => {
  const organizerId = req.user.id;
  const event = await Event.create({ ...req.body, organizer: organizerId });
  res.status(201).json({ event });
});

// LIST public events (geo optional)
const getEvents = asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm = 25, page = 1, limit = 20 } = req.query;
  const filters = buildPublicFilters(req);
  const skip = (Number(page) - 1) * Number(limit);

  if (lat && lng) {
    const pipeline = [
      { $geoNear: {
          near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          distanceField: 'distanceKm',
          distanceMultiplier: 0.001,
          maxDistance: Number(radiusKm) * 1000,
          query: filters,
          spherical: true,
        }
      },
      { $sort: { distanceKm: 1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      { $facet: {
          events: [{ $addFields: { distanceKm: { $round: ['$distanceKm', 2] } } }],
          total: [{ $count: 'count' }],
        }
      },
      { $project: { events: 1, total: { $arrayElemAt: ['$total.count', 0] } } },
    ];
    const result = await Event.aggregate(pipeline);
    const { events = [], total = 0 } = result[0] || {};
    return res.json({ events, total });
  }

  const total = await Event.countDocuments(filters);
  const events = await Event.find(filters)
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();
  res.json({ events, total });
});

// GET events owned by organizer
const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ organizer: req.user.id }).sort({ startDate: -1 }).lean();
  res.json({ events });
});

// GET single event (optional auth)
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.status === 'draft' && (!req.user || req.user.id !== String(event.organizer))) {
    return res.status(404).json({ message: 'Event not found' });
  }
  if (event.status === 'cancelled' && (!req.user || req.user.id !== String(event.organizer))) {
    return res.status(404).json({ message: 'Event not found' });
  }
  res.json({ event });
});

// UPDATE event (owner only)
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (String(event.organizer) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  Object.assign(event, req.body);
  await event.save();
  res.json({ event });
});

// CANCEL event (owner only)
const cancelEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (String(event.organizer) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  event.status = 'cancelled';
  await event.save();
  res.json({ event });
});

module.exports = { createEvent, getEvents, getMyEvents, getEvent, updateEvent, cancelEvent };
