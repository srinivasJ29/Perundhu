# PERUNDHU (பேருந்து) — Phase 12: Admin, Depot, Driver & Conductor Dashboards

## Executive Summary

Phase 12 delivers the enterprise command-and-control operations suite for PERUNDHU (பேருந்து), Tamil Nadu's statewide intelligent public transportation platform. Building directly on the foundational databases (Phases 1–3), real GPS hardware integrations and telemetry pipelines (Phases 4–5), live tracking and passenger applications (Phases 6–7), AI/ML arrival time predictors (Phase 9), intelligent analytics (Phase 10), and authentic Tamil Nadu visual identity (Phase 11), Phase 12 implements dedicated, role-authorized operations consoles for all transportation stakeholders:

1. **Transport Administrator Command Centre**: Statewide executive dashboard aggregating verified MongoDB metrics on fleet strength, operational status, GPS telemetry freshness (<5m connected, 5m–30m stale, >30m offline), trip punctuality, crew duty readiness, and AI ETA model health.
2. **Depot Manager Console**: Scoped operational workstation with strict server-enforced depot data isolation, live scheduled departures, delayed departure alerts, fleet roster telemetry, and transactional trip resource assignment workflows (Bus, Driver, Conductor) with backend conflict prevention.
3. **Dispatcher Radar**: Real-time corridor dispatch console maintaining strict provenance separation between certified hardware GPS (`HARDWARE_GPS`, `AIS-140`) and simulated vehicles (`SIMULATOR`), ensuring test data is never portrayed as physical bus movement.
4. **Mobile-First Driver Cockpit**: Touch-optimized interface for standing pre-trip inspection and pre-departure workflows, featuring assigned vehicle details, corridor path, ordered stop sequence, a 3-step action lifecycle ("1. Confirm Pre-Trip Readiness" → "2. Start Trip" → "3. Complete Trip"), and read-only GPS telemetry indicators that strictly prevent coordinate spoofing.
5. **Mobile-First Conductor Console**: Mobile console providing paired ETM device status, battery level, firmware version, ordered stops with fare stage numbers, and an honest telemetry notice: *"ETM Ticketing Telemetry Pending Live Terminal Handshake — Passenger counts protected"*, refusing to fabricate ticketing counts or revenue.
6. **Role-Authorized Reports & Sanitized CSV Export**: Export engine generating authenticated reports (`FLEET_STATUS`, `TRIP_COMPLETION`, `ROUTE_PERFORMANCE`, `GPS_DEVICE_HEALTH`, `STAFF_ASSIGNMENTS`) with strict formula injection defense and zero PII exposure.
7. **Bilingual Parity**: 100% parity across English and Tamil (தமிழ்) with typography and color tokens adhering to the PERUNDHU design system (`#071F22`, `#1D7873`, `#67958C`, `#F5C096`, `#EF2E33`, `#F6F8F6`, `#FFFFFF`).

### Automated Verification Baseline
- **Server Test Suite**: 60 test files, **510 / 510 tests passed (100%)**.
- **Client Test Suite**: 18 test files, **143 / 143 tests passed (100%)**.
- **Server TypeScript Check**: **0 errors**.
- **Client TypeScript Check**: **0 errors**.
- **Client Production Build**: Vite production bundle compiled in 9.74s with **0 errors**.
- **Git State**: All files implemented on the working tree without committing or pushing per project instructions.

---

## 1. Role-Based Access Control & Organizational Scope Architecture

### 1.1 Enterprise Roles & Permissions Matrix
The user role enumeration (`server/src/types/auth.ts` and `client/src/types/domain.ts`) was expanded to support the complete hierarchy of Tamil Nadu State Transport Corporation (TNSTC) operations while maintaining full backward compatibility:

| Role Enum | Scope Level | Primary Access Rights |
|---|---|---|
| `SUPER_ADMIN` | Statewide | Full system configuration, audit logs, all organizations and divisions |
| `TRANSPORT_ADMIN` | Statewide / Corporation | Statewide executive command centre, fleet distribution, AI model health, system reports |
| `REGIONAL_ADMIN` | Region | Regional depots, fleet allocations, regional transfers, aggregated performance |
| `DIVISION_ADMIN` | Division | Divisional depots, route rosters, schedule adherence, division reports |
| `DEPOT_MANAGER` | Depot | Scoped depot fleet, trip assignment workflows, staff roster, device checkouts |
| `WORKSHOP_MANAGER`| Workshop | Maintenance bays, vehicle service records, breakdown queues, spare parts |
| `DISPATCHER` | Depot / Terminal | Live corridor radar, upcoming departures countdown, delay flags |
| `DRIVER` | Individual Crew | Mobile duty console, assigned bus, trip lifecycle transitions, read-only GPS |
| `CONDUCTOR` | Individual Crew | Mobile ticketing console, paired ETM status, fare stages, honest telemetry |
| `ANALYST` | Read-Only Statewide | Operations BI, demand readiness diagnostics, route bottlenecks, CSV exports |
| `PASSENGER` | Public | Live map, route search, AI arrival predictions, nearby bus stands |
| `ADMIN` | Legacy Backward-Compat | Mapped to administrative privileges across existing Phase 0–11 endpoints |

### 1.2 Server-Enforced Organizational Scope Isolation
Security boundaries are strictly enforced on the server rather than relying on frontend view filtering. Every authenticated user carries organizational scope identifiers embedded in their token payload and `req.user`:
```typescript
export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  preferredLanguage?: 'en' | 'ta';
  organizationId?: string;
  divisionId?: string;
  depotId?: string;
  workshopId?: string;
  crewMemberId?: string;
  badgeNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Enforcement Principles:
1. **Depot Manager Isolation**: If a `DEPOT_MANAGER` requests `/operations/dashboard/depot-manager` or invokes trip assignments, the backend verifies that `req.user.depotId` matches the requested depot. If no parameter is passed, the backend automatically scopes the query to `req.user.depotId`. A depot manager can never view or modify trips belonging to other depots.
2. **Driver / Conductor Isolation**: When accessing `/operations/dashboard/driver` or `/operations/dashboard/conductor`, the user is resolved directly from `req.user.crewMemberId`. Drivers can only perform action transitions on their assigned trips.
3. **Socket.IO Fleet Room Isolation**: `socket.server.ts` checks user roles and scope when subscribing to real-time rooms. If a depot-scoped user attempts to subscribe to `fleet:all`, their subscription is scoped to `fleet:depot:<depotId>`, preventing unauthorized eavesdropping on other depots.

---

## 2. Transport Administrator Dashboard

### 2.1 Live MongoDB Aggregations (`/operations/dashboard/transport-admin`)
The Transport Administrator Command Centre queries live MongoDB collections (`Bus`, `Trip`, `Driver`, `Conductor`, `LatestBusPosition`, `DeviceRegistry`, `Alert`) with zero mocked or synthetic numbers:

- **Fleet Availability**:
  - `totalRegisteredBuses`: `Bus.countDocuments()`
  - `activeBuses`: `Bus.countDocuments({ status: { $in: ['IN_SERVICE', 'AVAILABLE'] } })`
  - `reserveBuses`: `Bus.countDocuments({ isReserve: true })`
  - `maintenanceBuses`: `Bus.countDocuments({ status: { $in: ['MAINTENANCE', 'BREAKDOWN'] } })`
  - `fleetUtilizationPercent`: Percentage of available fleet currently deployed on active scheduled trips.
- **GPS Telemetry Freshness Categorization**:
  - `gpsConnectedBuses`: Bus positions with `recordedAt` within the last 5 minutes.
  - `gpsStaleBuses`: Bus positions with `recordedAt` between 5 and 30 minutes.
  - `gpsOfflineBuses`: Bus positions with `recordedAt` older than 30 minutes or without GPS fix.
- **Trip Operations Adherence**:
  - `totalTripsToday`: Scheduled departures for the active calendar day.
  - `completedTrips`: Trips with `status === 'COMPLETED'`.
  - `busesInTransit`: Trips with `status === 'IN_TRANSIT'`.
  - `delayedTrips`: Trips operating with $>15\text{m}$ variance against scheduled departures.
- **AI/ML ETA Service Health**:
  - Reports status (`OPERATIONAL` or `DEGRADED`), active model identifier (`LightGBM-ETA-v2.1`), and confidence interval metrics derived from Phase 9 runtime monitoring.
- **Depot Comparison Matrix**:
  - Comparative metrics across depots in the jurisdiction: Depot Name, Code, Total Buses, Active Fleet, Buses In Transit, Punctuality Rate, and GPS Online Rate.

---

## 3. Depot Manager Operational Console

### 3.1 Scoped Fleet & Departures Overview (`/operations/dashboard/depot-manager`)
The Depot Manager Console provides immediate operational awareness for the active depot:
- **Depot Profile**: Displays Depot Name, Code, Region, Division, and Total Capacity.
- **Scheduled Departures Table**: Lists all active departures sorted by departure time with Route Number, Corridor (Origin → Destination), Scheduled Departure & Arrival, Assigned Bus, Assigned Driver, Assigned Conductor, and Trip Status.
- **Delayed Departure Indicators**: Departures delayed beyond schedule display an amber warning badge with the exact delay duration (e.g. `+15m delay`).
- **Staff Duty Availability Strip**: Real-time counter of Available, On-Duty, and On-Leave Drivers and Conductors.
- **Device Health Roster**: Operational vs maintenance ETM ticketing terminals and online GPS trackers.

### 3.2 Transactional Resource Assignment Workflows
Depot managers can assign resources to scheduled departures via dedicated endpoints with strict conflict validation:
- `POST /operations/assignments/trip-bus`: Assigns a bus to a trip.
- `POST /operations/assignments/trip-driver`: Assigns a driver to a trip.
- `POST /operations/assignments/trip-conductor`: Assigns a conductor to a trip.

#### Backend Conflict Prevention Rules:
1. **Bus Depot Ownership**: The bus must belong to the active depot (`bus.depotId === trip.depotId`).
2. **Vehicle Availability**: The bus must have status `'AVAILABLE'` or `'IN_SERVICE'`. Buses in `'MAINTENANCE'` or `'BREAKDOWN'` are rejected with HTTP 409 Conflict.
3. **No Duplicate Bus Transit**: A bus cannot be assigned to two overlapping active trips.
4. **Staff Duty Validation**: The driver or conductor must be active and not marked on leave.
5. **No Conflicting Crew Duty**: Crew members cannot be assigned to multiple active trips simultaneously.

---

## 4. Dispatcher Operations Radar

### 4.1 Strict Telemetry Provenance Separation (`/operations/dashboard/dispatcher`)
Public transportation safety and regulatory compliance require an absolute distinction between physical GPS hardware and software simulators:
- **Certified Hardware GPS (`HARDWARE_GPS`, `AIS-140`)**: Displayed with an authorized green badge and GPS frequency icon. Represents verified GNSS hardware installed on TNSTC buses with cryptographic HMAC authentication (Phase 5).
- **Simulator Feeds (`SIMULATOR`)**: Filtered out by default from dispatcher consoles. When explicitly enabled via the "Include Simulator Data" toggle, simulator vehicles are clearly labeled with a prominent gray badge: `[SIMULATOR ONLY — TEST FEED]`.
- Under no circumstances is simulator data portrayed as real-world physical transit movement.

### 4.2 Delayed Departures & Countdown Timeline
- **Delayed Departures Radar**: Surfaces departures experiencing schedule slippage exceeding 15 minutes, highlighting the assigned bus, corridor, and dispatcher remarks.
- **Upcoming Departures Countdown**: Displays departures scheduled within the next 30 minutes with real-time minutes remaining, assignment status flags (Bus Assigned: Yes/No, Crew Assigned: Yes/No), and driver pre-trip readiness confirmation.

---

## 5. Mobile-First Driver Cockpit

### 5.1 Pre-Trip & Pre-Departure Ergonomics
Drivers operate in mobile environments where complex desktop tables are unusable. The Driver Dashboard (`/driver` and `/operations/driver-dashboard`) provides a high-contrast, touch-optimized card layout:
- **Driver Profile**: Driver Full Name, Official Badge Number (`DRV-5801`), and Home Depot.
- **Assigned Bus Card**: Vehicle Registration (`TN 58 N 1234`), Fleet Number (`MDU-701`), Vehicle Model, and authentic TNSTC livery classification.
- **Corridor Summary**: High-visibility origin-to-destination corridor path with scheduled departure and arrival timestamps.
- **Ordered Stop Sequence**: Vertical timeline displaying ordered stops, scheduled arrival times, and completion indicators.
- **Read-Only GPS Telemetry Indicator**: Displays GPS fix status (`CONNECTED` / `ACQUIRING`) with a security disclosure: *"Tamper-protected AIS-140 GPS unit active. Telemetry secured."* Coordinate spoofing or client-side location override is architecturally prohibited.

### 5.2 3-Step Action Lifecycle
The driver progresses through an authenticated, sequential state machine:
```
[ SCHEDULED (Ready: false) ]
             │
             │ driverConfirmReady()
             ▼
[ SCHEDULED (Ready: true) ]
             │
             │ driverStartTrip()
             ▼
[ IN_TRANSIT (Bus: IN_SERVICE) ]
             │
             │ driverCompleteTrip()
             ▼
[ COMPLETED (Bus: AVAILABLE) ]
```
1. **Step 1: Confirm Pre-Trip Readiness** (`POST /operations/driver/trips/:tripId/ready`): Driver performs pre-trip inspection and confirms physical readiness. Updates `trip.isReady = true`.
2. **Step 2: Start Trip Now** (`POST /operations/driver/trips/:tripId/start`): Triggered upon terminal departure. Sets `trip.status = 'IN_TRANSIT'` and updates the bus to `'IN_SERVICE'`.
3. **Step 3: Complete Trip (Arrival)** (`POST /operations/driver/trips/:tripId/complete`): Triggered upon reaching the destination terminal. Sets `trip.status = 'COMPLETED'` and releases the bus to `'AVAILABLE'`.

---

## 6. Mobile-First Conductor Console

### 6.1 Paired ETM Status & Honest Telemetry Notice
The Conductor Dashboard (`/conductor` and `/operations/conductor-dashboard`) is designed for operational duty alongside Electronic Ticket Machines:
- **Conductor Profile**: Full Name, Badge Number (`CND-5801`), and Depot.
- **Paired ETM Device Card**: Hardware ID, Device Model (`Verifone-TNSTC-POS`), Battery Percentage (`94%`), and Live Connectivity (`ONLINE`).
- **Data Governance Notice**:
  > **ETM Ticketing Telemetry Pending Live Terminal Handshake — Passenger counts protected**
  In strict alignment with PERUNDHU transport architecture standards, passenger counts, ticket revenue, and boarding statistics are never fabricated or estimated from GPS pings. Until live ETM transaction batches are ingested through the IT gateway, telemetry is truthfully labeled as pending live terminal handshake.
- **Route Fare Stages**: Displays ordered route stops with designated Tamil Nadu transport fare stages (e.g. `Stage 1 (₹0)`, `Stage 2 (₹7)`, `Stage 3 (₹12)`, `Stage 4 (₹18)`).

---

## 7. Reports & Sanitized CSV Export Engine

### 7.1 Role-Authorized Export (`GET /operations/reports/export`)
Authorized administrative and depot roles can generate official CSV reports:
- `FLEET_STATUS`: Vehicle registrations, fleet numbers, depot allocations, operational status, and telemetry freshness.
- `TRIP_COMPLETION`: Scheduled vs actual departure/arrival times, delay minutes, completion statuses, and assigned crew.
- `ROUTE_PERFORMANCE`: Corridor travel durations, delay frequencies, and punctuality percentages.
- `GPS_DEVICE_HEALTH`: Hardware IMEIs, device models, battery levels, last ping timestamps, and firmware versions.
- `STAFF_ASSIGNMENTS`: Duty rosters, badge numbers, assigned trips, and attendance statuses.

### 7.2 Formula Injection Defense (CSV Injection Protection)
Opening CSV files in spreadsheet applications (Microsoft Excel, LibreOffice Calc, Google Sheets) poses serious remote code execution and formula injection risks if malicious strings begin with execution tokens.

The export service implements rigorous cell sanitization:
```typescript
private sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // CSV Formula Injection Defense: Neutralize spreadsheet command triggers
  if (/^[=+@\t\r\-]/.test(str)) {
    str = `'${str}`;
  }

  // Escape standard quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes("'")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
```
Any cell starting with `=`, `+`, `-`, `@`, `\t`, or `\r` is neutralized by prepending a single quote `'`. Private driver phone numbers and personal home addresses are automatically redacted from all exported CSV files.

---

## 8. Verification & Quality Assurance Summary

### 8.1 Backend Integration Test Suite (`server/tests/integration/operationsRoutes.test.ts`)
12 integration tests covering every security, RBAC, isolation, and functional requirement:
1. `GET /api/v1/operations/dashboard/transport-admin`: Enforces administrative RBAC (rejects unauthenticated requests and passenger accounts with HTTP 403 Forbidden).
2. `GET /api/v1/operations/dashboard/transport-admin`: Returns verified enterprise KPIs, fleet breakdown, and AI model health for authorized administrators.
3. `GET /api/v1/operations/dashboard/depot-manager`: Enforces server-side organizational scope isolation (prevents depot managers from accessing unauthorized depots).
4. `GET /api/v1/operations/dashboard/depot-manager`: Returns scoped fleet roster, scheduled departures, delay indicators, and device statuses.
5. `POST /api/v1/operations/assignments/trip-bus`: Validates bus assignment and rejects vehicles in maintenance or breakdown with HTTP 409 Conflict.
6. `POST /api/v1/operations/assignments/trip-driver`: Assigns driver and prevents double-assignment conflicts across overlapping trips.
7. `GET /api/v1/operations/dashboard/dispatcher`: Returns live operations radar and enforces strict provenance separation between certified hardware GPS and simulator feeds.
8. `GET /api/v1/operations/dashboard/driver`: Returns scoped driver cockpit data for authenticated drivers.
9. `POST /api/v1/operations/driver/trips/:tripId/ready`: Updates driver pre-trip readiness state.
10. `POST /api/v1/operations/driver/trips/:tripId/start` & `complete`: Transitions trip lifecycle from `SCHEDULED` → `IN_TRANSIT` → `COMPLETED` and updates bus operational availability.
11. `GET /api/v1/operations/dashboard/conductor`: Returns paired ETM terminal status, honest pending telemetry notice, and fare stages.
12. `GET /api/v1/operations/reports/export`: Neutralizes spreadsheet formula injection characters (`=`, `+`, `-`, `@`) and redacts PII.

### 8.2 Frontend Component & Integration Test Suite (`client/tests/operationsDashboards.test.tsx`)
10 UI and integration tests with bilingual validation:
1. `TransportAdminDashboardPage`: Renders executive command centre with live MongoDB KPIs, fleet distribution, depot comparisons, and AI health status.
2. `TransportAdminDashboardPage`: Opens and closes sanitized CSV report export modal.
3. `DepotManagerDashboardPage`: Renders depot profile, scheduled departures, and delay indicators (`+15m delay`).
4. `DepotManagerDashboardPage`: Opens trip assignment modal and triggers vehicle assignment.
5. `DispatcherDashboardPage`: Displays active radar with strict provenance separation between `HARDWARE_GPS` and `SIMULATOR`.
6. `DriverDashboardPage`: Renders mobile cockpit with assigned bus, route corridor, ordered stop timeline, and read-only GPS indicator.
7. `DriverDashboardPage`: Handles 3-step action lifecycle ("1. Confirm Pre-Trip Readiness", "2. Start Trip", "3. Complete Trip").
8. `ConductorDashboardPage`: Displays paired ETM battery and connectivity, honest pending telemetry notice, and ordered fare stages.
9. `ReportExportModal`: Renders export category options and downloads sanitized CSV with formula injection defenses.
10. `Bilingual Tamil Parity`: Verifies authentic Tamil labels, badges, and headings when language is set to `ta`.

### 8.3 Repository Test Metrics

| Test Suite | Total Test Files | Total Tests | Status |
|---|---|---|---|
| Server Tests (Vitest) | 60 | 510 | **100% Passed** |
| Client Tests (Vitest) | 18 | 143 | **100% Passed** |
| Server TypeScript Check | — | — | **0 Errors** |
| Client TypeScript Check | — | — | **0 Errors** |
| Client Production Build | — | — | **0 Errors (9.74s)** |

---

## 9. Limitations & Forward Roadmap

1. **Physical ETM USB/BLE Pairing**: In Phase 12, conductor-to-ETM device pairing is managed via verified database registries (`DeviceRegistry` and `CrewMember`). Physical WebBluetooth / WebUSB peripheral pairing for local thermal printing will be added in subsequent hardware expansion phases.
2. **Statewide District Expansion**: The pilot focuses on the Madurai District transport corridor (Depots: Madurai Central, Mattuthavani; Corridors: Route 70, Route 77). The database models and dashboard architecture are fully parameter-driven, ready to ingest operational data from all 38 districts of Tamil Nadu.
3. **Automated Duty Roster Optimization**: Crew assignment currently requires explicit depot manager authorization. In a future update, automated duty roster scheduling with labor law rest compliance can be incorporated into the dispatch engine.

