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
5. **Phase 5: Bus Identity, Trip & Timetable Modules** *(Next Phase)*
   - Vehicle fleet metadata, daily operational schedules, scheduled departure times.
6. **Phase 6: Location-Provider Abstraction & Deterministic Simulator**
   - `ILocationProvider` interface.
   - Autonomous server-side mathematical movement engine along route geometry.
7. **Phase 7: Position Validation, Freshness, Latest-Position Storage & Route Matching**
   - Bounding box and kinematic anomaly filters.
   - Cross-track polyline snapping, progress calculation, and 24-hour TTL location history.
8. **Phase 8: ETA Service & Next-Stop Detection**
   - Dynamic ETA calculation based on segment distance, rolling average speed, and stop dwell times.
9. **Phase 9: Socket.IO Real-Time Updates & Administrator Simulator Controls**
   - Pub/sub WebSocket channels (`route:{routeId}`, `bus:{busId}`).
   - Protected admin controls to start, pause, resume, and inject simulation anomalies.
10. **Phase 10: Backend Security, Automated Testing & Deployment**
    - Security headers, rate limiting, mutual TLS / HMAC GPS ingestion contracts.
    - Deployment to Render/container host with MongoDB Atlas.
11. **Phase 11: Frontend Design & Implementation**
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
