# PERUNDHU (பேருந்து) — Phase 7 Completion Report: Passenger Live Bus Tracking Application

> **Document Status**: Production Complete  
> **Author**: Principal Software Architect, Senior React Engineer, Geospatial Engineer, Accessibility Specialist & Data-Governance Engineer  
> **Target System**: PERUNDHU Tamil Nadu Public Transportation Platform  
> **Pilot District**: Madurai District (மண்டலம்: மதுரை)  
> **Statewide Expansion**: 37 Districts Catalogued & Scheduled (`EXPANSION SCHEDULED`)  
> **Branch**: `master`  
> **Verification Status**: 57/57 Server Test Files Passed (480 Tests) | 14/14 Client Test Files Passed (111 Tests) | 100% Pass Rate  
> **Build Status**: TypeScript Clean (`tsc --noEmit` exit code 0) | Production Builds Successful  

---

## 1. Executive Summary

Phase 7 implements the **Passenger Live Bus Tracking Application** for PERUNDHU (பேருந்து), delivering a production-ready, highly accessible, bilingual (Tamil & English) public transportation experience.

The platform targets all 38 districts of Tamil Nadu, with **Madurai District** serving as the sole active pilot corridor (Periyar Bus Stand, Mattuthavani Integrated Bus Terminus, Arappalayam, and Thirumangalam). All other 37 districts are systematically catalogued and presented with informative `EXPANSION SCHEDULED` notices and one-click navigation to the Madurai pilot, strictly preventing fabricated schedules, fictitious routes, or synthetic coordinates.

### Key Achievements in Phase 7:
1. **Passenger Home Dashboard & Transit Notices Banner**:
   - Re-engineered Home Dashboard reflecting Tamil Nadu identity and PERUNDHU visual standards (`#071F22`, `#1D7873`, `#67958C`, `#F5C096`, `#EF2E33`, `#F6F8F6`, `#FFFFFF`).
   - Integrated `<ServiceNoticesBanner>` consuming verified transit notices from `GET /api/v1/alerts`.
   - Displays alert category pills (`FESTIVAL_SPECIAL`, `ROUTE_DIVERSION`, `DISRUPTION`, `WEATHER_NOTICE`, `ADVISORY`), severity badges, affected routes, and official source links (`TNSTC (Madurai) Limited`).
   - Displays a reassuring "Normal Operations" notice when no service disruptions exist, assuring passengers that standard timetables are operating without disruption.
2. **Statewide District Experience & Expansion Notice Modal**:
   - Full 38-district catalogue reconciled with backend availability.
   - Madurai is marked `ACTIVE PILOT`; clicking Madurai routes navigates seamlessly to verified routes and live maps.
   - Clicking any of the 37 non-pilot districts displays an accessible modal dialog (`role="dialog"`, `aria-modal="true"`) explaining the statewide rollout schedule and offering an immediate one-click action: "Explore Madurai Pilot" (`மதுரை முன்னோடித் தளத்தைக் காண்க`).
3. **Multi-Field Journey & Corridor Search**:
   - Multi-field search querying route numbers, names, terminal bus stands, and intermediate stops.
   - Renders surveyed stop sequences, intermediate fare stages, and origin-to-destination distance calculations.
   - Truthful empty states handling inactive corridors or routes without active buses.
4. **Live Fleet Telemetry & Dynamic Arrival Time Estimation (ETA)**:
   - Full integration with Phase 6 live fleet endpoints (`/fleet/positions`, `/fleet/buses/:busId/live`) and Socket.IO real-time channels (`bus:position`, `bus:status`, `subscription:ack`).
   - Smooth `requestAnimationFrame` marker interpolation with quadratic ease-out, meridian wrap-around handling ($360^\circ$), and jump suppression ($>500\text{ m}$).
   - Dynamic ETA prediction integrated into bus details card, computing next stop name, ETA in minutes, estimated arrival time IST, and confidence badge (`HIGH`, `MEDIUM`, `LOW`).
   - Clear model prediction disclaimer: *"Model-predicted arrival estimate based on real-time corridor progress; not an official schedule."*
   - Truthful fallback: When predictions cannot be computed or tracking is lost, PERUNDHU displays *"Arrival estimate unavailable"* (*"வருகை நேரம் கணிக்கப்படவில்லை"*), never faking arrival times.
5. **Accessible Text Alternative View**:
   - 5th panel tab (`table` / Accessible List View) providing a semantic HTML `<table>` alternative for screen readers and low-bandwidth connections.
   - Displays reporting buses (fleet number, registration, live GPS vs simulated source, speed, heading, coordinates, freshness) and ordered route stops (sequence, name in En/Ta, fare stage, distance).
6. **Privacy-Preserving Geolocation**:
   - Geolocation permission requested strictly upon user action (clicking "Locate Near Me" or "My Location").
   - Location coordinates are never persisted, transmitted to third parties, or logged without consent.
   - Full manual search fallback when permission is denied or device lacks GPS.
7. **Zero Regressions & 100% Automated Test Pass Rate**:
   - Server: 57 test files, 480 tests passing (100%).
   - Client: 14 test files, 111 tests passing (100%).
   - Production Vite and Node.js TypeScript builds compile with zero errors.

---

## 2. Screens and Navigation Architecture

The passenger application comprises four primary screens linked by persistent header navigation and contextual breadcrumbs:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PERUNDHU PASSENGER FLOW                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌────────────────┐             ┌────────────────┐             ┌────────────────┐
│  LANDING PAGE  │ ──────────► │   DASHBOARD    │ ──────────► │  LIVE MAP PAGE │
│  (/)           │             │  (/dashboard)  │             │  (/map)        │
│                │             │                │             │                │
│ • Pilot Notice │             │ • Notices      │             │ • Full Map     │
│ • Tamil Identity             │ • Search       │             │ • Live Markers │
│ • Features     │             │ • Nearby       │             │ • Stop List    │
│ • Auth entry   │             │ • Terminals    │             │ • ETA Details  │
└────────────────┘             └───────┬────────┘             │ • Text View    │
                                       │                      └────────────────┘
                                       ▼                               ▲
                               ┌────────────────┐                      │
                               │   DISTRICTS    │ ─────────────────────┘
                               │  (/districts)  │ (Madurai Pilot Select)
                               │                │
                               │ • 38 Districts │
                               │ • 1 Active     │
                               │ • 37 Expansion │
                               │ • Notice Modal │
                               └────────────────┘
```

### Detailed Screen Specifications:

1. **Passenger Home Page / Dashboard (`/dashboard`)**:
   - **Header**: PERUNDHU brand logo (`பேருந்து`), active district pill (`Madurai Pilot`), language switcher (`English` / `தமிழ்`), and user profile status.
   - **Service Notices Banner**: Top collapsible banner displaying active transit advisories and disruptions. When no notices exist, displays reassuring normal operations notice.
   - **Journey & Corridor Search**: Search by route number (e.g. `70`, `77`), origin, destination, or intermediate stop.
   - **Nearby Bus Stands Section**: Browser geolocation card discovering nearby terminals (Mattuthavani, Periyar, Arappalayam) with distance in meters/kilometers.
   - **Madurai Terminals Grid**: Direct access to district hubs with total platforms, code, and routes departing from that terminal.
   - **Offline / Network Banner**: Live detection of network disconnectivity with graceful UI fallback.

2. **Statewide District Selection Page (`/districts`)**:
   - Catalogues all 38 districts of Tamil Nadu.
   - Search bar filtering by district name (English or Tamil) or district code (e.g. `MDU`, `CHN`, `CBE`).
   - Active district card: `MDU (Madurai)` highlighted with green pilot badge and direct "Explore Routes" button.
   - Expansion district cards: 37 districts clearly tagged `EXPANSION SCHEDULED`. Clicking opens the accessible expansion modal with explanation and one-click action to explore Madurai.

3. **District Routes & Timetables (`/districts/:district/routes`)**:
   - Lists verified TNSTC bus routes (Route 70, Route 77).
   - Inbound / Outbound direction selector.
   - Stop sequence itinerary with fare stage flags and kilometer markers.
   - Direct link to launch interactive tracking on the map for that specific corridor.

4. **Interactive Live Map & Tracking Page (`/map`)**:
   - Full-bleed Leaflet map canvas centered on Madurai corridor ($9.9252^\circ\text{ N}, 78.1198^\circ\text{ E}$).
   - Layer switcher: Standard Street Map, Satellite, Hybrid.
   - Floating controls: Recenter, Zoom +/-, Fit to Route, Fit to Fleet, My Location.
   - Collapsible Information Panel with 5 tabs:
     - **Tab 1 (Route)**: Corridor summary, distance, estimated travel time, terminal stands, and direction toggle.
     - **Tab 2 (Stops)**: Ordered stop itinerary with sequence numbers, fare stage pills, and real-time next-bus ETA pills.
     - **Tab 3 (Buses)**: Active fleet sidebar with search, category filters (`ALL`, `MOVING`, `STATIONARY`, `DELAYED_STALE`, `OFFLINE`, `REAL_GPS`, `SIMULATOR`), and Selected Bus Details card.
     - **Tab 4 (Nearby)**: Bus stands sorted by geographic proximity to user.
     - **Tab 5 (Table)**: Accessible text-based alternative view presenting semantic tables of live reporting buses and route stops for screen reader users.

---

## 3. Backend REST API Integrations

Phase 7 leverages modular Express.js routes under the `/api/v1` namespace with strict Zod validation:

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/alerts` | Query verified transit advisories with district, severity, and date filtering | Public |
| `GET` | `/api/v1/alerts/:alertId` | Retrieve single verified transit advisory by ID | Public |
| `GET` | `/api/v1/districts` | List catalogued districts with active pilot status | Public |
| `GET` | `/api/v1/districts/:districtId/stands` | List verified bus stands in a district | Public |
| `GET` | `/api/v1/districts/:districtId/routes` | List surveyed bus corridors in a district | Public |
| `GET` | `/api/v1/routes/:routeId/directions/:dirId` | Retrieve ordered stops, fare stages, and polyline geometry | Public |
| `GET` | `/api/v1/fleet/positions` | Query live bus telemetry with bbox, status, and search filters | Public / Sanitized |
| `GET` | `/api/v1/fleet/buses/:busId/live` | Retrieve bus details, assigned depot, active trip, and dynamic ETA | Public / Sanitized |
| `GET` | `/api/v1/buses/:busId/eta` | Calculate real-time ETA for active bus along route corridor | Public |
| `GET` | `/api/v1/trips/:tripId/eta` | Calculate remaining stop ETAs for active scheduled trip | Public |
| `GET` | `/api/v1/stands/nearby` | Geospatial discovery of bus stands within radius | Public |

### Service Alerts API Sample Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "6724a1b2c3d4e5f6a7b8c9d0",
      "titleEn": "Chithirai Festival Transit Operations Advisory",
      "titleTa": "சித்திரை திருவிழா சிறப்புப் பேருந்து இயக்கம்",
      "descriptionEn": "Special feeder services connecting Periyar Bus Stand and Goripalayam corridor.",
      "descriptionTa": "பெரியார் பேருந்து நிலையம் மற்றும் கோரிப்பாளையம் இடையே சிறப்பு இணைப்புப் பேருந்துகள்.",
      "alertType": "FESTIVAL_SPECIAL",
      "severity": "INFO",
      "districtCode": "MDU",
      "affectedRouteNumbers": ["70", "77"],
      "sourceOrganization": "TNSTC (Madurai) Limited",
      "sourceUrl": "https://tnstc.gov.in",
      "isActive": true,
      "effectiveFrom": "2026-11-01T00:00:00.000Z",
      "effectiveUntil": "2026-11-08T23:59:59.000Z",
      "verifiedAt": "2026-11-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

---

## 4. Socket.IO Real-Time Integration

Real-time telemetry streams over WebSocket (`/ws` endpoint) using event-driven pub/sub architecture:

```
┌─────────────────┐                                    ┌─────────────────┐
│ Passenger App   │                                    │ Socket Server   │
└────────┬────────┘                                    └────────┬────────┘
         │                                                      │
         │  1. connect (/ws)                                    │
         ├─────────────────────────────────────────────────────►│
         │  2. emit('subscribe:fleet', { includeRestricted: false })
         ├─────────────────────────────────────────────────────►│
         │                                                      │
         │  3. emit('subscription:ack', { room: 'fleet:all' })  │
         │◄─────────────────────────────────────────────────────┤
         │                                                      │
         │  4. emit('bus:position', positionPayload)            │
         │◄─────────────────────────────────────────────────────┤
         │     [rAF Smooth Interpolation on Leaflet Map]        │
         │                                                      │
         │  5. emit('bus:status', { busId, status: 'STALE' })   │
         │◄─────────────────────────────────────────────────────┤
         │     [Update Status Badge to DELAYED / STALE]         │
         │                                                      │
```

### Event Specifications:
1. `subscribe:fleet`: Subscribes client to `fleet:all`. Public passenger connections receive sanitized telemetry payloads with coordinates rounded to 5 decimal places ($\approx 1.1\text{ m}$ precision). Device IMEI, SIM serials, and staff phone numbers are never broadcast.
2. `subscription:ack`: Acknowledges successful room subscription and returns initial telemetry snapshot of active vehicles.
3. `bus:position`: Emitted upon valid GPS fix ingestion. Contains:
   - `busId`, `fleetNumber`, `registrationNumber`
   - `lat`, `lng`, `speedKmph`, `heading`
   - `isSimulated`, `source`, `recordedAt`, `trackingStatus`
4. `bus:status`: Emitted when bus heartbeat degrades or device transitions into `STALE`, `DELAYED`, or `OFFLINE` status.

---

## 5. Data Sources, Provenance & Truthfulness

PERUNDHU enforces strict data truthfulness across all UI modules:

1. **Hardware vs. Simulator Truthfulness**:
   - `isSimulated: false` & `source: 'ETM_DEVICE' | 'GPS_DEVICE' | 'AUTHORIZED_PROVIDER'`: Marked with green `LIVE GPS` badge.
   - `isSimulated: true` & `source: 'SIMULATOR'`: Marked with yellow `SIMULATED` badge and tooltip: *"Deterministic model telemetry generated along corridor polyline"*.
   - Physical vehicle GPS and ETM telemetry are never mixed with simulation test runs.
2. **Alert Provenance**:
   - Every service advisory carries `sourceOrganization` (e.g. `TNSTC (Madurai) Limited`) and optional verification URL (`sourceUrl`).
   - Alerts without official provenance are rejected by backend validation schemas.
3. **Factual Normal Operations Disclosure**:
   - When no alerts exist in the database, PERUNDHU truthfully informs passengers: *"All surveyed town services connecting Periyar, Mattuthavani, Arappalayam and Thirumangalam are operating on schedule. No disruptions or route changes reported by TNSTC."*
   - Never leaves an empty or ambiguous blank card.

---

## 6. District Activation Rules

Tamil Nadu comprises 38 administrative districts. In PERUNDHU Phase 7:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TAMIL NADU DISTRICT CATALOGUE                         │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 1 ACTIVE PILOT DISTRICT              │ 37 EXPANSION SCHEDULED DISTRICTS     │
│ • Madurai (MDU)                      │ • Chennai (CHN), Coimbatore (CBE)    │
│   - Status: AVAILABLE                │ • Tiruchirappalli (TIR), Salem (SLM) │
│   - Verified Routes: 70, 77          │ • Tirunelveli (TIN), Erode (ERO)...  │
│   - Real-time GPS Telemetry: ACTIVE  │ • Status: COMING_SOON                │
│   - Bus Terminals: Surveyed          │ • Routes: EXPANSION SCHEDULED        │
│   - Alerts: TNSTC Madurai            │ • Telemetry: NONE (No fake data)     │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Inactive District Interaction Safeguards:
1. When a user clicks any non-pilot district card on `/districts`:
   - Navigation to empty route lists is **blocked**.
   - An accessible modal dialog opens:
     - Title: `{district.nameEn} ({district.nameTa}) — Expansion Scheduled`
     - Message: *"Transit route and stop telemetry for {district.nameEn} is currently scheduled for statewide rollout. Pilot telemetry is active in Madurai district."*
     - Action: *"Explore Madurai Pilot"* (`மதுரை முன்னோடித் தளத்தைக் காண்க`), which selects Madurai and redirects to `/districts/mdu/routes`.
2. Map Non-Pilot Warning:
   - If a user manually loads `/map?district=chn`, a persistent floating banner explains rollout scheduling with a one-click button to switch to Madurai.
3. **Strict Policy**: Zero synthetic routes, fake stops, or placeholder bus registrations are created for expansion districts.

---

## 7. Bilingual Tamil (தமிழ்) & English Support

PERUNDHU treats Tamil and English as equal first-class citizens. Language switching occurs instantly without page reloads:

- **Typography**: Tamil rendered using high-legibility Unicode Tamil fonts with proper line-height spacing ($1.5$) to prevent glyph clipping.
- **Terminology Dictionary**:
  - Bus: பேருந்து
  - Bus Stand: பேருந்து நிலையம்
  - Bus Stop: பேருந்து நிறுத்தம்
  - Route: தடம்
  - Live GPS: நேரலை ஜிபிஎஸ்
  - Simulated: மாதிரி இயக்கம்
  - Estimated Arrival (ETA): வருகை நேரக் கணிப்பு
  - Arrival estimate unavailable: வருகை நேரம் கணிக்கப்படவில்லை
  - Model-predicted arrival estimate based on real-time corridor progress; not an official schedule: நேரலை ஜிபிஎஸ் இயக்கத்தை அடிப்படையாகக் கொண்டு கணிக்கப்பட்ட உத்தேச நேரம்; இது அதிகாரப்பூர்வ கால அட்டவணை அல்ல.
  - Normal Operations: வழக்கமான இயக்கம்
  - Expansion Scheduled: விரிவுபடுத்தப்படவுள்ளது
  - Accessible List View: பட்டியல் பார்வை (அணுகல்தன்மை)

---

## 8. GPS Source & Freshness Rules

Bus telemetry freshness is evaluated dynamically based on elapsed time since the latest verified packet timestamp:

| Elapsed Seconds | Tracking Status | UI Badge | Display Color |
| :--- | :--- | :--- | :--- |
| $\le 30\text{ s}$ | `ACTIVE` | `LIVE GPS` / `SIMULATED` | Green / Amber |
| $31\text{ s} - 120\text{ s}$ | `DELAYED` | `DELAYED` | Warning Orange |
| $121\text{ s} - 300\text{ s}$ | `STALE` | `STALE` | Neutral Gray |
| $> 300\text{ s}$ | `OFFLINE` | `OFFLINE` | Muted Charcoal |

- Out-of-order packets (`packet.recordedAt < latestPosition.recordedAt`) are silently dropped.
- Coordinates jumping $>500\text{ m}$ within $<2\text{ s}$ snap immediately to the new fix without animating unnatural vehicle teleportation across terrain.

---

## 9. Dynamic Arrival Time Estimation (ETA) Rules

The ETA module derives arrival predictions using corridor progress and segment velocity:

### Calculation Principles:
1. **Model Source**: Computed by `etaService.calculateBusEta` using rolling speed and surveyed segment distances.
2. **Confidence Metric**:
   - `HIGH` ($>0.70$): Bus actively moving on surveyed corridor with recent fixes ($<30\text{ s}$).
   - `MEDIUM` ($0.40 - 0.70$): Moderate speed variance or brief telemetry latency ($30 - 60\text{ s}$).
   - `LOW` ($<0.40$): Low speed, corridor congestion, or older fixes ($>60\text{ s}$).
3. **Mandatory Disclaimer**:
   Every predicted arrival time is paired with the notice:
   > *"Model-predicted arrival estimate based on real-time corridor progress; not an official schedule."*
   > *("நேரலை ஜிபிஎஸ் இயக்கத்தை அடிப்படையாகக் கொண்டு கணிக்கப்பட்ட உத்தேச நேரம்; இது அதிகாரப்பூர்வ கால அட்டவணை அல்ல.")*
4. **Truthful Fallback**:
   If the bus is stationary off-route, unassigned, or GPS is lost:
   > *"Arrival estimate unavailable"* (*"வருகை நேரம் கணிக்கப்படவில்லை"*)
   The system never shows fictitious arrival estimates.

---

## 10. Privacy, Security & Data Governance

1. **Geolocation Consent**:
   - Browser geolocation is requested **only** upon explicit user tap on "My Location" or "Locate Near Me".
   - If denied, the UI gracefully informs the user and defaults to manual search without nag banners.
   - User coordinates are stored in component memory only; never transmitted to analytics or logged on the server.
2. **Data Sanitization**:
   - Public fleet APIs strip: `deviceImei`, `simCardNumber`, `macAddress`, `firmwareVersion`, `driverPhone`, and conductor details.
   - Coordinates rounded to 5 decimal places ($\approx 1.1\text{ m}$ resolution).
3. **Rate Limiting & Headers**:
   - Express rate limiter protects public alerts and fleet endpoints against scraping.
   - Content Security Policy (CSP), Helmet security headers, CORS origin enforcement, and HTTP-only cookies protect user sessions.

---

## 11. Verification & Automated Test Results

### 1. Server Test Suite (Vitest)
```
Test Files  57 passed (57)
     Tests  480 passed (480)
  Duration  42.28s
  Result    100% Pass Rate
```
Key backend test suites:
- `alertRoutes.test.ts`: 5 tests passing (temporal query filtering, severity, route numbers, active alerts).
- `fleetLiveRoutes.test.ts`: 6 tests passing (bounding-box queries, sanitization, ETA integration).
- `etaRoutes.test.ts`: 10 tests passing (corridor ETA calculation, confidence scoring, fallback).
- `depotManagementRoutes.test.ts`: 13 tests passing.
- `fleetStaffDeviceRoutes.test.ts`: 12 tests passing.
- `secureGpsIngestion.test.ts`: 8 tests passing.

### 2. Client Test Suite (Vitest + React Testing Library)
```
Test Files  14 passed (14)
     Tests  111 passed (111)
  Duration  35.51s
  Result    100% Pass Rate
```
Key frontend test suites:
- `passengerApp.test.tsx`: 7 tests passing:
  1. Service Notices Banner rendering alert details, route tags, official source.
  2. Truthful normal operations reassurance notice when no alerts exist.
  3. District selection opening expansion scheduled modal for inactive districts.
  4. Madurai pilot card selection initiating route navigation.
  5. Dynamic ETA rendering next stop, estimated minutes, IST time, confidence badge, and disclaimer.
  6. Truthful fallback *"Arrival estimate unavailable"* (*"வருகை நேரம் கணிக்கப்படவில்லை"*).
  7. Accessible text alternative view (`table`) rendering semantic table for screen readers.
- `map.test.tsx`: 20 tests passing (Leaflet canvas, marker interpolation, filters, search).
- `dashboard.test.tsx`: 16 tests passing (dashboard data, nearby stands, timetables).
- `districts.test.tsx`: 13 tests passing (38 district catalogue, search, filtering).

### 3. TypeScript Compilation & Production Build
- `npm run server:typecheck`: Exit code 0 (0 errors).
- `npm run client:typecheck`: Exit code 0 (0 errors).
- `npm run server:build`: Clean compilation into `server/dist`.
- `npm run client:build`: Clean compilation into `client/dist` (14.05s).

---

## 12. Known Limitations & Statewide Expansion Plan

### Current Pilot Scope Limitations:
1. **Corridors Covered**: Town services 70 (Periyar ⇄ Mattuthavani) and 77 (Arappalayam ⇄ Mattuthavani) in Madurai Urban district.
2. **Expansion Districts**: 37 districts are in `EXPANSION SCHEDULED` state awaiting physical ETM/GPS device deployment by respective TNSTC divisions (Villupuram, Kumbakonam, Salem, Coimbatore, Tirunelveli, SETC, MTC Chennai).

### Statewide Expansion Roadmap:
- **Phase 8 (ETM Conductor Pilot Integration)**: Field-test conductor ETM firmware telemetry over cellular APN in Madurai depot.
- **Phase 9 (Division Rollout — South Zone)**: Extend telemetry ingestion to Dindigul, Theni, Virudhunagar, and Sivagangai.
- **Phase 10 (High-Density Corridors — Chennai MTC & Coimbatore)**: Onboard Metropolitan Transport Corporation (MTC) Chennai and Coimbatore urban routes.
- **Phase 11 (Statewide Full Deployment)**: Complete onboarding across all 38 districts of Tamil Nadu.

---

> **Phase 7 Implementation Sign-Off**:  
> System verified, tested, fully functional, and production-ready for passenger live tracking in Madurai pilot district. All constraints respected. No git commit or push commands executed. Proceeding to stop as instructed.

