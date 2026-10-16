# PERUNDHU — TNSTC Live Tracking System

**PERUNDHU** (பேருந்து) is a real-time public bus tracking web application designed for Tamil Nadu, India, beginning with the Madurai pilot corridor and architected for statewide scaling across all 38 districts.

---

## 1. Revised Implementation Roadmap (Backend-First Strategy)

To ensure reliable contracts, deterministic location processing, and rigorous security, development follows a **backend-first** methodology:

1. **Phase 1: Backend Foundation & Development Environment** *(Completed)*
   - Node.js LTS, TypeScript strict compiler configuration, Express 4.
   - Fail-fast Zod environment validation.
   - Structured logging with Pino (secrets & PII redaction).
   - Centralized error handling and standardized JSON payloads.
   - Cloud-native liveness (`/api/v1/health`) and readiness (`/api/v1/ready`) probes.
   - Vitest unit tests and Supertest HTTP integration test suites.
2. **Phase 2: Database Connection, Data Models & Geographic Seed Data** *(Completed)*
   - MongoDB Atlas/local connection lifecycle.
   - Mongoose schemas for Districts, Bus Stands, Stops, Routes, Route Directions, and Sequences with GeoJSON `Point` and `2dsphere` indexes.
   - Surveyed Madurai pilot seed data (Mattuthavani, Periyar, Arappalayam, Routes 70 & 77).
3. **Phase 3: District, Bus-Stand, Stop & Route REST APIs** *(Completed)*
   - Public query endpoints, nearby bus-stand spatial search using `$nearSphere`.
   - Ordered stop sequences and route polylines.
4. **Phase 4: Authentication, Sessions & Role-Based Authorization** *(Completed)*
   - Argon2id password hashing, JWT access/refresh token rotation with reuse detection.
   - `PASSENGER` and `ADMIN` role guards, rate limiting, and HttpOnly secure cookie rotation.
5. **Phase 5: Bus Identity, Trip & Timetable Modules** *(Completed)*
   - Vehicle fleet metadata, status management, and paginated bus queries (`/api/v1/buses`).
   - Scheduled trips search and persisted active trip tracking (`/api/v1/trips`, `/api/v1/trips/active`).
   - Route timetables by direction and stop departures by time window (`/api/v1/routes/:id/timetable`, `/api/v1/stops/:id/departures`).
   - Strict Indian Standard Time (`Asia/Kolkata`) handling and explicit separation of static schedules from live GPS tracking.
   - Protected RBAC admin management endpoints (`/api/v1/admin/trips`, `/api/v1/admin/buses`).
6. **Phase 6: Location-Provider Abstraction & Deterministic Simulator** *(Completed)*
   - `ILocationProvider` interface & typed `LocationObservation` event contract.
   - Deterministic mathematical route movement along GeoJSON polylines ($D = \Delta t \times v \times \text{multiplier}$) avoiding tick-drift.
   - Spherical Haversine distance, forward azimuth bearing, and intermediate coordinate interpolation.
   - Bus eligibility filters (in-service buses, active scheduled trips, valid polylines $\ge 2$ points).
   - Conflict-safe atomic persistence preventing simulation data from overwriting newer authorized GPS telemetry.
   - Protected admin controls (`/api/v1/admin/simulator/status`, `/start`, `/stop`, `/reset`).
7. **Phase 7: Position Validation, Freshness, Route Matching & Movement Progress** *(Completed)*
   - Dedicated 6-stage universal observation ingestion pipeline (`LocationPipelineService`).
   - Structural and kinematic validation with WGS84, Tamil Nadu bounds, finite coordinate checks, and future clock-skew tolerance (`PositionValidationService`).
   - Temporal freshness classification (`FRESH`, `DELAYED`, `STALE`, `FUTURE_REJECTED`) and source-preserving tracking status mapping (`FreshnessService`).
   - Geodesic polyline snapping using equirectangular metric projection, cross-track deviation detection, and loop/repeated-stop disambiguation (`RouteMatchingService`).
   - Movement progress tracking, kinematic jump detection ($v_{\text{implied}} > v_{\max}$), and backward movement anomaly detection (`MovementProgressService`).
   - Concurrency-safe atomic persistence with optimistic concurrency and authorized real GPS protection.
8. **Phase 8: ETA Service & Next-Stop Detection** *(Completed)*
   - Next-stop detection algorithm using ordered stop sequences, along-route progress, and 50m/100m arrival/departure hysteresis (`NextStopService`).
   - Stop arrival/departure confirmation engine with consecutive observation filtering and concurrency-safe idempotent event persistence (`StopEventService`, `StopEvent` model).
   - Dynamic ETA prediction engine based on remaining route distance, rolling average speed (10–80 km/h bounded, 25 km/h stationary fallback), and intermediate stop dwell times (30s) (`EtaService`).
   - Truthfulness guarantees: simulated positions remain `predictionSource: 'SIMULATED_MOVEMENT'`, `isRealTimePrediction: false`, and `trackingStatus: 'SIMULATED'`. Timetable fallbacks explicitly labeled `SCHEDULE_FALLBACK`.
   - Public passenger REST endpoints (`GET /api/v1/trips/:tripId/next-stop`, `GET /api/v1/trips/:tripId/eta`, `GET /api/v1/buses/:busId/eta`).
9. **Phase 9: Socket.IO Real-Time Tracking & Live Broadcast Pipeline** *(Completed)*
   - Native Socket.IO integration with HTTP lifecycle (`initSocketServer`, `closeSocketServer`).
   - Controlled room subscriptions: `bus:{busId}` and `route:{routeId}` with strict ObjectId validation and database existence checks.
   - Public passenger read-only tracking and optional JWT authentication via handshake auth.
   - Universal location pipeline integration: broadcasts emitted ONLY after universal validation, freshness, snapping, and concurrency-safe persistence accept the observation.
   - Typed outbound event contracts: `subscription:ack`, `subscription:error`, `unsubscription:ack`, `bus:position`, `bus:status`, `bus:next-stop`, `bus:eta`, and `bus:stop-event`.
   - Truthful telemetry labeling: SIMULATOR telemetry strictly labeled `SIMULATED` (never `LIVE`), and simulated ETAs retain `isRealTimePrediction: false`.
   - Kinematic duplicate suppression and multi-room deduplication without redundant database queries.
   - Per-socket subscription rate limiting (20 req / 10s) and malformed payload protection.
   - Interactive developer test client script (`npm run socket:client`).
10. **Phase 10: Backend Security Hardening & GPS Ingestion Contract** *(Completed)*
    - Request correlation IDs (`X-Request-Id`) across headers, logs, and error responses.
    - Hardened HTTP security headers with Helmet (CSP, frameguard DENY, nosniff, XSS protection).
    - Origin-validated CORS allowlist and method filtering (blocking `TRACE`/`TRACK`/`CONNECT`).
    - Granular route-specific rate limiting (auth, admin, spatial search, public tracking, GPS ingestion).
    - Constant-time Argon2id dummy hash verification neutralizing email enumeration timing attacks.
    - Socket.IO hardening (channel subscription caps, handshake auth, disconnect cleanup).
    - Authenticated external telematics hardware GPS ingestion contract (`POST /api/v1/location/ingest`) with HMAC-SHA256 signature verification, 5-minute replay window, and anti-replay nonce tracking.
    - Comprehensive test suite: 44 test files, 346 passing unit and integration tests.
11. **Phase 11: Frontend Design & Implementation** *(Next Phase)*
    - React 18, Vite, Tailwind CSS, Leaflet.js interactive map.
    - Bilingual Tamil/English interface.
12. **Phase 12: End-to-End Integration & Authorized Real-GPS Pilot**
    - Testing against authorized physical mobile GPS or OBD tracking device.

---

## 2. Directory Layout

```
PERUNDHU/
├── server/                     # Backend service (Node.js, Express, TypeScript, Mongoose)
│   ├── src/                    # Source code
│   ├── tests/                  # Unit and integration test suites
│   ├── .env.example            # Environment template
│   └── package.json            # Server package manifest
├── package.json                # Root workspace definition
├── .gitignore                  # Git ignore rules
└── README.md                   # Project overview & roadmap
```

---

## 3. Running the Foundation Locally

```bash
# Navigate to backend directory
cd server

# Install dependencies
npm install

# Run automated tests
npm test

# Build production bundle
npm run build

# Start development server
npm run dev
```
