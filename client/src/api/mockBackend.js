import { INITIAL_USERS, INITIAL_EVENTS } from './mockData';

// Helper: Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function decorateEvent(e) {
  const capacity = e.capacity || 100;
  const seatsAvailable = e.seatsAvailable !== undefined ? e.seatsAvailable : capacity;
  const registeredCount = Math.max(0, capacity - seatsAvailable);
  const now = new Date();
  const deadline = e.registrationDeadline ? new Date(e.registrationDeadline) : new Date(e.startDate);
  const registrationOpen = e.status === 'published' && seatsAvailable > 0 && deadline >= now;

  return {
    ...e,
    tags: Array.isArray(e.tags) ? e.tags : ["Web Development"],
    capacity,
    seatsAvailable,
    registeredCount,
    registrationOpen
  };
}

function getStoredUsers() {
  const data = localStorage.getItem('mock_users');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  localStorage.setItem('mock_users', JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
}

function saveUsers(users) {
  localStorage.setItem('mock_users', JSON.stringify(users));
}

function getStoredEvents() {
  const data = localStorage.getItem('mock_events');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return parsed.map(decorateEvent);
    } catch {
      // fallback
    }
  }
  const decorated = INITIAL_EVENTS.map(decorateEvent);
  localStorage.setItem('mock_events', JSON.stringify(decorated));
  return decorated;
}

function saveEvents(events) {
  localStorage.setItem('mock_events', JSON.stringify(events));
}

function getUserFromToken(token) {
  if (!token) return null;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
  const users = getStoredUsers();
  if (cleanToken.startsWith('mock-jwt-')) {
    const userId = cleanToken.replace('mock-jwt-', '');
    return users.find((u) => u.id === userId) || null;
  }
  return users[0] || null;
}

export function handleMockRequest(config) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const token = config.headers?.Authorization;
  const currentUser = getUserFromToken(token);

  let path = url;
  if (path.startsWith('http')) {
    try {
      path = new URL(url).pathname;
    } catch {
      // fallback
    }
  }
  path = path.replace(/^(\/api)?/, '');

  // 1. POST /auth/register
  if (method === 'post' && path === '/auth/register') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const { name, email, password, role = 'attendee', interests = [], city = '' } = body;

    if (!name || !email || !password) {
      return {
        status: 400,
        data: { message: "Name, email, and password are required" }
      };
    }

    const users = getStoredUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return {
        status: 400,
        data: { message: "An account with this email already exists" }
      };
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email,
      password,
      role,
      interests: Array.isArray(interests) ? interests : [],
      city
    };

    users.push(newUser);
    saveUsers(users);

    const mockToken = `mock-jwt-${newUser.id}`;
    return {
      status: 201,
      data: {
        token: mockToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          interests: newUser.interests,
          city: newUser.city
        }
      }
    };
  }

  // 2. POST /auth/login
  if (method === 'post' && path === '/auth/login') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const { email, password } = body;

    const users = getStoredUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email?.toLowerCase() && u.password === password
    );

    if (!user) {
      return {
        status: 401,
        data: { message: "Invalid email or password" }
      };
    }

    const mockToken = `mock-jwt-${user.id}`;
    return {
      status: 200,
      data: {
        token: mockToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          interests: user.interests,
          city: user.city
        }
      }
    };
  }

  // 3. GET /auth/me
  if (method === 'get' && path === '/auth/me') {
    if (!currentUser) {
      return { status: 401, data: { message: "Unauthenticated" } };
    }
    return {
      status: 200,
      data: {
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          interests: currentUser.interests,
          city: currentUser.city
        }
      }
    };
  }

  // 4. GET /events/mine (organizer)
  if (method === 'get' && path === '/events/mine') {
    if (!currentUser) {
      return { status: 401, data: { message: "Unauthenticated" } };
    }
    if (currentUser.role !== 'organizer') {
      return { status: 403, data: { message: "Access forbidden: organizers only" } };
    }

    const allEvents = getStoredEvents();
    const myEvents = allEvents.filter(
      (e) => e.organizer?._id === currentUser.id || e.organizer?.id === currentUser.id
    );

    return {
      status: 200,
      data: { events: myEvents }
    };
  }

  // 5. POST /events/:id/cancel
  const cancelMatch = path.match(/^\/events\/([^/]+)\/cancel$/);
  if (method === 'post' && cancelMatch) {
    const eventId = cancelMatch[1];
    if (!currentUser) {
      return { status: 401, data: { message: "Unauthenticated" } };
    }

    const events = getStoredEvents();
    const event = events.find((e) => e._id === eventId || e.id === eventId);
    if (!event) {
      return { status: 404, data: { message: "Event not found" } };
    }

    event.status = 'cancelled';
    saveEvents(events);

    return {
      status: 200,
      data: { event: decorateEvent(event) }
    };
  }

  // 5b. GET /registrations/event/:eventId (event owner only)
  const regEventMatch = path.match(/^\/registrations\/event\/([^/]+)$/);
  if (method === 'get' && regEventMatch) {
    const eventId = regEventMatch[1];
    if (!currentUser) {
      return { status: 401, data: { message: "Unauthenticated" } };
    }

    const events = getStoredEvents();
    const event = events.find((e) => e._id === eventId || e.id === eventId);
    if (!event) {
      return { status: 404, data: { message: "Event not found" } };
    }

    const sampleRegistrations = [
      { id: "reg_1", status: "registered", checkedIn: true, createdAt: "2026-10-20T10:15:00.000Z", user: { name: "Priya Patel", email: "priya.patel@example.com" } },
      { id: "reg_2", status: "registered", checkedIn: false, createdAt: "2026-10-21T14:30:00.000Z", user: { name: "Aarav Sharma", email: "aarav.sharma@example.com" } },
      { id: "reg_3", status: "registered", checkedIn: true, createdAt: "2026-10-22T09:20:00.000Z", user: { name: "Neha Verma", email: "neha.v@example.com" } },
      { id: "reg_4", status: "registered", checkedIn: false, createdAt: "2026-10-23T16:45:00.000Z", user: { name: "Vikram Malhotra", email: "vikram.m@example.com" } },
      { id: "reg_5", status: "registered", checkedIn: false, createdAt: "2026-10-24T11:00:00.000Z", user: { name: "Ananya Iyer", email: "ananya.iyer@example.com" } }
    ];

    const regCount = Math.max(1, (event.capacity || 100) - (event.seatsAvailable !== undefined ? event.seatsAvailable : 90));
    const returned = sampleRegistrations.slice(0, Math.min(regCount, sampleRegistrations.length));

    return {
      status: 200,
      data: { registrations: returned }
    };
  }

  // 6. GET /events/:id
  const eventIdMatch = path.match(/^\/events\/([^/]+)$/);
  if (method === 'get' && eventIdMatch) {
    const eventId = eventIdMatch[1];
    const events = getStoredEvents();
    const event = events.find((e) => e._id === eventId || e.id === eventId);

    if (!event) {
      return { status: 404, data: { message: "Event not found" } };
    }

    if (event.status === 'draft') {
      const isOwner = currentUser && (event.organizer?._id === currentUser.id || event.organizer?.id === currentUser.id);
      if (!isOwner) {
        return { status: 404, data: { message: "Event not found" } };
      }
    }

    return {
      status: 200,
      data: { event: decorateEvent(event) }
    };
  }

  // 7. PATCH /events/:id
  if (method === 'patch' && eventIdMatch) {
    const eventId = eventIdMatch[1];
    if (!currentUser) {
      return { status: 401, data: { message: "Unauthenticated" } };
    }

    const events = getStoredEvents();
    const event = events.find((e) => e._id === eventId || e.id === eventId);
    if (!event) {
      return { status: 404, data: { message: "Event not found" } };
    }

    if (event.status === 'cancelled') {
      return { status: 400, data: { message: "Cancelled events cannot be edited" } };
    }

    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;

    if (body.status === 'cancelled') {
      return { status: 400, data: { message: "Cannot set status to cancelled using PATCH, use cancel route" } };
    }

    // Capacity change validation
    if (body.capacity !== undefined) {
      const newCapacity = Number(body.capacity);
      const registeredCount = (event.capacity || 100) - (event.seatsAvailable !== undefined ? event.seatsAvailable : 100);
      if (newCapacity < registeredCount) {
        return {
          status: 400,
          data: { message: `Capacity cannot go below current registered count (${registeredCount})` }
        };
      }
      const diff = newCapacity - (event.capacity || 100);
      event.seatsAvailable = (event.seatsAvailable !== undefined ? event.seatsAvailable : 100) + diff;
      event.capacity = newCapacity;
      delete body.capacity;
    }

    Object.assign(event, body);
    saveEvents(events);

    return {
      status: 200,
      data: { event: decorateEvent(event) }
    };
  }

  // 8. POST /events (organizer)
  if (method === 'post' && path === '/events') {
    if (!currentUser) {
      return { status: 401, data: { message: "Unauthenticated" } };
    }
    if (currentUser.role !== 'organizer') {
      return { status: 403, data: { message: "Forbidden: organizer role required" } };
    }

    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const events = getStoredEvents();

    const capacityNum = Number(body.capacity || 100);
    const newEvent = {
      _id: `evt_${Date.now()}`,
      id: `evt_${Date.now()}`,
      title: body.title,
      description: body.description,
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 4) : [],
      startDate: body.startDate,
      endDate: body.endDate,
      registrationDeadline: body.registrationDeadline,
      venue: body.venue || { name: "", address: "", city: "" },
      location: {
        type: "Point",
        coordinates: [parseFloat(body.lng || 72.8777), parseFloat(body.lat || 19.0760)]
      },
      mode: body.mode || 'offline',
      price: Number(body.price || 0),
      capacity: capacityNum,
      seatsAvailable: capacityNum,
      coverImage: body.coverImage || "",
      status: body.status || 'draft',
      organizer: {
        _id: currentUser.id,
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email
      },
      createdAt: new Date().toISOString()
    };

    events.unshift(newEvent);
    saveEvents(events);

    return {
      status: 201,
      data: { event: decorateEvent(newEvent) }
    };
  }

  // 9. GET /events (public discovery)
  if (method === 'get' && path === '/events') {
    const params = config.params || {};
    const lat = params.lat ? parseFloat(params.lat) : 19.0760;
    const lng = params.lng ? parseFloat(params.lng) : 72.8777;
    const radiusKm = params.radiusKm ? parseFloat(params.radiusKm) : 25;
    const category = params.category;
    const q = params.q ? params.q.toLowerCase() : null;
    const free = params.free === 'true' || params.free === true;
    const mode = params.mode;

    const allEvents = getStoredEvents();
    let filtered = allEvents.filter((e) => e.status === 'published');

    if (category) filtered = filtered.filter((e) => e.category === category);
    if (free) filtered = filtered.filter((e) => e.price === 0);
    if (mode) filtered = filtered.filter((e) => e.mode === mode);
    if (q) {
      filtered = filtered.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.venue?.name?.toLowerCase().includes(q) ||
          e.venue?.city?.toLowerCase().includes(q)
      );
    }

    filtered = filtered.map((e) => {
      let distanceKm = null;
      if (e.location?.coordinates && e.location.coordinates.length >= 2) {
        const [eLng, eLat] = e.location.coordinates;
        distanceKm = calculateDistance(lat, lng, eLat, eLng);
      }
      return {
        ...decorateEvent(e),
        distanceKm
      };
    });

    if (radiusKm && !isNaN(radiusKm)) {
      filtered = filtered.filter((e) => e.distanceKm === null || e.distanceKm <= radiusKm);
    }

    filtered.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return {
      status: 200,
      data: {
        events: filtered,
        total: filtered.length
      }
    };
  }

  return null;
}
