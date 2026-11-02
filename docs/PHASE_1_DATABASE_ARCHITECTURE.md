# PERUNDHU (பேருந்து) — Phase 1: Database Architecture & Transport Infrastructure Foundation

## 1. Executive Summary

Phase 1 establishes a production-grade, highly scalable database architecture and transport infrastructure foundation for the **PERUNDHU (பேருந்து)** Tamil Nadu public transportation tracking and fleet management platform.

### Core Accomplishments
1. **Zero Regression & Schema Safety**: All pre-existing 346 server tests and 84 client tests pass without disruption. The existing pilot dataset (Madurai districts, routes, bus stands, stops, and scheduled trips) operates seamlessly alongside the new enterprise infrastructure.
2. **Enterprise Transport Entities**: Designed and deployed schemas for **Transport Organizations**, **Divisions**, **Depots** (Primary, Secondary, and Backup with circular dependency rejection), **Maintenance Workshops**, **Crew Members** (Drivers and Conductors), **Device Registry** (ETMs and GPS Trackers), **Maintenance Records**, and **Vehicle Replacement Records**.
3. **Rigorous Validation & Data Integrity**: Implemented Mongoose pre-validation and pre-save hooks preventing illegal states (e.g. self-referencing backup depots, circular depot loops, or replacing a broken bus with the same bus).
4. **ETM & GPS Device Transparency**: Explicitly enforces device GPS status tracking (`VERIFIED_AVAILABLE`, `VERIFIED_UNAVAILABLE`, `UNKNOWN`). Conductor ETMs default to `UNKNOWN` until verified, and device/SIM secrets are safeguarded against exposure.
5. **Driver & Conductor Privacy (PII Protection)**: Public passenger APIs sanitize crew phone numbers, license details, and home assignments, while administrative systems retain full operational visibility.
6. **REST API Foundation with RBAC**: Implemented modular Express endpoints under `/api/v1` guarded by JSON Web Token authentication and `ADMIN` role checks.
7. **100% Test Coverage & Clean Builds**: Added 35 new tests (22 unit tests, 13 integration tests), bringing server tests to **381/381 passing across 46 test files**, with **0 TypeScript errors** and production Vite and Node.js builds succeeding.

---

## 2. Entity-Relationship Architecture

The PERUNDHU database foundation reflects real-world transport operations across Tamil Nadu:

```mermaid
erDiagram
    TransportOrganization ||--o{ TransportDivision : contains
    TransportOrganization ||--o{ Depot : operates
    TransportDivision ||--o{ Depot : assigns
    Depot ||--o{ Depot : "primary / backup relationship"
    Depot ||--o{ MaintenanceWorkshop : houses
    Depot ||--o{ Bus : assigns_fleet
    Depot ||--o{ CrewMember : assigns_staff
    Depot ||--o{ DeviceRegistry : inventories
    Bus ||--o{ MaintenanceRecord : logs_repairs
    Bus ||--o{ VehicleReplacementRecord : "original / replacement"
    ScheduledTrip ||--o{ VehicleReplacementRecord : links_replacement
    CrewMember ||--o{ ScheduledTrip : assigned_duty
    DeviceRegistry ||--o{ Bus : mounted_tracker
    DeviceRegistry ||--o{ CrewMember : handheld_etm
```

---

## 3. Database Models & Schema Specifications

### 3.1 Transport Organization (`TransportOrganization.ts`)
- **Collection**: `transport_organizations`
- **Purpose**: High-level transport corporations (e.g. State Transport Corporation entities).
- **Key Fields**:
  - `name`: string, required, trimmed.
  - `code`: string, uppercase, unique (e.g., `TNSTC-MDU`).
  - `shortName`: string, required.
  - `status`: `'ACTIVE' | 'INACTIVE'`.
  - `metadata`: object for operational configurations.

### 3.2 Transport Division (`TransportDivision.ts`)
- **Collection**: `transport_divisions`
- **Purpose**: Administrative regional divisions within an organization.
- **Key Fields**:
  - `organizationId`: ObjectId -> `TransportOrganization`.
  - `districtId`: ObjectId -> `District` (optional link to geographical pilot district).
  - `name`: string.
  - `code`: string, uppercase, unique compound index `(organizationId, code)`.
  - `status`: `'ACTIVE' | 'INACTIVE'`.

### 3.3 Depot Management (`Depot.ts`)
- **Collection**: `depots`
- **Purpose**: Operational bases for fleet staging, fueling, and crew dispatch.
- **Depot Types**:
  - `PRIMARY`: Main operational depot managing assigned routes and trips.
  - `SECONDARY`: Satellite depot handling regional turnaround or overnight staging.
  - `BACKUP`: Dedicated relief depot housing reserve fleet.
- **Integrity & Pre-Save Validation**:
  - **Self-reference rejection**: A depot cannot reference itself as its primary depot (`primaryDepotId.equals(_id)` rejected).
  - **Circular relationship rejection**: Async hook queries database to ensure Depot A cannot reference Depot B if Depot B already references Depot A.
  - **Backup depot constraint**: BACKUP depots MUST specify an explicit `primaryDepotId` within the same organization.
- **Indexes**:
  - Compound unique: `{ organizationId: 1, code: 1 }`.
  - Geospatial: `location: '2dsphere'`.

### 3.4 Maintenance Workshop (`MaintenanceWorkshop.ts`)
- **Collection**: `maintenance_workshops`
- **Purpose**: Pit lanes and heavy overhaul facilities.
- **Workshop Types**:
  - `DEPOT_PIT_LANE`: Fast inspection, tyre swaps, minor running repairs.
  - `REGIONAL_CENTRAL_WORKSHOP`: Major engine overhauls, body rebuilding, FC fitness tests.
- **Capability Matrix**:
  - `MINOR_REPAIRS`, `ROUTINE_SERVICE`, `HEAVY_OVERHAUL`, `BODY_WORK`, `ELECTRICAL`, `TYRE_RETREADING`, `FITNESS_CERTIFICATION`.
- **Geospatial Index**: `location: '2dsphere'`.

### 3.5 Bus & Fleet Relationships (`Bus.ts` — Safely Augmented)
- **Collection**: `buses`
- **Operational Statuses**:
  - `AVAILABLE`: Ready for trip assignment.
  - `IN_SERVICE`: Actively on an assigned scheduled trip.
  - `RESERVED`: Reserve fleet stationed at primary/backup depot for emergency replacement.
  - `UNDER_MAINTENANCE`: In depot pit lane or regional workshop.
  - `BREAKDOWN`: Active failure reported during service.
  - `MAINTENANCE`, `OFFLINE`: Backward-compatible legacy statuses.
  - `INACTIVE`: Decommissioned or off-road.
- **Enterprise Fields Added**:
  - `depotId`: ObjectId -> `Depot`.
  - `homeDepotId`: ObjectId -> `Depot`.
  - `isReserveFleet`: boolean (default `false`, indexed with `status`).
  - `assignedEtmDeviceId`: ObjectId -> `DeviceRegistry`.
  - `assignedGpsTrackerId`: ObjectId -> `DeviceRegistry`.
  - `assignedDriverId`: ObjectId -> `CrewMember`.
  - `assignedConductorId`: ObjectId -> `CrewMember`.
  - `currentOdometerKm`: number (min: 0).
  - `lastMaintenanceDate`: Date.
  - `nextMaintenanceDueKm`: number.
- **Backward Compatibility**: `depotName` (string) preserved; existing endpoints and tests continue functioning with zero degradation.

### 3.6 Crew Member Management (`CrewMember.ts`)
- **Collection**: `crew_members`
- **Roles**: `DRIVER`, `CONDUCTOR`.
- **Operational Statuses**: `ACTIVE`, `ON_DUTY`, `OFF_DUTY`, `ON_LEAVE`, `SUSPENDED`.
- **Assignment History**: Tracks chronological history of assigned buses and scheduled trips.
- **Privacy & PII Protection**:
  - `licenseNumber`, `licenseExpiryDate`, `contactNumber` strictly protected.
  - Public `/api/v1/crew` read endpoints automatically project out sensitive fields.

### 3.7 Device Registry (`DeviceRegistry.ts`)
- **Collection**: `device_registry`
- **Device Categories**: `ETM` (Electronic Ticketing Machine), `GPS_TRACKER` (Fixed Vehicle Telemetry Unit).
- **GPS Availability Status**:
  - `VERIFIED_AVAILABLE`: Hardware GPS confirmed active.
  - `VERIFIED_UNAVAILABLE`: Device confirmed without GPS (manual ticket POS).
  - `UNKNOWN`: Default status. Prevents speculative tracking assumptions.
- **Security & Secret Handling**:
  - No plaintext credentials, network passwords, or private keys stored in records.
  - SIM ICCID and IMEI visible only to authenticated `ADMIN` staff.

### 3.8 Maintenance Records (`MaintenanceRecord.ts`)
- **Collection**: `maintenance_records`
- **Categories**: `PREVENTIVE`, `BREAKDOWN`, `ACCIDENT`, `ROUTINE_INSPECTION`, `FITNESS_CERT`.
- **Priorities**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Lifecycle**: `REPORTED` -> `TRIAGED` -> `IN_PROGRESS` -> `WAITING_FOR_PARTS` -> `RESOLVED` -> `CLOSED`.
- **Automated Vehicle State Transitions**:
  - Reporting `BREAKDOWN` automatically sets bus status to `BREAKDOWN`.
  - Reporting routine maintenance sets bus status to `UNDER_MAINTENANCE`.
  - Updating repair status to `RESOLVED` or `CLOSED` restores bus status to `AVAILABLE`.

### 3.9 Vehicle Replacement Record (`VehicleReplacementRecord.ts`)
- **Collection**: `vehicle_replacements`
- **Purpose**: Operational audit and dispatch logs when a bus breaks down or requires relief.
- **Pre-Validation Hook**:
  - Rejects replacements where `originalBusId === replacementBusId`.
- **Automated Fleet Reallocation**:
  - Sets broken-down bus status to `BREAKDOWN`.
  - Validates replacement bus eligibility (rejects replacement if reserve bus is also under maintenance or broken down).
  - Sets replacement bus status to `IN_SERVICE`.
  - Dynamically updates active `ScheduledTrip.busId` to point to the replacement bus.
  - Records full audit trail (`auditHistory: [{ action, performedBy, timestamp, notes }]`).

---

## 4. REST API Foundation & RBAC

All endpoints are mounted under `/api/v1` and validated using strict Zod schemas:

| Resource | Method | Path | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Organizations** | `GET` | `/organizations` | Public | List active transport organizations |
| | `GET` | `/organizations/:id` | Public | Get organization details |
| | `POST` | `/admin/organizations` | ADMIN | Create new organization |
| **Divisions** | `GET` | `/divisions` | Public | List divisions (filter by organization) |
| | `GET` | `/divisions/:id` | Public | Get division details |
| | `POST` | `/admin/divisions` | ADMIN | Create new division |
| **Depots** | `GET` | `/depots` | Public | List depots (filter by type, status) |
| | `GET` | `/depots/:id` | Public | Get depot details |
| | `POST` | `/admin/depots` | ADMIN | Create depot (validates circular references) |
| | `PATCH` | `/admin/depots/:id` | ADMIN | Update depot capacity or type |
| **Workshops** | `GET` | `/workshops` | Public | List workshops and pit lanes |
| | `GET` | `/workshops/:id` | Public | Get workshop details |
| | `POST` | `/admin/workshops` | ADMIN | Create workshop |
| **Crew Members** | `GET` | `/crew` | Public | Sanitized roster (PII masked) |
| | `GET` | `/crew/:id` | Public | Sanitized crew detail (PII masked) |
| | `POST` | `/admin/crew` | ADMIN | Register driver/conductor with license |
| | `PATCH` | `/admin/crew/:id/status`| ADMIN | Update duty status and assignments |
| **Device Registry**| `GET` | `/admin/devices` | ADMIN | List registered ETMs and GPS units |
| | `GET` | `/admin/devices/:id` | ADMIN | Get device details |
| | `POST` | `/admin/devices` | ADMIN | Register new device (`UNKNOWN` GPS default) |
| | `POST` | `/admin/devices/:id/assign`| ADMIN | Assign device to bus/crew with history |
| **Maintenance** | `GET` | `/admin/maintenance` | ADMIN | List maintenance work orders |
| | `GET` | `/admin/maintenance/:id` | ADMIN | Get maintenance record details |
| | `POST` | `/admin/maintenance` | ADMIN | Log breakdown / maintenance report |
| | `PATCH` | `/admin/maintenance/:id/status`| ADMIN | Transition repair status |
| **Vehicle Replacement**| `GET`| `/admin/replacements` | ADMIN | List vehicle replacement history |
| | `GET` | `/admin/replacements/:id` | ADMIN | Get replacement record detail |
| | `POST` | `/admin/replacements` | ADMIN | Authorize and execute bus replacement |
| | `PATCH` | `/admin/replacements/:id/status`| ADMIN | Update passenger transfer & status |

---

## 5. Verification & Test Suite Results

### Server Verification
- **Total Test Suites**: 46 passed (46 total)
- **Total Tests**: 381 passed (381 total)
- **New Tests Added in Phase 1**:
  - `server/tests/unit/transportInfrastructure.test.ts` (22 unit tests)
  - `server/tests/integration/transportRoutes.test.ts` (13 integration tests)
- **TypeScript Check**: `npm run server:typecheck` exited with code `0`.
- **Server Build**: `npm run server:build` (`tsc -p tsconfig.json`) exited with code `0`.

### Client Verification
- **Total Test Suites**: 10 passed (10 total)
- **Total Tests**: 84 passed (84 total)
- **TypeScript Check**: `npm run client:typecheck` exited with code `0`.
- **Client Build**: `npm run client:build` (`vite build`) exited with code `0`.

---

## 6. Strict Phase Boundary & Next Steps

Phase 1 is now **100% complete**. 

Per explicit project guidelines:
- **No implementation of Phase 2+ has been started.**
- **No automated git commits or pushes have been performed.**
- System is frozen and ready for user inspection and architectural sign-off before proceeding to subsequent phases.

