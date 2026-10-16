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
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/perundhu_dev` |
| `LOG_LEVEL` | Pino logging level (`info`, `debug`, `warn`, `error`) | `info` |
| `JWT_ACCESS_SECRET` | Secret key for access token signing | (Required) |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing | (Required) |
| `JWT_ACCESS_EXPIRATION` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifetime | `7d` |
| `SIMULATOR_ENABLED` | Enable deterministic route simulator engine | `false` |
| `SIMULATOR_TICK_INTERVAL_MS` | Simulator loop tick frequency in ms (1000–60000) | `3000` |
| `SIMULATOR_DEFAULT_SPEED_KMPH` | Base vehicle speed in km/h (5–120) | `30` |
| `SIMULATOR_SPEED_MULTIPLIER` | Speed multiplier factor (1–100) | `1` |
| `SIMULATOR_WRITE_HISTORY` | Persist simulation steps to LocationHistory | `false` |
| `SIMULATOR_HISTORY_INTERVAL_TICKS` | Ticks between LocationHistory persistence writes | `5` |
| `SIMULATOR_ROUTE_END_POLICY` | Behavior upon reaching route destination (`LOOP` or `COMPLETE`) | `LOOP` |
| `LOCATION_MAX_FUTURE_SKEW_MS` | Maximum acceptable future clock skew in ms (0–60000) | `5000` |
| `LOCATION_FRESHNESS_THRESHOLD_MS` | Freshness age threshold in ms (1000–300000) | `30000` |
| `LOCATION_STALE_THRESHOLD_MS` | Stale age threshold in ms (5000–600000) | `120000` |
| `LOCATION_MAX_SPEED_KMPH` | Plausible vehicle speed upper limit in km/h (10–200) | `120` |
| `LOCATION_MAX_CROSS_TRACK_METERS` | Maximum off-route cross-track deviation threshold in meters (10–1000) | `100` |
| `LOCATION_MAX_PROGRESS_JUMP_METERS` | Kinematic teleportation anomaly jump threshold in meters (50–5000) | `500` |
| `LOCATION_MAX_BACKWARD_METERS` | Tolerated backward progress jitter along polyline in meters (0–500) | `30` |
| `ETA_MAX_POSITION_AGE_MS` | Max telemetry age before ETA falls back to timetable in ms (5000–600000) | `120000` |
| `ETA_MIN_EFFECTIVE_SPEED_KMPH` | Minimum effective speed clamp for ETA in km/h (1–30) | `10` |
| `ETA_MAX_EFFECTIVE_SPEED_KMPH` | Maximum effective speed clamp for ETA in km/h (30–120) | `80` |
| `ETA_DEFAULT_SPEED_KMPH` | Default speed for stationary/dwelling buses in km/h (5–60) | `25` |
| `ETA_DEFAULT_DWELL_SECONDS` | Stop dwell duration added to downstream stops in seconds (0–300) | `30` |
| `STOP_ARRIVAL_RADIUS_METERS` | Geodesic radius triggering stop arrival state in meters (10–500) | `50` |
| `STOP_DEPARTURE_RADIUS_METERS`| Geodesic radius triggering stop departure state in meters (20–1000) | `100` |
| `STOP_ARRIVAL_CONFIRMATION_COUNT` | Consecutive valid samples needed to confirm stop arrival (1–10) | `2` |

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
| `StopEvent` | `stop_events` | `{ tripId: 1, stopSequence: 1, eventType: 1 }` (unique), `{ busId: 1 }`, `{ stopId: 1 }`, `{ recordedAt: -1 }` | N/A |

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

### Authentication & Authorization (Phase 4)
- **Register Passenger:** `POST /api/v1/auth/register` — Creates new passenger accounts; `PASSENGER` role enforced server-side.
- **Login:** `POST /api/v1/auth/login` — Returns short-lived JWT access token and sets secure HttpOnly `refreshToken` cookie.
- **Rotate Refresh Token:** `POST /api/v1/auth/refresh` — Rotates refresh token atomically with family-based reuse detection.
- **Logout:** `POST /api/v1/auth/logout` — Revokes current refresh token session and clears the HttpOnly cookie.
- **Current User Profile:** `GET /api/v1/auth/me` — Protected profile query.
- **Role Verification:** `GET /api/v1/auth/admin-check` — Protected with `requireRole('ADMIN')`.

### District & Bus Stand APIs (Phase 3)
- **List Districts:** `GET /api/v1/districts?q=...&page=1&limit=20` — Search districts by name/code.
- **Bus Stands in District:** `GET /api/v1/districts/:districtId/bus-stands` — Active bus stands in a district.
- **Nearby Bus Stands:** `GET /api/v1/bus-stands/nearby?lat=9.945&lng=78.160&radiusMeters=5000` — Spatial `$geoNear` radius query.
- **Routes at Bus Stand:** `GET /api/v1/bus-stands/:standId/routes` — Discovers routes serving a bus stand.
- **Route Direction Details:** `GET /api/v1/routes/:routeId/directions/:directionId` — Ordered stops and GeoJSON LineString polyline.

### Bus Fleet & Timetables (Phase 5)
- **List Buses:** `GET /api/v1/buses?status=...&page=1&limit=20` — Public vehicle fleet queries.
- **Bus Detail:** `GET /api/v1/buses/:id` — Vehicle metadata, depot, and operational status.
- **List Scheduled Trips:** `GET /api/v1/trips?routeDirectionId=...&page=1&limit=20` — Search timetable trips.
- **Active Trips Tracking:** `GET /api/v1/trips/active?routeId=...` — Filter trips currently scheduled or in-transit.
- **Trip Details & Stop Times:** `GET /api/v1/trips/:id` — Complete trip itinerary with ordered scheduled stop times.
- **Route Timetable:** `GET /api/v1/routes/:routeId/timetable?directionId=...` — Complete chronological schedule matrix.
- **Stop Departures Board:** `GET /api/v1/stops/:stopId/departures?windowMinutes=60` — Real-time stop departure board (IST timezone).
- **Admin Fleet & Trips:** `POST /api/v1/admin/buses`, `PATCH /api/v1/admin/buses/:id/status`, `POST /api/v1/admin/trips`, `PATCH /api/v1/admin/trips/:id/bus`, `PATCH /api/v1/admin/trips/:id/status`, `PUT /api/v1/admin/trips/:id/stop-times`.

### Admin Simulator Controls (Phase 6)
- **Simulator Status:** `GET /api/v1/admin/simulator/status`
  - Protected with `authenticate` and `requireRole('ADMIN')`.
  - Returns engine running status, active simulated buses count, simulation speed multiplier, tick interval, and detailed bus positions along their route polylines.
- **Start Simulation Session:** `POST /api/v1/admin/simulator/start`
  - Starts or updates the deterministic route simulation engine.
  - Accepts optional body: `{ "speedMultiplier": 1, "routeEndPolicy": "LOOP" }`.
  - Re-starting an already running session updates parameters idempotently.
- **Stop Simulation Session:** `POST /api/v1/admin/simulator/stop`
  - Halts the periodic tick updates safely.
  - Safe and idempotent; returns current stopped status.
- **Reset Simulation Session:** `POST /api/v1/admin/simulator/reset`
  - Resets all active simulated buses to polyline origin (distance 0m, coordinate 0).
  - Accepts optional body: `{ "clearPositionHistory": false }`.

### Passenger Next-Stop & Dynamic ETA Endpoints (Phase 8)
- **Trip Next-Stop Detection:** `GET /api/v1/trips/:tripId/next-stop`
  - Resolves next upcoming stop ahead of vehicle along route sequence with 50m arrival / 100m departure hysteresis.
  - Returns `tripId`, `status` (`APPROACHING`, `ARRIVED`, `DEPARTED`, `TERMINAL_REACHED`, `UNKNOWN`), `currentStop`, `nextStop`, `remainingDistanceMeters`, `progressRatio`, and `trackingStatus`.
- **Trip Dynamic ETA Prediction:** `GET /api/v1/trips/:tripId/eta`
  - Dynamic transit time prediction for next stop and all downstream stops.
  - Combines remaining route distance, rolling speed (10–80 km/h bounded), stationary fallback (25 km/h), and intermediate stop dwell times (30s).
  - **Truthfulness Guarantee:** Simulated observations remain explicitly tagged `predictionSource: "SIMULATED_MOVEMENT"`, `isRealTimePrediction: false`, and `trackingStatus: "SIMULATED"`. Timetable fallbacks are tagged `SCHEDULE_FALLBACK`.
- **Bus Vehicle Dynamic ETA:** `GET /api/v1/buses/:busId/eta`
  - Resolves the current active trip (`SCHEDULED` or `IN_TRANSIT`) assigned to the bus vehicle and returns complete downstream stop arrival predictions.
  - Returns `{ busId, activeTrip: null, message: "..." }` when vehicle currently has no active trip.

### Socket.IO Real-Time Tracking (Phase 9)

PERUNDHU backend incorporates a high-performance Socket.IO real-time event streaming server connected to the universal location pipeline.

#### 1. Room Conventions
- **Bus Room:** `bus:{busId}` — Real-time position updates, status transitions, next-stop updates, and dynamic ETAs for a specific bus vehicle.
- **Route Room:** `route:{routeId}` — Position updates for all active buses operating along an entire route corridor.

#### 2. Client-to-Server Events
- **`subscribe:bus`**: `{ "busId": "<24-hex ObjectId>" }`
  - Validates resource existence against database.
  - Returns `subscription:ack` containing initial snapshot (`BusTrackingSnapshot`).
- **`unsubscribe:bus`**: `{ "busId": "<24-hex ObjectId>" }`
  - Leaves the room and returns `unsubscription:ack`.
- **`subscribe:route`**: `{ "routeId": "<24-hex ObjectId>" }`
  - Validates route existence and returns `subscription:ack` with `RouteTrackingSnapshot` of all currently active buses.
- **`unsubscribe:route`**: `{ "routeId": "<24-hex ObjectId>" }`
  - Leaves the room and returns `unsubscription:ack`.

#### 3. Server-to-Client Outbound Broadcasts
- **`bus:position`**: Emitted to `bus:{busId}` and `route:{routeId}` when an observation is accepted and persisted by the location pipeline. Contains coordinates, snapped coordinates, heading, speed, progress ratio, distance along route, tracking status, and ISO timestamps.
- **`bus:status`**: Emitted when a vehicle's tracking status changes (e.g. `SIMULATED` -> `DEVIATED` or `LIVE` -> `DELAYED`).
- **`bus:next-stop`**: Emitted when vehicle approaches, arrives, or departs a scheduled stop.
- **`bus:stop-event`**: Confirmed arrival, departure, or terminal arrival events.
- **`bus:eta`**: Real-time downstream stop dynamic ETA predictions.
- **`subscription:ack`**: Successful room join with current telemetry snapshot.
- **`subscription:error`**: Structured error response (`INVALID_ID`, `RESOURCE_NOT_FOUND`, `RATE_LIMITED`, `MALFORMED_PAYLOAD`).

#### 4. Developer Test Client
Run the interactive Socket.IO test client to monitor live broadcasts:
```bash
# Connect and track first discovered active bus
npm run socket:client

# Track specific bus vehicle
npx tsx scripts/socketTestClient.ts --bus 6ad04f9acac25e5e811df250

# Track entire route corridor
npx tsx scripts/socketTestClient.ts --route 6ad04f9acac25e5e811df249
```

#### 5. Multi-Instance & Clustered Production Deployment Requirements
- **Sticky Sessions:** Production environments with multiple Node.js instances behind a load balancer (e.g., NGINX, AWS ALB, Render) must enable sticky sessions (cookie-based or IP-hash) to ensure HTTP long-polling handshakes stick to the same server process.
- **Shared Socket.IO Redis Adapter:** When horizontally scaled across multiple container instances, install `@socket.io/redis-adapter` or `@socket.io/redis-streams-adapter` so room broadcasts are synchronized across all backend workers.

---

## 7. Phase 10 — Security Hardening & Production Readiness Runbook

### 1. Express Application Security
- **Request / Correlation ID**: Handled via `requestIdMiddleware`. Validates incoming `X-Request-Id` or `X-Correlation-Id` header (alphanumeric, max 64 chars) or generates a cryptographically random UUID v4. Sets response header `X-Request-Id` and attaches to Pino request logs and all error responses.
- **HTTP Security Headers**: Managed via Helmet with Content Security Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Resource-Policy: cross-origin`, and `X-Powered-By` suppression.
- **CORS Allowlist**: Configured via `CLIENT_ORIGIN` (single origin or comma-separated list). Rejects unauthorized cross-origin requests with HTTP `403 Forbidden` (`CORS_REJECTED`). Allows non-browser agents (mobile apps, backend services) safely.
- **Method Filtering**: Blocks unsafe HTTP methods (`TRACE`, `TRACK`, `CONNECT`) with HTTP `405 Method Not Allowed` and sets `Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- **Body Parser Limits & Error Handling**: Strict 1MB JSON payload limit. Malformed JSON returns HTTP `400 Bad Request` (`MALFORMED_JSON`); oversized bodies return HTTP `413 Payload Too Large` (`PAYLOAD_TOO_LARGE`). Internal stacks and paths are never leaked to clients.
- **Reverse Proxy Support**: Configured via `TRUST_PROXY` environment variable (`1`, `loopback`, or explicit IP ranges). Never blindly enables trust proxy without explicit topology configuration.

### 2. Route-Specific Rate Limiting
To prevent DoS without compromising high-frequency tracking feeds, route-specific rate limiters are applied:
- `authLimiter`: 25 attempts / 15 minutes per IP on `/api/v1/auth/register`, `/login`, `/refresh`.
- `adminLimiter`: 60 requests / 15 minutes per IP on `/api/v1/admin/simulator/*`.
- `heavyApiLimiter`: 60 requests / minute per IP on geospatial search (`/api/v1/bus-stands/nearby`).
- `trackingLimiter`: 300 requests / minute per IP on public telemetry endpoints.
- `ingestionLimiter`: 120 requests / minute per IP on external hardware GPS ingestion.

### 3. Authentication & Timing Attack Mitigation
- **Constant-Time Verification**: Non-existent accounts trigger a dummy Argon2id hash verification (`verifyPassword`) in `AuthService.login`, equalizing execution time (~350ms) and neutralizing email enumeration timing attacks.
- **Production Startup Guards**: In `NODE_ENV=production`, `loadEnv()` enforces that `MONGODB_URI` is non-empty and `JWT_ACCESS_SECRET` is not the default development secret.
- **Simulator Production Policy**: `SIMULATOR_ENABLED` defaults to `false` in production to prevent unintended synthetic location generation.

### 4. Socket.IO Real-Time Hardening
- **Handshake Validation**: Handshake accepts optional bearer tokens. If a token is supplied but invalid or expired, handshake is rejected with an authentication failure.
- **Room Hoarding Limit**: Enforces `MAX_ROOMS_PER_SOCKET = 15`. Attempts to join more than 15 channels emit a `MAX_SUBSCRIPTIONS_EXCEEDED` error.
- **Per-Socket Event Limiting**: Socket event rate limiter throttles subscription and unsubscription flooding (20 requests / 10s per socket).
- **Cleanup**: Sockets cleanly detach rooms and purge subscribed room caches on disconnect.

### 5. External GPS Ingestion Contract
- **Endpoint**: `POST /api/v1/location/ingest`
- **Required Headers**:
  - `X-Device-Id`: Registered onboard telematics hardware ID.
  - `X-Timestamp`: UTC timestamp (enforces +/- 5-minute replay window).
  - `X-Nonce`: Unique request nonce (checked against sliding in-memory anti-replay cache).
  - `X-Signature-SHA256`: Hex-encoded HMAC-SHA256 signature calculated over the exact raw request bytes using `GPS_INGESTION_HMAC_SECRET`.
- **Pipeline Integration**: Ingested observations flow into `LocationPipelineService`, executing structural validation, freshness classification (`LIVE`), route snapping, kinematic anomaly checks, atomic persistence, and Socket.IO broadcast.
- **Simulator Protection Guard**: Simulator observations are strictly forbidden from overwriting active authorized GPS observations.
- **Hardware Integration Status**: Security and API contracts fully implemented and verified in software; physical onboard hardware device deployment remains pending TNSTC vendor rollout.

### 6. Production Infrastructure & Deployment Runbook
- **Reverse Proxy**: Place backend behind NGINX, Cloudflare, or AWS ALB. Terminate TLS 1.3 (HTTPS on 443, WSS for WebSockets).
- **Sticky Sessions**: Required if horizontal scaling uses multiple container replicas with Socket.IO polling fallback.
- **Clustering**: Add `@socket.io/redis-adapter` with a managed Redis cluster for cross-worker broadcast synchronization.
- **Health Probes**:
  - Liveness probe: `GET /api/v1/health` (HTTP 200, checks event loop responsiveness).
  - Readiness probe: `GET /api/v1/ready` (HTTP 200, checks active MongoDB connection).
- **Graceful Shutdown**: Listens for `SIGTERM` / `SIGINT`. Closes Socket.IO server, terminates active simulator timers, stops HTTP listener, and gracefully disconnects MongoDB with a 10-second timeout safety net.
- **Database Backups**: Schedule automated `mongodump` / Atlas continuous snapshots with point-in-time recovery enabled.


