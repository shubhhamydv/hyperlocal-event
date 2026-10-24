# Hyperlocal Event Platform 📍

A powerful backend service and API for discovering, managing, and attending hyperlocal community events. Built with Node.js, Express, and MongoDB geospatial indexing (`2dsphere`), this service enables real-time proximity-based event search, category filtering, and complete event lifecycle management for organizers.

---

## 🌟 Key Features

- **📍 Geospatial Discovery**: Find events nearby within a customizable radius (`km`) using MongoDB `$geoNear` and GeoJSON `Point` coordinates.
- **🔍 Advanced Filtering & Search**:
  - Filter by category (`Hackathon`, `Workshop`, `Meetup`, `Conference`, `Networking`, `Webinar`, `Other`).
  - Filter by attendance mode (`offline`, `online`, `hybrid`).
  - Free event filtering (`free=true`).
  - Full-text search across titles, descriptions, and venue cities.
  - Pagination support (`page`, `limit`).
- **🛡️ Organizer Event Lifecycle**:
  - Event status workflow: `draft` ➔ `published` ➔ `cancelled`.
  - Restricted access: drafts and cancelled events are hidden from the public and accessible only by their organizer.
  - Safe cancellation without hard deletion.
- **✅ Strict Data Integrity & Validation**:
  - Automatic validation ensuring `startDate <= endDate`.
  - Registration deadline enforcement: `registrationDeadline <= startDate`.
  - Automated seat availability tracking (`seatsAvailable` initialized from `capacity`).
  - 2dsphere index on location coordinates `[longitude, latitude]`.

---

## 🏗️ Project Architecture

```plaintext
junction/
├── server/
│   └── src/
│       ├── constants/
│       │   └── categories.js         # Standardized event categories
│       ├── controllers/
│       │   └── event.controller.js   # Event business logic & aggregation pipelines
│       ├── models/
│       │   └── Event.js              # Mongoose schema with geospatial indexes & hooks
│       └── routes/
│           └── event.routes.js       # Express route definitions & auth middleware hooks
└── README.md
```

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ODM
- **Geospatial Engine**: MongoDB GeoJSON & 2dsphere indexing

---

## 📋 Data Model Reference

### Event Schema

| Field | Type | Description | Rules / Constraints |
| :--- | :--- | :--- | :--- |
| `title` | `String` | Event title | Required, trimmed |
| `description` | `String` | Detailed event summary | Required |
| `category` | `String` | Event type | Enum: `Hackathon`, `Workshop`, `Meetup`, `Conference`, `Networking`, `Webinar`, `Other` |
| `startDate` | `Date` | Start date and time | Required, must be $\le$ `endDate` |
| `endDate` | `Date` | End date and time | Required |
| `registrationDeadline`| `Date` | Last date to register | Required, must be $\le$ `startDate` |
| `venue` | `Object` | Physical location details | `{ name, address, city }` |
| `location` | `Object` | GeoJSON representation | `{ type: "Point", coordinates: [lng, lat] }` |
| `mode` | `String` | Event format | Enum: `offline`, `online`, `hybrid` |
| `price` | `Number` | Admission fee (0 for free) | Required, $\ge 0$ |
| `capacity` | `Number` | Total available slots | Required, $\ge 1$ |
| `seatsAvailable` | `Number` | Remaining seats | Auto-initialized to `capacity` |
| `coverImage` | `String` | Image URL | Optional |
| `status` | `String` | Lifecycle state | Enum: `draft`, `published`, `cancelled` (Default: `draft`) |
| `organizer` | `ObjectId` | User reference | Ref: `User` |

---

## 🚀 API Documentation

Base Path: `/events`

### 1. Public Event Discovery
- **`GET /events`**
  - **Query Parameters**:
    - `lat` (Number, optional): Latitude for proximity search (e.g. `28.6139`)
    - `lng` (Number, optional): Longitude for proximity search (e.g. `77.2090`)
    - `radiusKm` (Number, optional): Search radius in kilometers (default: `25`)
    - `category` (String, optional): Filter by category name
    - `mode` (String, optional): `offline`, `online`, or `hybrid`
    - `free` (Boolean, optional): Set to `true` for free events (`price: 0`)
    - `q` (String, optional): Search keyword matched against title, description, and city
    - `page` (Number, optional): Page number (default: `1`)
    - `limit` (Number, optional): Items per page (default: `20`)
  - **Response**:
    ```json
    {
      "events": [
        {
          "_id": "671a1b...",
          "title": "Hyperlocal AI Hackathon",
          "category": "Hackathon",
          "distanceKm": 3.42,
          "venue": {
            "name": "Tech Hub",
            "address": "42 Innovation Blvd",
            "city": "Bengaluru"
          },
          "location": {
            "type": "Point",
            "coordinates": [77.5946, 12.9716]
          },
          "mode": "offline",
          "price": 0,
          "capacity": 100,
          "seatsAvailable": 100,
          "status": "published",
          "startDate": "2026-11-01T09:00:00.000Z",
          "endDate": "2026-11-02T18:00:00.000Z"
        }
      ],
      "total": 1
    }
    ```

---

### 2. Single Event Details
- **`GET /events/:id`**
  - **Auth**: Optional. If authenticated organizer matches event owner, draft and cancelled states are visible.
  - **Response**: `{ "event": { ... } }`

---

### 3. Organizer Endpoints
*Requires Bearer Token authentication and `organizer` role.*

- **`POST /events`**
  - **Description**: Create a new event.
  - **Headers**: `Authorization: Bearer <token>`
  - **Payload**: Full event object (omitting `organizer`, which is injected from the authenticated session).
  - **Status Code**: `201 Created`

- **`GET /events/mine`**
  - **Description**: Retrieve all events created by the logged-in organizer.
  - **Headers**: `Authorization: Bearer <token>`

- **`PATCH /events/:id`**
  - **Description**: Update event details (organizer must own the event).
  - **Headers**: `Authorization: Bearer <token>`

- **`POST /events/:id/cancel`**
  - **Description**: Mark an event status as `cancelled` (organizer must own the event).
  - **Headers**: `Authorization: Bearer <token>`

---

## ⚙️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (local daemon or MongoDB Atlas connection URI)

### 2. Environment Configuration
Create a `.env` file in the root or `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hyperlocal_events
JWT_SECRET=your_jwt_secret_key
```

### 3. Installation
```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install
```

### 4. Running the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 📌 Geospatial Notes
- GeoJSON coordinates convention: **`[longitude, latitude]`** (e.g., `[77.5946, 12.9716]`).
- MongoDB requires a `2dsphere` index to execute `$geoNear` aggregation queries:
  ```javascript
  eventSchema.index({ location: '2dsphere' });
  ```

---

## 📄 License
ISC / MIT - Open Source.
