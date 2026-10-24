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
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  localStorage.setItem('mock_events', JSON.stringify(INITIAL_EVENTS));
  return INITIAL_EVENTS;
}

function saveEvents(events) {
  localStorage.setItem('mock_events', JSON.stringify(events));
}

function getUserFromToken(token) {
  if (!token) return null;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
  const users = getStoredUsers();
  // Token format: "mock-jwt-{userId}"
  if (cleanToken.startsWith('mock-jwt-')) {
    const userId = cleanToken.replace('mock-jwt-', '');
    return users.find((u) => u.id === userId) || null;
  }
  // Try to decode real or demo token if possible
  return users[0] || null;
}

export function handleMockRequest(config) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  const token = config.headers?.Authorization;
  const currentUser = getUserFromToken(token);

  // Normalize path removing baseURL
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
    const userSafe = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      interests: newUser.interests,
      city: newUser.city
    };

    return {
      status: 201,
      data: { token: mockToken, user: userSafe }
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
    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests,
      city: user.city
    };

    return {
      status: 200,
      data: { token: mockToken, user: userSafe }
    };
  }

  // 3. GET /auth/me
  if (method === 'get' && path === '/auth/me') {
    if (!currentUser) {
      return {
        status: 401,
        data: { message: "Unauthenticated" }
      };
    }

    const userSafe = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      interests: currentUser.interests,
      city: currentUser.city
    };

    return {
      status: 200,
      data: { user: userSafe }
    };
  }

  // 4. GET /events/mine (organizer)
  if (method === 'get' && path === '/events/mine') {
    if (!currentUser) {
      return {
        status: 401,
        data: { message: "Unauthenticated" }
      };
    }
    if (currentUser.role !== 'organizer') {
      return {
        status: 403,
        data: { message: "Access forbidden: organizers only" }
      };
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
      data: { event }
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
      data: { event }
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

    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    Object.assign(event, body);
    saveEvents(events);

    return {
      status: 200,
      data: { event }
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

    const newEvent = {
      _id: `evt_${Date.now()}`,
      id: `evt_${Date.now()}`,
      title: body.title,
      description: body.description,
      category: body.category,
      startDate: body.startDate,
      endDate: body.endDate,
      registrationDeadline: body.registrationDeadline,
      venue: body.venue || { name: "", address: "", city: "" },
      location: {
        type: "Point",
        coordinates: [body.lng || 72.8777, body.lat || 19.0760]
      },
      mode: body.mode || 'offline',
      price: Number(body.price || 0),
      capacity: Number(body.capacity || 100),
      seatsAvailable: Number(body.capacity || 100),
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
      data: { event: newEvent }
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

    // Published and upcoming (or active) only
    let filtered = allEvents.filter((e) => e.status === 'published');

    // Category filter
    if (category) {
      filtered = filtered.filter((e) => e.category === category);
    }

    // Free filter
    if (free) {
      filtered = filtered.filter((e) => e.price === 0);
    }

    // Mode filter
    if (mode) {
      filtered = filtered.filter((e) => e.mode === mode);
    }

    // Keyword search
    if (q) {
      filtered = filtered.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.venue?.name?.toLowerCase().includes(q) ||
          e.venue?.city?.toLowerCase().includes(q)
      );
    }

    // Calculate distanceKm for each event if lat & lng are given
    filtered = filtered.map((e) => {
      let distanceKm = null;
      if (e.location?.coordinates && e.location.coordinates.length >= 2) {
        const [eLng, eLat] = e.location.coordinates;
        distanceKm = calculateDistance(lat, lng, eLat, eLng);
      }
      return {
        ...e,
        distanceKm
      };
    });

    // Filter by radiusKm
    if (radiusKm && !isNaN(radiusKm)) {
      filtered = filtered.filter((e) => e.distanceKm === null || e.distanceKm <= radiusKm);
    }

    // Sort nearest first
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
