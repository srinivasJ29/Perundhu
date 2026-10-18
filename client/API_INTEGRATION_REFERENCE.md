# PERUNDHU (பேருந்து) — Frontend API Integration Reference

This document records the **verified backend integration contracts** discovered directly from the PERUNDHU backend codebase (`server/src/`), Postman collection (`perundhu_api_collection.json`), and database models (`server/src/models/`).

---

## 1. Network & Gateway Architecture

| Gateway Element | Development Value | Production Configuration |
|---|---|---|
| **REST API Base URL** | `http://localhost:5000/api/v1` | Configurable via `VITE_API_BASE_URL` |
| **Socket.IO Real-Time URL** | `http://localhost:5000` | Configurable via `VITE_SOCKET_URL` |
| **CORS Origin Validation** | `http://localhost:5173` | Allowed via backend `CLIENT_ORIGIN` |
| **Correlation Header** | `X-Request-Id` | Emitted on every request & response |
| **Timezone Standard** | `Asia/Kolkata` (IST, UTC+05:30) | Server timestamps formatted in ISO 8601 |
| **Coordinate Standard** | GeoJSON `[longitude, latitude]` | WGS84 projection, Tamil Nadu bounding box |

---

## 2. Authentication & Session Contracts

### 2.1 Security & Token Lifecycle
- **Password Hashing:** Argon2id with constant-time dummy verification.
- **Access Token:** Short-lived JWT (`15m`), passed via `Authorization: Bearer <accessToken>`.
- **Refresh Token:** Long-lived token (`7d`), rotated atomically with reuse detection.
- **Cookie Policy:** HttpOnly, `SameSite=Lax` (dev) / `Strict` (prod), path `/api/v1/auth`.
- **Browser Credentials:** All requests use `credentials: 'include'`.
- **Roles:** `PASSENGER` (default citizen role) and `ADMIN` (enforced server-side).

### 2.2 Verified Authentication Endpoints

| Method | Endpoint | Auth | Request Body | Response Shape |
|---|---|---|---|---|
| `POST` | `/auth/register` | None | `{ email, password, fullName, phone? }` | `{ data: UserDto }` (201 Created) |
| `POST` | `/auth/login` | None | `{ email, password }` | `{ data: { user, accessToken, refreshToken } }` (200 OK + HttpOnly cookie) |
| `POST` | `/auth/refresh` | Cookie / Body | `{ refreshToken? }` | `{ data: { accessToken, refreshToken } }` (200 OK + rotated cookie) |
| `POST` | `/auth/logout` | None | `{ refreshToken? }` | `{ message: 'Logged out successfully' }` (200 OK + cookie cleared) |
| `GET` | `/auth/me` | Bearer Token | None | `{ data: UserDto }` (200 OK) |
| `GET` | `/auth/admin-check` | Bearer Token (`ADMIN`) | None | `{ message: 'Admin access verified', user }` (200 OK / 403 Forbidden) |

---

## 3. Verified Catalog & Spatial Query Endpoints

### 3.1 System Health
| Method | Endpoint | Auth | Description | Response Shape |
|---|---|---|---|---|
| `GET` | `/health` | None | Liveness probe & uptime | `{ status: 'healthy', timestamp, uptimeSeconds, environment }` |
| `GET` | `/ready` | None | Database connection readiness | `{ status: 'ready', timestamp, dependencies: { database: 'connected' } }` |

### 3.2 Districts & Bus Stands
| Method | Endpoint | Auth | Parameters | Response Shape |
|---|---|---|---|---|
| `GET` | `/districts` | None | `page`, `limit`, `q` (search) | `PaginatedResult<DistrictDto>` |
| `GET` | `/districts/:districtId/bus-stands` | None | `page`, `limit` | `PaginatedResult<BusStandDto>` |
| `GET` | `/bus-stands/nearby` | None | `lat`, `lng`, `radiusMeters`, `page`, `limit` | `PaginatedResult<NearbyBusStandDto>` (MongoDB `$geoNear`) |
| `GET` | `/bus-stands/:standId/routes` | None | `page`, `limit` | `PaginatedResult<StandRouteDto>` |

### 3.3 Routes & Geometry
| Method | Endpoint | Auth | Parameters | Response Shape |
|---|---|---|---|---|
| `GET` | `/routes/:routeId/directions/:directionId` | None | `routeId`, `directionId` | `RouteDirectionDetailDto` (includes ordered stops & GeoJSON `LineString` coordinates) |

### 3.4 Bus Fleet
| Method | Endpoint | Auth | Parameters | Response Shape |
|---|---|---|---|---|
| `GET` | `/buses` | None | `page`, `limit`, `status`, `vehicleType` | `PaginatedResult<BusDto>` |
| `GET` | `/buses/:busId` | None | `busId` | `{ data: BusDto }` |
| `GET` | `/buses/:busId/trips` | None | `dayOfWeek`, `page`, `limit` | `PaginatedResult<ScheduledTripDto>` |

### 3.5 Scheduled Trips & Timetables
| Method | Endpoint | Auth | Parameters | Response Shape |
|---|---|---|---|---|
| `GET` | `/trips` | None | `page`, `limit`, `status`, `routeDirectionId` | `PaginatedResult<ScheduledTripDto>` |
| `GET` | `/trips/active` | None | `page`, `limit` | `PaginatedResult<ScheduledTripDto>` |
| `GET` | `/trips/:tripId` | None | `tripId` | `{ data: ScheduledTripDto }` |
| `GET` | `/routes/:routeId/timetable` | None | `dayOfWeek` | `RouteTimetableDto` (outbound & inbound trips) |
| `GET` | `/stops/:stopId/departures` | None | `fromTime`, `toTime` | `StopDeparturesDto` (scheduled departures window) |

### 3.6 Passenger Next-Stop & Dynamic ETA (Phase 8)
| Method | Endpoint | Auth | Parameters | Response Shape |
|---|---|---|---|---|
| `GET` | `/trips/:tripId/next-stop` | None | `tripId` | `{ success: true, data: NextStopDetectionDto }` |
| `GET` | `/trips/:tripId/eta` | None | `tripId` | `{ success: true, data: DynamicTripEtaDto }` |
| `GET` | `/buses/:busId/eta` | None | `busId` | `{ success: true, data: DynamicBusEtaDto }` |

---

## 4. Socket.IO Real-Time Pub/Sub Contracts (Phase 9)

### 4.1 Connection & Handshake
- **Transports:** `['websocket', 'polling']`
- **Handshake Authentication:** Public passenger access allowed; authenticated users supply `auth: { token: '<jwt>' }`.
- **Per-Socket Subscription Limit:** Maximum 15 rooms concurrent.
- **Subscription Rate Limit:** 20 requests per 10 seconds.

### 4.2 Room Naming Conventions
- Specific Bus: `bus:<busId>` (e.g. `bus:6ad04f9acac25e5e811df250`)
- Entire Route: `route:<routeId>` (e.g. `route:6ad04f9acac25e5e811df249`)

### 4.3 Client-to-Server Events
| Event Name | Payload | Expected Response Event |
|---|---|---|
| `subscribe:bus` | `{ busId: string }` | `subscription:ack` or `subscription:error` |
| `unsubscribe:bus` | `{ busId: string }` | `unsubscription:ack` or `subscription:error` |
| `subscribe:route` | `{ routeId: string }` | `subscription:ack` or `subscription:error` |
| `unsubscribe:route` | `{ routeId: string }` | `unsubscription:ack` or `subscription:error` |

### 4.4 Server-to-Client Broadcast Events
| Event Name | Room | Payload Description |
|---|---|---|
| `bus:position` | `bus:<busId>`, `route:<routeId>` | Full telemetry update (`coordinates: [lng, lat]`, speed, heading, progressRatio, `trackingStatus`, `source`). |
| `bus:status` | `bus:<busId>`, `route:<routeId>` | Emitted when tracking status transitions (`previousStatus`, `currentStatus`). |
| `bus:next-stop` | `bus:<busId>`, `route:<routeId>` | Approaching/Arrived/Departed next stop resolution and distance in meters. |
| `bus:eta` | `bus:<busId>`, `route:<routeId>` | Dynamic ETA predictions for next stop and downstream stops (`isRealTimePrediction: false` for simulated). |
| `bus:stop-event` | `bus:<busId>`, `route:<routeId>` | Confirmed stop arrival or departure event along trip itinerary. |

---

## 5. Standard Error Format

All error responses from the backend adhere strictly to:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Bus with ID '6ad04f9acac25e5e811df250' was not found",
    "details": {},
    "timestamp": "2026-10-16T12:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## 6. Unconfirmed / Future Step Boundaries

1. **Map Provider Credentials:** Map tile provider URLs (OSM, Carto, Mapbox) are provisional and unconfirmed. No private keys are configured.
2. **Satellite / Hybrid Imagery:** Provider endpoints remain unconfirmed until Step 8.
3. **Hardware GPS Ingestion:** Hardware ingestion endpoint (`POST /location/ingest`) requires raw HMAC-SHA256 device signatures and is intended for hardware telematics boxes, not browser clients.
