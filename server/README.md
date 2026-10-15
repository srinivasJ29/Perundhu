# TNSTC Live Tracking — Backend Service (`@perundhu/server`)

Backend foundation service for the **TNSTC Live Tracking** web platform, engineered with Node.js, Express, TypeScript, and Mongoose.

---

## 1. Architecture & Design Principles

- **Strict Type Safety:** Compiled with strict TypeScript checks (`noImplicitAny`, `strictNullChecks`, etc.).
- **Cloud-Native Probes:** Separate liveness (`/api/v1/health`) and readiness (`/api/v1/ready`) endpoints suitable for Kubernetes/Render zero-downtime deployments.
- **Fail-Fast Configuration:** Environment variables parsed and strictly validated via Zod on boot before network binding.
- **Safe Database Initialization:** Connects to MongoDB only when valid credentials are provided. Operates in a graceful degraded state if MongoDB is unconfigured or disconnected.
- **Centralized RFC-Compliant Errors:** Operational errors are separated from unexpected faults; sensitive error stacks are suppressed in production.
- **Zero Secrets Logging:** Structured logging using Pino with automated PII and secret redaction.

---

## 2. Directory Structure

```
server/
├── src/
│   ├── app.ts                         # Express app builder with Helmet, CORS, and parsers
│   ├── server.ts                      # Process bootstrap, DB connect, and graceful shutdown
│   ├── config/
│   │   └── env.ts                     # Zod-validated environment configuration
│   ├── common/
│   │   ├── errors/                    # AppError, NotFoundError, ValidationError, etc.
│   │   ├── logger/                    # Redacted Pino logger
│   │   ├── middleware/                # requestLogger, notFoundHandler, errorHandler
│   │   └── validation/                # Reusable Zod validation middleware
│   ├── infrastructure/
│   │   └── database/                  # Mongoose connection lifecycle & state helpers
│   ├── modules/
│   │   └── health/                    # Health & readiness controllers, routes & service
│   ├── routes/                        # Primary API router
│   └── types/                         # Shared type definitions
├── tests/
│   ├── unit/                          # Environment and domain error unit tests
│   └── integration/                   # Health, ready, 404, and error handling integration tests
├── .env.example                       # Safe environment variable template
├── package.json                       # Scripts and dependencies
├── tsconfig.json                      # Strict TypeScript compiler options
├── vitest.config.ts                   # Vitest configuration
└── README.md
```

---

## 3. Getting Started

### Prerequisites
- Node.js >= 20.0.0 (LTS recommended)
- npm >= 10.0.0

### Installation
From within the `server` directory:
```bash
npm install
```

### Environment Setup
Create a `.env` file from the provided template:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime mode (`development`, `test`, `production`) | `development` |
| `PORT` | Network port for HTTP listener | `5000` |
| `API_PREFIX` | REST API path prefix | `/api/v1` |
| `CLIENT_ORIGIN`| Allowed CORS origin for frontend | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas connection string (optional in foundation) | `undefined` |
| `LOG_LEVEL` | Pino logging level (`info`, `debug`, `warn`, `error`) | `info` |

---

## 4. Development & Testing Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs the server in development mode with hot-reloading via `tsx` |
| `npm run build` | Compiles TypeScript source to production JavaScript in `dist/` |
| `npm start` | Runs the compiled production build from `dist/server.js` |
| `npm run typecheck`| Runs TypeScript compiler type checking without emitting files |
| `npm test` | Runs the full Vitest automated test suite |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:coverage` | Generates code coverage report |
| `npm run seed` | Executes idempotent Madurai demonstration dataset seed script |
| `npm run seed:dry-run` | Executes seed script in dry-run mode (read-only verification) |
| `npm run admin:create` | Controlled CLI command to bootstrap or promote an initial Administrator |

---

## 5. Domain Models & Geospatial Indexes

The persistence layer defines 13 typed Mongoose models in `src/models/`:

| Model | Collection | Primary Keys / Indexes | Spatial Index / TTL |
| :--- | :--- | :--- | :--- |
| `User` | `users` | `{ email: 1 }` (unique), `{ role: 1 }`, `{ status: 1 }` | N/A (Argon2id password hashes) |
| `RefreshTokenSession` | `refresh_token_sessions` | `{ tokenHash: 1 }` (unique), `{ sessionId: 1 }` (unique), `{ familyId: 1 }` | `{ expiresAt: 1 }` (TTL auto-purge) |
| `District` | `districts` | `{ code: 1 }` (unique) | Optional boundary polygon |
| `BusStand` | `bus_stands` | `{ code: 1 }` (unique), `{ districtId: 1 }` | `location` (2dsphere) |
| `Stop` | `stops` | `{ code: 1 }` (unique), `{ districtId: 1 }` | `location` (2dsphere) |
| `Route` | `routes` | `{ districtId: 1, routeNumber: 1 }` (unique) | N/A |
| `RouteDirection` | `route_directions` | `{ routeId: 1, directionCode: 1 }` (unique) | `routePolyline` (2dsphere) |
| `RouteStopSequence`| `route_stop_sequences` | `{ directionId: 1, sequenceOrder: 1 }` (unique) | N/A |
| `Bus` | `buses` | `{ registrationNumber: 1 }`, `{ fleetNumber: 1 }` | N/A |
| `ScheduledTrip` | `scheduled_trips` | `{ tripCode: 1 }` (unique) | N/A |
| `TripStopTime` | `trip_stop_times` | `{ tripId: 1, stopSequence: 1 }` (unique) | N/A |
| `LatestBusPosition`| `latest_bus_positions` | `{ busId: 1 }` (unique), `{ recordedAt: -1 }` | `location` (2dsphere) |
| `LocationHistory` | `location_history` | `{ expireAt: 1 }` (TTL 0s), `{ busId: 1, recordedAt: -1 }` | `location` (2dsphere) |

---

## 6. REST API Endpoints

### Authentication & Authorization Endpoints (Phase 4)
- **Register Passenger:** `POST /api/v1/auth/register`
  - Creates new passenger accounts; `PASSENGER` role is enforced server-side.
  - Password hashed with Argon2id; returns 201 Created with safe user profile.
- **Login:** `POST /api/v1/auth/login`
  - Validates Argon2id password hash against stored credentials.
  - Returns short-lived JWT access token and sets secure HttpOnly `refreshToken` cookie.
- **Rotate Refresh Token:** `POST /api/v1/auth/refresh`
  - Rotates refresh token atomically with family-based reuse detection.
  - Re-using a previously rotated token automatically invalidates the entire token family.
- **Logout:** `POST /api/v1/auth/logout`
  - Revokes current refresh token session and clears the HttpOnly cookie. Safe and idempotent.
- **Current User Profile:** `GET /api/v1/auth/me`
  - Requires `Authorization: Bearer <accessToken>`. Returns the safe user profile.
- **Role Verification (RBAC Test):** `GET /api/v1/auth/admin-check`
  - Protected with `authenticate` and `requireRole('ADMIN')`. Returns 200 for Admins, 403 for Passengers.


### System Probes (Foundation)
- **Liveness:** `GET /api/v1/health` — Confirms HTTP process is healthy.
- **Readiness:** `GET /api/v1/ready` — Confirms MongoDB dependency status.

### District & Bus Stand APIs (Phase 3)
- **List Districts:** `GET /api/v1/districts?q=...&page=1&limit=20`
  - Searches districts by name (English/Tamil) or code.
  - Bounded pagination with deterministic sorting.
- **Bus Stands in District:** `GET /api/v1/districts/:districtId/bus-stands?page=1&limit=20`
  - Returns active bus stands belonging to an active district.
- **Nearby Bus Stands:** `GET /api/v1/bus-stands/nearby?lat=9.945&lng=78.160&radiusMeters=5000&page=1&limit=20`
  - Spatial `$geoNear` radius query using 2dsphere index.
  - Calculates and returns accurate distance in meters.
- **Routes at Bus Stand:** `GET /api/v1/bus-stands/:standId/routes?page=1&limit=20`
  - Discovers active routes and directions serving the bus stand through stop sequences and origin/destination links.
  - Deduplicates routes across multiple stops at the stand.
- **Route Direction Details:** `GET /api/v1/routes/:routeId/directions/:directionId`
  - Returns the route's ordered stop sequence and full GeoJSON LineString geometry.
  - Supports repeated visits to the same stop along circular/complex paths.
  - Handles missing geometry cleanly as `null` without fabricating coordinates.
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-14T16:47:00.000Z",
  "uptimeSeconds": 42,
  "environment": "development"
}
```

### Readiness Probe
- **URL:** `GET /api/v1/ready`
- **Purpose:** Verifies whether downstream dependencies (MongoDB) are ready to accept traffic.
- **Response when Ready (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2026-10-14T16:47:00.000Z",
  "dependencies": {
    "database": "connected"
  }
}
```
- **Response when Not Ready (503 Service Unavailable):**
```json
{
  "status": "not_ready",
  "timestamp": "2026-10-14T16:47:00.000Z",
  "dependencies": {
    "database": "disconnected"
  }
}
```
