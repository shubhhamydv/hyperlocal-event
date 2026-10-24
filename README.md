# Hyperlocal Event Discovery & Community Engagement

A MERN stack hackathon app for discovering and managing local events.

## Team
| Member | Ownership |
|--------|-----------|
| **Sumit** | `server/` core (all except Shikha's files), repo root |
| **Shikha** | `models/Event.js`, `constants/categories.js`, `controllers/event.controller.js`, `routes/event.routes.js`, `seed/events.seed.js` |
| **Ankita** | Everything in `client/` |

## Branches
- `feature/sumit-core`
- `feature/shikha-events`
- `feature/ankita-client`

## Merge Order (PRs → main)
**Sumit → Shikha → Ankita**  
Rebase on main before opening your PR. Merge only after previous person's PR is merged.

## Getting Started

### Server
```bash
cd server
cp .env.example .env   # fill in your MONGO_URI and JWT_SECRET
npm install
npm run dev
```

### Client
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## API Base URL
`http://localhost:5000/api`

## Health Check
```
GET /api/health
→ { "status": "ok", "timestamp": "..." }
```

## Auth API
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | Bearer token | Get current user |

## Events API
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/events` | organizer | Create event |
| GET | `/api/events` | public | List published events |
| GET | `/api/events/mine` | organizer | My events |
| GET | `/api/events/:id` | optional | Get event |
| PATCH | `/api/events/:id` | owner | Update event |
| POST | `/api/events/:id/cancel` | owner | Cancel event |

## Seed Data
```bash
cd server
npm run seed:users    # creates organizer@demo.com + attendee@demo.com (password: Demo@123)
```
