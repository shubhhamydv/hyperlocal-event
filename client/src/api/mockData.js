export const INITIAL_USERS = [
  {
    id: "usr_org_1",
    name: "Rahul Sharma",
    email: "organizer@hyperlocal.com",
    password: "password123",
    role: "organizer",
    city: "Mumbai",
    interests: ["Web Development", "Hackathons", "Entrepreneurship"]
  },
  {
    id: "usr_att_1",
    name: "Priya Patel",
    email: "attendee@hyperlocal.com",
    password: "password123",
    role: "attendee",
    city: "Mumbai",
    interests: ["Artificial Intelligence", "UI/UX Design", "Web Development"]
  }
];

export const INITIAL_EVENTS = [
  {
    _id: "evt_1",
    id: "evt_1",
    title: "Mumbai Tech Hackathon 2026",
    description: "Join 300+ developers, designers, and innovators for a 24-hour sprint to build next-generation web and AI applications. Mentors from top tech startups will be present.",
    category: "Hackathon",
    mode: "hybrid",
    status: "published",
    price: 0,
    capacity: 250,
    seatsAvailable: 180,
    startDate: "2026-11-15T09:00:00.000Z",
    endDate: "2026-11-16T18:00:00.000Z",
    registrationDeadline: "2026-11-10T23:59:59.000Z",
    venue: {
      name: "BKC Innovation Hub",
      address: "Bandra Kurla Complex, G Block",
      city: "Mumbai"
    },
    location: {
      type: "Point",
      coordinates: [72.8687, 19.0662]
    },
    coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    organizer: {
      _id: "usr_org_1",
      id: "usr_org_1",
      name: "Rahul Sharma",
      email: "organizer@hyperlocal.com"
    },
    createdAt: "2026-10-01T10:00:00.000Z"
  },
  {
    _id: "evt_2",
    id: "evt_2",
    title: "Mastering React 19 & Tailwind CSS Workshop",
    description: "Hands-on, deep-dive workshop focusing on modern frontend architecture, state management patterns, and sleek styling with Tailwind CSS.",
    category: "Workshop",
    mode: "offline",
    status: "published",
    price: 499,
    capacity: 60,
    seatsAvailable: 24,
    startDate: "2026-11-20T10:30:00.000Z",
    endDate: "2026-11-20T16:30:00.000Z",
    registrationDeadline: "2026-11-18T20:00:00.000Z",
    venue: {
      name: "WeWork Enam Sambhav",
      address: "C-20, G Block, BKC",
      city: "Mumbai"
    },
    location: {
      type: "Point",
      coordinates: [72.8654, 19.0645]
    },
    coverImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    organizer: {
      _id: "usr_org_1",
      id: "usr_org_1",
      name: "Rahul Sharma",
      email: "organizer@hyperlocal.com"
    },
    createdAt: "2026-10-05T12:00:00.000Z"
  },
  {
    _id: "evt_3",
    id: "evt_3",
    title: "AI Founders & Engineers Meetup",
    description: "Casual evening meetup discussing LLMs, agentic workflows, and deploying open-source models at scale. High-signal conversations with refreshments provided.",
    category: "Meetup",
    mode: "offline",
    status: "published",
    price: 0,
    capacity: 100,
    seatsAvailable: 35,
    startDate: "2026-11-25T18:00:00.000Z",
    endDate: "2026-11-25T21:00:00.000Z",
    registrationDeadline: "2026-11-24T18:00:00.000Z",
    venue: {
      name: "Draper Startup House",
      address: "Bandra West, Hill Road",
      city: "Mumbai"
    },
    location: {
      type: "Point",
      coordinates: [72.8333, 19.0558]
    },
    coverImage: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    organizer: {
      _id: "usr_org_1",
      id: "usr_org_1",
      name: "Rahul Sharma",
      email: "organizer@hyperlocal.com"
    },
    createdAt: "2026-10-08T15:00:00.000Z"
  },
  {
    _id: "evt_4",
    id: "evt_4",
    title: "DevCon Mumbai 2026",
    description: "The premier developer conference in Western India bringing together over 800 engineers, CTOs, and designers across 3 tracks: Cloud & DevOps, Frontend, and AI Systems.",
    category: "Conference",
    mode: "offline",
    status: "published",
    price: 1499,
    capacity: 500,
    seatsAvailable: 110,
    startDate: "2026-12-05T09:00:00.000Z",
    endDate: "2026-12-06T19:00:00.000Z",
    registrationDeadline: "2026-11-30T23:59:00.000Z",
    venue: {
      name: "Jio World Convention Centre",
      address: "Bandra Kurla Complex",
      city: "Mumbai"
    },
    location: {
      type: "Point",
      coordinates: [72.8682, 19.0628]
    },
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    organizer: {
      _id: "usr_org_1",
      id: "usr_org_1",
      name: "Rahul Sharma",
      email: "organizer@hyperlocal.com"
    },
    createdAt: "2026-10-10T08:00:00.000Z"
  },
  {
    _id: "evt_5",
    id: "evt_5",
    title: "Building Microservices with Node.js Webinar",
    description: "Learn how to build resilient, distributed Node.js applications with event-driven architecture, Docker, and Kafka.",
    category: "Webinar",
    mode: "online",
    status: "published",
    price: 0,
    capacity: 1000,
    seatsAvailable: 640,
    startDate: "2026-11-28T17:00:00.000Z",
    endDate: "2026-11-28T19:00:00.000Z",
    registrationDeadline: "2026-11-28T15:00:00.000Z",
    venue: {
      name: "Zoom Webinar Room",
      address: "Online",
      city: "Mumbai"
    },
    location: {
      type: "Point",
      coordinates: [72.8777, 19.0760]
    },
    coverImage: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=80",
    organizer: {
      _id: "usr_org_1",
      id: "usr_org_1",
      name: "Rahul Sharma",
      email: "organizer@hyperlocal.com"
    },
    createdAt: "2026-10-12T11:00:00.000Z"
  },
  {
    _id: "evt_6",
    id: "evt_6",
    title: "Next-Gen UI/UX Design Sprint",
    description: "An intensive sprint focusing on design systems, Figma tokens, accessibility, and translating prototypes into pixel-perfect Tailwind CSS components.",
    category: "Workshop",
    mode: "offline",
    status: "draft",
    price: 299,
    capacity: 40,
    seatsAvailable: 40,
    startDate: "2026-12-10T11:00:00.000Z",
    endDate: "2026-12-10T16:00:00.000Z",
    registrationDeadline: "2026-12-08T20:00:00.000Z",
    venue: {
      name: "Innov8 Coworking",
      address: "Boston House, Andheri East",
      city: "Mumbai"
    },
    location: {
      type: "Point",
      coordinates: [72.8570, 19.1197]
    },
    coverImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    organizer: {
      _id: "usr_org_1",
      id: "usr_org_1",
      name: "Rahul Sharma",
      email: "organizer@hyperlocal.com"
    },
    createdAt: "2026-10-15T14:00:00.000Z"
  }
];
