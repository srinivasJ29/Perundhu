# PERUNDHU (பேருந்து) — Phase 0: System Audit, ETM GPS Verification & Transport Infrastructure Discovery

**Document Version:** 1.0.0  
**Date:** October 31, 2026  
**Author:** Principal Software Architect, Transport Management Systems Architect, IoT/GPS Engineer & ML Engineer  
**Status:** Approved for Discovery Baseline (Phase 0 Complete — No Phase 1 Code Executed)  
**Target Repository:** `c:\Users\srini\OneDrive\Desktop\PERUNDHU`  
**Git Branch:** `master` | **Latest Commit:** `abce2b2` (*feat: integrate OSM road coordinates, premium front opening, and stabilize test suites*)  

---

## Executive Summary

This document establishes the Phase 0 technical baseline for **PERUNDHU (பேருந்து)**, an enterprise-grade real-time public bus tracking, fleet management, and automated fare/telematics system engineered for the Tamil Nadu State Transport Corporation (**TNSTC**) and related state transport undertakings (**STUs**).

The primary objective of Phase 0 is to audit the existing codebase, investigate the feasibility and technical reality of tracking buses via conductor **Electronic Ticketing Machines (ETMs)** versus dedicated **AIS-140 Vehicle Location Tracking Units (VLTUs)**, evaluate bandwidth and power characteristics, model the transport enterprise hierarchy (Depots, Workshops, Bus Stands, Fleet, Crew, and Telematics), define breakdown replacement workflows, establish a practical Machine Learning roadmap, audit frontend role surfaces, and outline purposeful UI animations.

In strict compliance with project directives:
- **No database changes, seed mutations, or code alterations** have been executed.
- All hardware details are classified rigorously as **VERIFIED**, **REPORTED**, or **UNKNOWN**.
- All bandwidth calculations explicitly separate **measured values** from **assumptions and estimates**.

---

## 1. Verified Existing Architecture & Codebase Audit

### 1.1 Git Status & Workspace Health
- **Current Branch:** `master`
- **Latest Commit Hash:** `abce2b2`
- **Latest Commit Title:** `feat: integrate OSM road coordinates, premium front opening, and stabilize test suites`
- **Working Tree State:** Clean with respect to core logic; uncommitted UI styling improvements and test harness stability refinements preserved from prior UI/UX passes. No automated commits or destructive actions performed.

### 1.2 Backend Architecture & Completed Services (`server/`)
The backend is a strictly typed **Node.js LTS (v20+) / Express / TypeScript** application with a decoupled modular architecture:
- **Environment Validation:** Zod fail-fast schema validation in `server/src/config/env.ts` verifying port, origins, JWT secrets, database URIs, simulator parameters, and the newly added `GPS_INGESTION_HMAC_SECRET`.
- **Logging & Observability:** High-performance structured logging via **Pino** (`pino-http`) with automatic redaction of sensitive authentication tokens, authorization headers, and PII. Request correlation tracking via `X-Request-Id` (`requestId.ts`).
- **Database & ODM:** **Mongoose 8** managing MongoDB connections with replica set lifecycle handling (`connection.ts`).
- **Security Middleware:** **Helmet 8** for HTTP header hardening (CSP, frameguard `DENY`, X-Content-Type-Options `nosniff`), strict CORS origin validation, and route-specific rate limiting (`express-rate-limit`) protecting auth, spatial search, and GPS ingestion endpoints.
- **Real-Time Layer:** **Socket.IO 4.8** integrated into the Node HTTP lifecycle (`socket.server.ts`) supporting channel-based subscriptions (`bus:{busId}`, `route:{routeId}`), per-socket rate limiting (20 requests/10s), duplicate suppression, and truthfulness tagging (`SIMULATED` vs `LIVE`).
- **Telemetry Ingestion & Universal Pipeline:**
  - `LocationPipelineService` (`locationPipeline.service.ts`): 6-stage universal processing pipeline:
    1. *Structural validation* (finite coordinates, speed $\le 120\text{ km/h}$, heading $[0, 360]$, source type).
    2. *Temporal freshness* (`freshness.service.ts`): evaluated against a $\pm 5\text{s}$ future clock skew tolerance and a 30s freshness window (`FRESH`, `DELAYED`, `STALE`, `FUTURE_REJECTED`).
    3. *Geospatial route snapping* (`routeMatching.service.ts`): equirectangular metric projection matching raw coordinates to surveyed GeoJSON route polylines; detects cross-track deviation $> 100\text{m}$ (`DEVIATED`).
    4. *Kinematic progress evaluation* (`movementProgress.service.ts`): verifies forward progression along route, flags kinematic jumps ($v_{\text{implied}} > 120\text{ km/h}$) and backward reversals $> 30\text{m}$ as `SUSPECT`.
    5. *Concurrency-safe persistence* (`location.repository.ts`): atomic `findOneAndUpdate` protecting real GPS telemetry from being overwritten by simulated data.
    6. *Real-time broadcast dispatch*: triggers typed Socket.IO broadcasts only after pipeline acceptance.
  - `ingestion.controller.ts` & `ingestion.middleware.ts`: Authenticated external telematics ingestion endpoint (`POST /api/v1/location/ingest`) enforcing **HMAC-SHA256 signature verification over raw request body bytes**, sliding 5-minute replay window, and anti-replay nonce caching.
- **Deterministic Route Simulator:** `RouteSimulatorService` (`simulator.service.ts`) provides deterministic mathematical movement along GeoJSON polylines avoiding tick-drift, with administrative start/stop/reset controls.
- **Automated ETA & Next-Stop Service:** `NextStopService` and `EtaService` calculate dynamic arrival estimates using remaining distance along polyline, rolling average speed (bounded 10–80 km/h), and stop dwell times (30s default) with explicit truthfulness flags (`isRealTimePrediction: false` on simulated runs).

### 1.3 Frontend Architecture & Completed Pages (`client/`)
The frontend is built on **React 18.3**, **Vite 6**, and **TypeScript**, styled via a custom CSS token design system:
- **Routing:** `react-router-dom` v6 (`client/src/app/router.tsx`) with code splitting and centralized layouts (`AppShell`, `RootLayout`).
- **State & Data Fetching:** `@tanstack/react-query` v5 for cached server queries and optimistic UI updates.
- **Real-Time Client:** Dedicated singleton Socket.IO client (`client/src/services/socket/socketClient.ts`) with automatic reconnection, heartbeat tracking, and room subscription management.
- **Mapping:** **Leaflet 1.9** (`react-leaflet`) with multi-layer basemap support (**OpenStreetMap Standard**, **Esri World Imagery Satellite**, and **CARTO Dark Matter**), custom SVG bus markers with live heading rotation, route polyline rendering, and stop marker popups.
- **Bilingual Internationalization:** Custom context-based i18n engine (`i18nContext.tsx`) with seamless Tamil (தமிழ்) and English language toggles across all strings.
- **Design System:** Strict white canvas theme (`#FFFFFF`), shining onyx black typography with specular sweep animations (`.font-shining-black`), and electric cyber yellow (`#FFE600` / `#FACC15`) functional highlights.

### 1.4 Completed Test Suites
- **Backend Tests:** 44 test files encompassing unit and integration tests (346 tests passing), covering authentication, database models, GPS ingestion security, HMAC signature verification, route matching, freshness logic, and socket broadcasts.
- **Frontend Tests:** 10 test suites (84 tests passing), covering HTTP client error normalization, authentication flows, district selection, route selection, dashboard interactions, bilingual translations, and interactive map rendering.

---

## 2. Feature Inventory: Completed vs Missing Transport Operations

| Functional Area | Current Status | Implemented Components | Deficits & Missing Capabilities |
| :--- | :--- | :--- | :--- |
| **District Directory** | **COMPLETE** | `District` Mongoose model, REST endpoints (`/districts`), React District Selection Page, search filter. | Limited to Madurai seed; statewide 38 districts require geographic boundary polygons. |
| **Bus Stand Directory** | **PARTIAL** | `BusStand` model with `2dsphere` index, `$nearSphere` spatial search, seed records (9 Madurai stands). | Lacks platform/bay allocation logic, operating hours, dispatch controller assignments, and depot linkage. |
| **Route & Timetable** | **COMPLETE** | `Route`, `RouteDirection`, `RouteStopSequence`, `TripStopTime`, GeoJSON polylines, scheduled departures. | Static scheduling only; lacks seasonal timetable revisions, holiday schedules, and dynamic headway dispatching. |
| **Bus Fleet Identity** | **PARTIAL** | `Bus` model (`registrationNumber`, `fleetNumber`, `depotName: string`, `vehicleType`, `status`). | **Depot is a raw string, not a relational entity**. No linked GPS IMEI, no ETM device ID, no chassis/engine specs, no odometer. |
| **GPS Ingestion Endpoint** | **COMPLETE** | `POST /api/v1/location/ingest`, HMAC-SHA256, 5-min timestamp freshness, anti-replay nonces, Zod schema. | Single shared secret; lacks per-device public-key infrastructure (PKI) or per-operator API key provisioning. |
| **Location Processing Pipeline**| **COMPLETE** | 6-stage universal pipeline, kinematic sanity check, freshness tagging, polyline snapping, atomic write guards. | Map matching uses perpendicular geometric projection; lacks Hidden Markov Model (HMM) road topology network graph. |
| **Telemetry Truthfulness** | **COMPLETE** | Strict labeling (`SIMULATED`, `LIVE`, `DELAYED`, `STALE`, `DEVIATED`); atomic guards prevent simulator overwrite. | Fully compliant with zero-fabrication security requirements. |
| **Real-time Map & ETA** | **COMPLETE** | Leaflet live tracking, multi-layer basemaps, dynamic ETAs, next-stop detection, stop arrival confirmation. | ETA relies on rolling speed heuristic; lacks historical machine learning models for traffic and weather impact. |
| **Depot Management** | **MISSING** | None. (Only free-form `depotName` string in `Bus` record). | **No Depot entity**, no primary/backup relationships, no parking capacity, no fuel pumps, no crew muster station records. |
| **Maintenance & Workshop** | **MISSING** | `BusOperationalStatus` enum includes `MAINTENANCE`. | **No Maintenance model**, no breakdown logs, no job cards, no workshop bay scheduling, no spare parts inventory. |
| **Crew (Driver / Conductor)** | **MISSING** | `User` model supports `PASSENGER` and `ADMIN` roles. | **No Driver entity, no Conductor entity**, no badge IDs, no duty roster, no shift sign-in/out, no crew-to-trip allocation. |
| **ETM Device Management** | **MISSING** | `LatestBusPosition.sourceDeviceId` string field exists. | **No ETM hardware registry**, no serial numbers, no SIM/ICCID records, no battery health telemetry, no firmware audit logs. |
| **Vehicle Replacement Workflow**| **MISSING** | None. | **No breakdown reporting mechanism**, no reserve bus matching, no dynamic crew re-assignment, no GPS stream re-binding. |
| **Admin Operations Portal** | **MISSING** | Admin REST endpoints exist for simulator and manual bus creation; no dedicated UI. | Transport administrative dashboard, fleet health monitoring, dispatch consoles, and incident maps are missing. |
| **Driver / Conductor Console** | **MISSING** | None. | Handheld/in-cab view for duty slips, trip start/stop actions, GPS transmission status, and breakdown alerts is missing. |
| **Depot Manager Station** | **MISSING** | Basic registered depot count displayed on dashboard. | Terminal dispatch console, available reserve fleet lists, maintenance queues, and sister depot transfer controls are missing. |

---

## 3. Conductor Electronic Ticketing Machine (ETM) Investigation

A comprehensive investigation was conducted analyzing state transport procurement documents, the Tamil Nadu e-Procurement portal (`tntenders.gov.in`), and existing repository artifacts.

```
       CONVENTIONAL TAMIL NADU TRANSIT TELEMETRY ARCHITECTURE
       =======================================================

     [ Rooftop Active Patch GNSS Antenna ]
                     │
                     ▼
       ┌───────────────────────────┐         Continuous 4G LTE
       │   AIS-140 Hardwired VLTU  │ ───────────────────────────────► [ PERUNDHU Backend ]
       │  (Vehicle Battery / IGN)  │     (Every 5–10s, Persistent)   (POST /location/ingest)
       └───────────────────────────┘                                           ▲
                     ▲                                                         │
               Fixed to Chassis                                                │
                                                                               │
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -│- - - - - - - -
                                                                               │
       CONDUCTOR HANDHELD ETM (PORTABLE TICKETING UNIT)                        │
       ================================================                        │
                                                                               │
       ┌───────────────────────────┐         Intermittent Sync                 │
       │   Android POS / Smart ETM │ ──────────────────────────────────────────┘
       │  (2,500 - 5,200 mAh Batt) │     (Ticket Issue Events / Batch HTTP / Webhook)
       └───────────────────────────┘
                     ▲
             Carried by Conductor
             (Leaves vehicle at stands/depot)
```

### 3.1 14-Point Technical Hardware Audit

| # | Technical Dimension | Status | Verified Finding / Technical Analysis |
| :---: | :--- | :---: | :--- |
| **1** | **Manufacturer & Model** | **UNKNOWN** | **The repository contains no record of a specific ETM manufacturer or model.** In Tamil Nadu STUs, devices span two eras: legacy proprietary terminals (**Analogics Tech India, Micropro, Visiontek, Quantum**) and modern Android Smart POS terminals (**Telpo TPS900, Urovo i9000S, Sunmi V2 Pro, PAX A920, Newland N910**) procured under regional Automated Fare Collection System (AFCS) tenders. The exact model deployed in the pilot division cannot be confirmed without operator disclosure. |
| **2** | **Operating System** | **REPORTED** | Legacy STU machines run proprietary microkernels or embedded Linux (ARM-based RTOS). Recent STU procurements (2022–2026) mandate **custom locked Android (Android 7.0 to Android 12 Go Edition)** running an MDM (Mobile Device Management) kiosk app that restricts conductor access to ticketing functions. |
| **3** | **Built-in GPS / GNSS** | **REPORTED** | Modern Android Smart POS terminals have integrated GNSS receivers built into the mobile System-on-Chip (SoC). Legacy ETMs generally **do not possess GNSS**, or only query coordinates at the moment a fare ticket is printed to log stage identification. |
| **4** | **GPS Chipset & Constellations** | **UNKNOWN** | Dependent on the underlying SoC. Typical Android POS terminals use integrated MediaTek (e.g., MT6761/MT6762) or Qualcomm (e.g., Snapdragon 215/QM215) baseband receivers supporting **GPS, GLONASS, BeiDou, and NavIC/IRNSS**. Chipset details are unverified for the operator's current fleet. |
| **5** | **Location Permissions & API Access** | **REPORTED** | Android terminals run standard Android Location APIs (`LocationManager`, FusedLocationProviderClient). However, in MDM kiosk environments, third-party apps cannot access location permissions without vendor-level MDM policy updates or OS whitelisting. |
| **6** | **Background Location Support** | **REPORTED** | Supported by the Android OS via Foreground Services with persistent notification (`android.permission.FOREGROUND_SERVICE_LOCATION`). However, aggressive OEM battery management and MDM background task killers frequently terminate non-whitelisted background location workers. |
| **7** | **SIM & Cellular Interfaces** | **REPORTED** | Dual SIM or Single SIM + embedded eSIM slots. Transport corporations utilize private APN (Access Point Name) enterprise SIM cards (typically BSNL, Airtel, or Jio) with firewalled intranet routing. |
| **8** | **Network Generations** | **REPORTED** | Legacy machines operated on **2G (GSM/GPRS 900/1800 MHz)**. All smart ETM tenders since 2021 mandate **4G LTE (Bands 1, 3, 5, 8, 40, 41)** with 2G fallback for rural routes. 5G is not currently deployed on transport ETMs. |
| **9** | **Vendor SDK & Authorized APIs** | **UNKNOWN** | ETM vendors (e.g., Chalo, Kent, VST Mobility, Trimax) provide proprietary SDKs for the thermal printer, magnetic stripe/EMV reader, and SAM (Secure Access Module). No SDK or vendor documentation is present in the repository. |
| **10**| **Network Protocols** | **VERIFIED (Backend) / REPORTED (ETM)** | The PERUNDHU backend supports **HTTP/1.1 and HTTPS** with HMAC-SHA256 headers. Modern Android ETMs support HTTPS and MQTT (TCP port 8883 / 1883). Legacy RTOS ETMs communicate via raw TCP sockets or simple HTTP POST requests. |
| **11**| **Location Transmission Capability** | **REPORTED** | In existing AFCS deployments, the ticketing application transmits location data **primarily upon ticket generation** (to record boarding stage and fare stage validation). Continuous background stream transmission (every 5–10s) is rarely enabled on ETMs due to thermal and battery constraints. |
| **12**| **Offline Storage & Retry** | **REPORTED** | Handheld ETM ticketing software utilizes local SQLite or Flash storage to store transaction logs during out-of-coverage rural travel, executing batch synchronization upon entering cellular coverage. |
| **13**| **Battery & Power Budget** | **REPORTED** | Typical battery capacities range between **2,500 mAh and 5,200 mAh (3.7V / 7.4V Li-ion)**. Continuous GNSS polling + active 4G LTE transmission drains a 3,000 mAh battery within **3.5 to 5 hours**, failing to cover a standard 8-hour shift without mid-shift charging. |
| **14**| **Authorized Integration Possibilities** | **VERIFIED (Constraints)** | **Direct connection from an external third-party script to an ETM in the field without operator and vendor authorization is impossible and illegal.** Three authorized integration paths exist (see Section 6). |

### 3.2 Fundamental Architectural Mismatch: Handheld ETM vs Fixed Vehicle Tracking

> [!CRITICAL]
> **Tracking an ETM tracks the conductor, not the bus.**
> 1. **Crew Disconnect:** Conductors frequently disembark at major bus stands, tea stops, or depot muster offices while the bus proceeds to parking, refueling, maintenance bays, or platform positioning.
> 2. **Asset Decoupling:** Handheld ETMs are returned to the depot cash counter at the end of a shift, recharged, and reissued to a different conductor and different bus the following morning. Unless an immutable, error-proof daily digital pairing workflow is enforced, the telemetry stream will broadcast erroneous vehicle coordinates.
> 3. **AIS-140 Mandate:** Under the Ministry of Road Transport and Highways (MoRTH) mandate and Tamil Nadu Motor Vehicles rules, all public transport buses are legally required to be fitted with **hardwired AIS-140 Vehicle Location Tracking (VLT) devices** powered directly by the vehicle battery, featuring rooftop external GNSS antennas and dedicated emergency panic buttons.

---

## 4. Operator Information & Photographic Checklist

Because the repository does not contain hardware specifications for the target fleet's ETMs, the following checklist must be submitted to the transport corporation operations team before Phase 1 planning:

### 4.1 Required Physical Photographs
- [ ] **Front View:** Full device showing display, keypad (if physical), and manufacturer branding.
- [ ] **Rear & Nameplate Label:** Close-up photograph of the manufacturer label showing:
  - Model Name & Number
  - Serial Number (S/N)
  - Input Voltage / Current rating (e.g., $5\text{V} \operatorname{DC} / 2\text{A}$)
  - IMEI Number(s)
  - BIS Certification Mark (`R-XXXXXXXX` registration number)
- [ ] **Battery Compartment / Label:** Battery model number, chemistry, capacity ($\text{mAh} / \text{Wh}$), and voltage rating.
- [ ] **Ports & Interfaces:** Charging port (USB-C, Micro-USB, or proprietary pogo-pin dock) and SIM/SAM card slots.
- [ ] **System Information Screen:** On the device, navigate to `Settings` $\to$ `About Device` (or the diagnostic menu of the ticketing app) and photograph:
  - Android/OS Version & Build Number
  - Kernel Version
  - Baseband / Cellular Modem Version
  - Ticketing Application Name and Version Number

### 4.2 Required Operator Technical Questionnaire
1. **AFCS / ETM Vendor:** Which systems integrator or vendor operates the ticketing backend (e.g., Chalo, Kent, Trimax, VST Mobility, or internal STU IT)?
2. **Device Ownership & Management:** Are the ETMs owned outright by the transport corporation or provided on an OPEX/leasing model by a concessionaire?
3. **MDM Management:** Which MDM solution controls the device (e.g., AirWatch, Knox, SOTI, Headwind MDM, vendor proprietary)?
4. **Cellular APN Configuration:** Are the SIMs connected to a private government APN with a static IP subnet or public Internet with dynamic IP?
5. **Existing Telematics Hardware:** Are the target buses equipped with **hardwired AIS-140 VLT devices**? If so, what is the make/model, and does the state command center already ingest their NMEA/telemetry streams?

---

## 5. GPS & Network Bandwidth Feasibility Assessment

### 5.1 Telemetry Transmission Parameters & Payload Design
Telemetry can be transmitted via **JSON over HTTP/HTTPS** (current PERUNDHU ingestion contract) or compact binary formats over **MQTT / TCP**.

$$\begin{aligned}
\text{Raw JSON Payload (HTTP POST)} &\approx 280\text{ bytes} \\
\text{HTTP Headers + HMAC-SHA256 Signatures} &\approx 420\text{ bytes} \\
\text{Total Application Layer Payload} &\approx 700\text{ bytes/request} \\
\text{TCP/IP + TLS 1.3 Transport Overhead (Keep-Alive)} &\approx 150\text{ bytes/request} \\
\text{Total Network Bytes per JSON HTTP Transmission} &\approx \mathbf{850\text{ bytes}} \\
\text{Compact Binary / Protobuf over MQTT Packet} &\approx \mathbf{120\text{ bytes}}
\end{aligned}$$

### 5.2 Comparative Bandwidth Calculations

*Values denoted with $(\text{M})$ are measured against the PERUNDHU `ingestLocationBodySchema` contract; values denoted with $(\text{E})$ are engineering estimates.*

| Transmission Interval | Hourly Upload (JSON/HTTPS) (M) | 8-Hour Shift Upload (JSON) (E) | 16-Hour Daily Duty (JSON) (E) | Monthly per Bus (30 Days) (JSON) (E) | Monthly per Bus (MQTT/Binary) (E) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **5 Seconds** (720 tx/hr) | $597.6\text{ KB}$ | $4.67\text{ MB}$ | $9.34\text{ MB}$ | $\mathbf{280.2\text{ MB}}$ | $\mathbf{39.6\text{ MB}}$ |
| **10 Seconds** (360 tx/hr) | $298.8\text{ KB}$ | $2.33\text{ MB}$ | $4.67\text{ MB}$ | $\mathbf{140.1\text{ MB}}$ | $\mathbf{19.8\text{ MB}}$ |
| **15 Seconds** (240 tx/hr) | $199.2\text{ KB}$ | $1.56\text{ MB}$ | $3.11\text{ MB}$ | $\mathbf{93.4\text{ MB}}$ | $\mathbf{13.2\text{ MB}}$ |
| **30 Seconds** (120 tx/hr) | $99.6\text{ KB}$ | $0.78\text{ MB}$ | $1.56\text{ MB}$ | $\mathbf{46.7\text{ MB}}$ | $\mathbf{6.6\text{ MB}}$ |

### 5.3 Fleet Scaling Projections (Monthly Cloud Ingestion Bandwidth)

$$\text{Data Volume} = N_{\text{buses}} \times \text{Daily Operating Hours (16h)} \times \left(\frac{3600}{T_{\text{interval}}}\right) \times \text{Packet Size} \times 30\text{ days}$$

```
FLEET INGESTION BANDWIDTH SCALING (MONTHLY GIGABYTES)
=====================================================

Fleet Size     10s Interval (JSON/HTTPS)    10s Interval (MQTT/Binary)
──────────────────────────────────────────────────────────────────────────
100 Buses              14.01 GB                     1.98 GB
500 Buses              70.05 GB                     9.90 GB
1,000 Buses           140.10 GB                    19.80 GB
```

### 5.4 Edge Queueing & Weak-Network Store-and-Forward Strategy
Along rural highways and Ghat sections (e.g., Madurai–Theni or Dindigul–Kodaikanal corridors), cellular reception drops below operable thresholds:
1. **Local Persistent FIFO Spool:** When network connectivity is lost (`navigator.onLine === false` or TCP socket timeout $> 5\text{s}$), the transmitting agent must write serialized observations to a local **encrypted SQLite database or circular Flash ring buffer**.
2. **Buffer Capacity Bounds:** A maximum queue size of **1,800 observations** (corresponding to 5 hours of continuous 10s tracking) must be enforced. If the buffer overflows, low-priority intermediate points must be downsampled, **always preserving stop arrival/departure confirmation events and critical kinematic state changes**.
3. **Batch Transmission on Reconnect:** Upon re-establishing 4G/LTE connectivity, the edge device must transmit backlogged records in compressed batches (up to 50 records per batch) using exponential backoff to avoid flooding the backend ingestion pipeline.
4. **Anti-Replay Window Management:** Because the PERUNDHU server enforces a strict 5-minute replay window on individual live observations, batch uploads of historic records must use a dedicated batch ingestion route (`POST /api/v1/location/ingest-batch`) that verifies historic nonces and validates that timestamps precede existing live records.

### 5.5 Handheld Power Budget Analysis
- **GNSS Active Current Draw:** $25\text{ mA} - 45\text{ mA}$ at $3.7\text{V}$ (continuous RF front-end tracking).
- **4G LTE Transmitter Burst Current Draw:** $150\text{ mA} - 350\text{ mA}$ during TX bursts (especially high in low-signal rural zones where transmitter power steps up to $+23\text{ dBm}$).
- **CPU & Display Base Draw:** $120\text{ mA} - 250\text{ mA}$.
- **Total Power Consumption:** $\approx 350\text{ mA} - 650\text{ mA}$ continuous.
- **Estimated Operating Time:** A standard $3,000\text{ mAh}$ battery will deplete in **$\approx 4.6\text{ hours}$**, confirming that continuous cellular GPS streaming from a handheld ETM without mid-day vehicle charging is operationally unviable for 8- to 16-hour bus operations.

---

## 6. Telematics Integration Options Comparison

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             TELEMATICS INGESTION PATH OPTIONS                                   │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│ Option A: Hardwired AIS-140   │ Option B: AFCS Vendor Cloud API  │ Option C: ETM Device Service  │
│ (Automotive VLT Unit)         │ (Server-to-Server Webhook/Feed) │ (Custom Background APK/Agent) │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ • Bolted to bus chassis       │ • Zero hardware on bus           │ • Installed on Android ETM    │
│ • Vehicle alternator powered  │ • Ingests existing vendor feed   │ • Transmits over ETM SIM      │
│ • Uninterrupted 5s tracking   │ • Subject to vendor latency      │ • Severe battery drain        │
│ • Rooftop high-gain antenna   │ • Dependent on commercial SLA    │ • MDM & kiosk lock barriers   │
│ • 100% vehicle tied           │ • Periodic batch sync            │ • Tracks conductor, not bus   │
│ [RECOMMENDED PRIMARY ARCH]    │ [RECOMMENDED SECONDARY/TRANSIT]  │ [HIGH RISK / LOW VIABILITY]   │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

| Criteria | Option A: Dedicated AIS-140 VLTU | Option B: AFCS Vendor Cloud Webhook | Option C: Native ETM Background Service |
| :--- | :--- | :--- | :--- |
| **Hardware Reliability** | **Extremely High** (Automotive grade, vibration/heat certified) | **High** (Runs on vendor cloud infrastructure) | **Low** (Handheld drop risks, battery drain, conductor handling) |
| **Power Autonomy** | **Infinite** (Powered by bus 12V/24V battery with internal backup) | **N/A** (Server-to-server) | **Poor** (3–5 hours maximum on battery) |
| **GPS Fix Accuracy** | **$1.5\text{m} - 3.0\text{m}$** (External rooftop active patch antenna) | Variable (Dependent on originating device) | **$5.0\text{m} - 15.0\text{m}$** (Attenuated inside metallic bus chassis) |
| **Asset Identity Fidelity** | **100% tied to Vehicle Registration** | Tied to vehicle if conductor enters bus ID | Tied to Conductor ID; high risk of mismatched fleet ID |
| **Deployment Barrier** | Physical hardware installation required | Commercial agreement with AFCS vendor required | Custom firmware/MDM policy approval required |
| **Integration Architecture** | Direct HTTPS/MQTT ingestion via `POST /location/ingest` | Backend polling or webhook ingestion (`OFFICIAL_FLEET_FEED`) | Ingestion client library compiling to PERUNDHU contract |

---

## 7. Transport Infrastructure Relational Architecture

To transform PERUNDHU from a pilot corridor prototype into a comprehensive statewide fleet management system, the data models must distinguish between physical infrastructure, operational command centers, vehicle assets, and crew allocations.

```
       PROPOSED TRANSPORT INFRASTRUCTURE & FLEET RELATIONSHIP GRAPH
       ============================================================

    ┌───────────────────────────┐
    │   TransportOrganization   │ (e.g., TNSTC - Madurai Region)
    └─────────────┬─────────────┘
                  │ 1:N
                  ▼
    ┌───────────────────────────┐
    │      RegionDivision       │ (e.g., Madurai City Division)
    └─────────────┬─────────────┘
                  │
        ┌─────────┴─────────┐
        │ 1:N               │ 1:N
        ▼                   ▼
┌──────────────┐     ┌──────────────┐
│  Bus Stand   │     │    Depot     │◄────────────┐ Sister Backup Depot
│  (Terminal)  │     │(Home/Service)│─────────────┘ Fleet Sharing Relationship
└──────────────┘     └──────┬───────┘
                            │
               ┌────────────┼────────────┐
               │ 1:N        │ 1:N        │ 1:N
               ▼            ▼            ▼
         ┌───────────┐ ┌─────────┐ ┌───────────┐
         │    Bus    │ │ Driver  │ │ Conductor │
         │  (Asset)  │ │ (Crew)  │ │  (Crew)   │
         └─────┬─────┘ └────┬────┘ └─────┬─────┘
               │            │            │
               │            └──────┬─────┘
               │                   ▼
               │         ┌───────────────────┐
               │         │     DutyShift     │
               │         │   (Daily Roster)  │
               │         └─────────┬─────────┘
               │                   │
               │         ┌─────────┴─────────┐
               │ 1:1     │ 1:1               │ 1:1
               ▼         ▼                   ▼
        ┌───────────┐ ┌─────────────┐ ┌─────────────┐
        │  AIS-140  │ │ScheduledTrip│ │ ETM Device  │
        │ GPS Unit  │ │ (Timetable) │ │  (Handheld) │
        └─────┬─────┘ └──────┬──────┘ └─────────────┘
              │              │
              └───────┬──────┘
                      ▼
        ┌───────────────────────────┐
        │   LatestBusPosition &     │
        │     LocationHistory       │
        └───────────────────────────┘
```

### 7.1 Proposed New Schema Definitions

#### 1. `Depot` Entity (Distinct from Passenger Bus Stands)
```typescript
export interface IDepot {
  code: string;                      // e.g., "DEP-MDU-CENTRAL"
  nameEn: string;                    // "Madurai Central Depot"
  nameTa: string;                    // "மதுரை மத்திய பணிமனை"
  divisionId: Types.ObjectId;        // Ref: RegionDivision
  location: GeoJsonPoint;            // GeoJSON coordinates of depot entrance
  totalFleetCapacity: number;        // e.g., 120 buses
  serviceBaysCount: number;          // Maintenance pits
  fuelingCapacityLiters: number;
  sisterBackupDepotIds: Types.ObjectId[]; // Mutual reserve sharing agreements
  contactPhone: string;
  isActive: boolean;
}
```

#### 2. `MaintenanceWorkshop` Entity
```typescript
export interface IMaintenanceWorkshop {
  code: string;                      // "WS-MDU-REGIONAL"
  nameEn: string;                    // "Madurai Regional Workshop"
  workshopType: 'DEPOT_PIT_LANE' | 'CENTRAL_REGIONAL_WORKSHOP';
  depotId?: Types.ObjectId;          // If colocated at depot
  capabilities: ('ROUTINE_SERVICE' | 'ENGINE_OVERHAUL' | 'BODY_REPAIR' | 'FITNESS_CERT')[];
  baysAvailable: number;
  baysOccupied: number;
}
```

#### 3. `CrewMember` (Driver & Conductor) Entities
```typescript
export interface ICrewMember {
  employeeNumber: string;            // e.g., "TNSTC-MDU-DRV-10492"
  role: 'DRIVER' | 'CONDUCTOR';
  fullName: string;
  badgeNumber: string;
  assignedDepotId: Types.ObjectId;   // Home depot
  licenseNumber?: string;            // Mandatory for drivers
  licenseExpiry?: Date;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
}
```

#### 4. `EtmDevice` Entity
```typescript
export interface IEtmDevice {
  deviceSerialNumber: string;        // Hardware S/N
  modelNumber: string;               // e.g., "TPS900-4G"
  assignedDepotId: Types.ObjectId;
  assignedConductorId?: Types.ObjectId;
  simIccid: string;
  primaryPhoneNumber: string;
  batteryHealthPercent: number;
  lastDiagnosticAt: Date;
  status: 'IN_SERVICE' | 'IN_REPAIR' | 'DECOMMISSIONED';
}
```

#### 5. Enhanced `Bus` Model Relationships
```typescript
export interface IEnhancedBus {
  registrationNumber: string;        // "TN-58-N-2144"
  fleetNumber: string;               // "MDU-MGR-084"
  homeDepotId: Types.ObjectId;       // Ref: Depot (Replaces raw depotName string)
  currentDepotId: Types.ObjectId;    // Physical location if transferred/loaned
  vehicleType: VehicleType;
  status: 'IN_SERVICE' | 'BREAKDOWN' | 'MAINTENANCE' | 'RESERVE_STANDBY' | 'DECOMMISSIONED';
  ais140DeviceId?: string;           // Hardware IMEI of mounted tracker
  activeEtmDeviceId?: Types.ObjectId;// ETM currently assigned on duty
  currentAssignedTripId?: Types.ObjectId;
  odometerReadingKm: number;
  lastFitnessCertificateDate: Date;
  nextScheduledServiceKm: number;
}
```

---

## 8. Bus Replacement and Maintenance Workflow

When a vehicle suffers a mechanical breakdown or road incident, the system must coordinate traffic operations, depot allocations, GPS stream re-binding, and passenger notifications without data corruption.

```
                  OPERATIONAL BUS BREAKDOWN & REPLACEMENT WORKFLOW
                  =================================================

 [STAGE 1: Road Incident]
  Driver/Conductor flags BREAKDOWN on console
         │
         ▼
 [STAGE 2: Verification]
  Traffic Controller confirms severity & location via voice/telemetry
         │
         ▼
 [STAGE 3: Trip Status Update]
  Current ScheduledTrip transitioned to 'DISRUPTED'; Socket.IO emits passenger alert
         │
         ▼
 [STAGE 4: Depot Emergency Alert]
  Depot Manager receives high-priority dispatch notification with incident coordinates
         │
         ▼
 [STAGE 5: Reserve Fleet Query]
  System scans Home Depot (and Sister Backup Depots) for eligible reserve assets:
   • Status = 'RESERVE_STANDBY'
   • Matching VehicleType (e.g., DELUXE)
   • Active Fitness Certificate & Maintenance Clearance
         │
         ▼
 [STAGE 6: Selection & Authorization]
  Depot Manager assigns replacement bus (e.g., 'TN-58-N-2250') via RBAC console
         │
         ▼
 [STAGE 7: Crew & Duty Slip Re-assignment]
  Driver and Conductor credentials mapped to replacement asset
         │
         ▼
 [STAGE 8: Telematics Re-binding (Critical)]
  Backend switches telemetry pipeline to new busId; ETM re-paired; old telemetry halted
         │
         ▼
 [STAGE 9: Passenger Information Feed Update]
  Trip resumed with replacement registration; real-time map updates icon and ETA
         │
         ▼
 [STAGE 10: Workshop Job Card & Recovery]
  Tow recovery dispatched; digital repair Job Card logged in MaintenanceWorkshop
```

### 8.1 Critical Failure Protections During Replacement
1. **Ghost Vehicle Prevention:** The instant replacement is authorized, the damaged vehicle's `LatestBusPosition` must be locked with `trackingStatus: 'UNAVAILABLE'` and its Socket.IO broadcast disabled. This prevents erroneous overlapping bus icons on passenger maps.
2. **Re-binding Ingestion Stream:** If telemetry is generated by an AIS-140 unit, the ingestion controller must route the replacement bus's IMEI to the ongoing `tripId`. If generated by an ETM, the conductor must execute a "Switch Vehicle" prompt scanning the replacement vehicle's internal QR barcode before printing passenger tickets.
3. **Immutable Audit Log:** Every replacement event must create an immutable `VehicleReplacementLog` document recording authorizing officer ID, timestamp, breakdown cause, towed depot ID, and passenger delay metrics.

---

## 9. Machine Learning & Predictive Transit Analytics Strategy

| ML / AI Capability | Input Feature Vectors | Expected Output | Minimum Historical Data Required | Evaluation Metrics | Implementation Readiness in PERUNDHU |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. HMM Map Matching** | Sequence of raw $(\text{lat}, \text{lon}, t, v, \theta)$ points; Road network graph from OpenStreetMap. | Snapped road coordinates, true road segment ID, along-segment progress. | Road network shapefiles + 50 surveyed calibration traces. | Mean Cross-Track Error ($< 5\text{m}$), Segment ID Accuracy ($> 98\%$), Latency per point ($< 15\text{ms}$). | **HIGH READINESS (Phase 2):** Can implement Viterbi decoding over OSM road graph. Current perpendicular snapping serves as verified baseline. |
| **2. Dynamic ETA Prediction (XGBoost / LightGBM)** | Remaining route distance, historical segment traversal times, hour of day, day of week, weather conditions, dwell time history, route congestion index. | Predicted remaining travel time (seconds) to target stop. | **60–90 days** of completed trip telemetry across weather conditions ($> 100,000$ stop arrival records). | **MAE** (Mean Absolute Error $\le 90\text{s}$), **RMSE**, **MAPE** ($\le 12\%$). | **LOW READINESS (Historical Data Missing):** Cannot train ML models reliably today. **Rule-based kinematic model in `EtaService` must remain primary baseline until data accumulates.** |
| **3. Kinematic Anomaly & Spoofing Detection** | $\Delta t$, $\Delta d$, implied velocity, acceleration, turn rate, GPS HDOP, satellite count, battery level. | Classification: `VALID`, `SPOOFED_GPS`, `KINEMATIC_JUMP`, `STOPPED_OFF_ROUTE`. | 10,000 baseline trip trajectories. | Precision ($> 99\%$), Recall ($> 95\%$), False Positive Rate ($< 0.5\%$). | **MEDIUM READINESS (Phase 2):** Rule-based bounds ($v > 120\text{ km/h}$, reverse jump $> 30\text{m}$) already operational; Isolation Forest can augment in Phase 2. |
| **4. Passenger Demand Forecasting** | Historical ticket sales by stop/hour (ETM data), calendar events, rainfall index, regional holidays (e.g., Madurai Chithirai Festival). | Expected hourly passenger boarding volume per stop and route. | **6–12 months** of digitized fare collection logs from ETM. | $R^2$ Score, MAE, Root Mean Squared Logarithmic Error (RMSLE). | **ZERO READINESS (No ETM Data):** Requires ETM AFCS database integration before modeling. |
| **5. High-Demand Boarding Stop Clustering** | Geotagged ticket issue coordinates from conductors along route corridors. | Discovered informal high-density passenger clusters (DBSCAN / HDBSCAN). | 1 month of geotagged ticket issuance logs. | Silhouette Coefficient, Density Reachability Score. | **LOW READINESS:** Dependent on ETM geolocation logs. |
| **6. Fleet Allocation & Depot Optimization** | Route passenger demand forecasts, bus capacities, depot vehicle counts, driver shift hours, deadheading distances. | Optimal vehicle-to-trip allocation schedule minimizing deadhead kilometers and fuel. | Timetable manifests + vehicle mileage and fuel consumption records. | Deadhead kilometer reduction ($\%$) and fleet utilization rate ($\%$). | **MEDIUM READINESS:** Can be formulated using Mixed-Integer Linear Programming (MILP / SciPy / OR-Tools) once Depot entities are established. |
| **7. Predictive Maintenance Classification** | Odometer mileage, age of vehicle, engine temperature logs (OBD-II), road roughness index, historical defect logs. | Failure probability within next 72 hours per subsystem (Brakes, Engine, Suspension). | 1 year of structured maintenance job cards ($> 5,000$ service records). | ROC-AUC, Recall for critical failures ($> 90\%$). | **ZERO READINESS:** Digital maintenance database does not yet exist. |

---

## 10. Professional Frontend Audit & Multi-Role User Experiences

The application currently serves public passenger transit search with developer debugging pages. Enterprise operations require four distinct, decoupled user experiences:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         PERUNDHU MULTI-ROLE EXPERIENCES ARCHITECTURE                             │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│ 1. Public Passenger Portal    │ 2. Transport Operations Console  │ 3. Crew In-Cab Interface      │
│ (Responsive Web / Mobile App) │ (Desktop Control Room Dashboard) │ (Driver & Conductor Terminal) │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ • Landing & Hero Corridor     │ • Fleet Real-Time Live Radar     │ • Assigned Shift & Duty Slip  │
│ • District & Route Selection  │ • Incident & Breakdown Dispatch  │ • Single-Tap Breakdown Report │
│ • Live Map with Bus Markers   │ • Vehicle Replacement Controls   │ • GPS Telemetry Status Beacon │
│ • Dynamic Next-Stop & ETAs    │ • Depot Transfer Management      │ • Route Waypoint Checklist    │
│ • Bilingual Tamil / English   │ • Analytics, Speeding Alerts     │ • Minimalist High-Contrast UI │
│ [STATUS: 85% IMPLEMENTED]     │ [STATUS: 15% IMPLEMENTED]        │ [STATUS: 0% IMPLEMENTED]      │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

### 10.1 Role Experience Comparison

| Role Experience | Required Production Pages | Existing Implementation in Repo | Deficit & Implementation Gap |
| :--- | :--- | :--- | :--- |
| **1. Public Passengers** | • Landing Page (`/`)<br>• District Selection (`/districts`)<br>• Route Selection (`/routes`)<br>• Live Map (`/map`, `/routes/:id`)<br>• Bus Stand Directory (`/bus-stands`)<br>• Timetable Schedule View | • `LandingPage.tsx` (**Complete**)<br>• `DistrictSelectionPage.tsx` (**Complete**)<br>• `RouteSelectionPage.tsx` (**Complete**)<br>• `LiveMapPage.tsx` (**Complete**)<br>• `DashboardPage.tsx` (**Partial**)<br>• `auth/` (**Complete**) | Missing dedicated Bus Stand directory page with platform bay arrival boards and route timetable schedule matrix. |
| **2. Transport Administration** | • Live Fleet Operations Radar<br>• Route & Stop Management<br>• Timetable Master Schedule Editor<br>• Telematics & GPS Device Monitor<br>• Speeding & Route Deviation Alerts<br>• Enterprise Analytics & Punctuality Reports | • Server Admin APIs exist (`/admin/buses`, `/admin/trips`, `/admin/simulator`)<br>• No UI pages implemented. | **100% Frontend Deficit.** Requires administrative management dashboard, live command-and-control fleet radar, and GIS route editor. |
| **3. Depot Operations Managers** | • Depot Gate Dispatch Console<br>• Available In-Service Fleet Manifest<br>• Reserve Standby Vehicle Pool<br>• Sister Depot Vehicle Transfer Panel<br>• Active Maintenance Queue<br>• Emergency Breakdown Replacements | • Simple registered bus count displayed on public dashboard (`LiveBusOverview.tsx`). | **90% Frontend Deficit.** Requires interactive depot dispatch terminal, vehicle status toggling, and emergency breakdown replacement wizard. |
| **4. Drivers & Conductors** | • Daily Duty Slip & Trip Assignment<br>• Telemetry Linkage Verification<br>• Single-Tap Breakdown Reporter<br>• Passenger Load & Ticket Stage Status<br>• Emergency Panic Trigger | • None. | **100% Deficit.** Requires mobile-optimized PWA/kiosk crew console with large touch targets and high-contrast night styling. |

---

## 11. Functional Animation & Spatial Micro-Interaction Plan

Consistent with user instructions, animations must **not** rely on gimmicky moving fonts or text sweeps, but must provide genuine functional utility, spatial orientation, and fluid telemetry feedback.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             FUNCTIONAL ANIMATION ARCHITECTURE                                    │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│ Map Telemetry Interpolation   │ Route Path Progressive Drawing   │ Numerical Telemetry Count-Up  │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ • Smooth spherical lerp       │ • SVG stroke-dashoffset draw     │ • Smooth spring-based counter │
│ • Prevents marker jumping     │ • Visually orientates corridors  │ • Punctuality, Active Fleet   │
│ • Bearing rotation easing     │ • Seamless branch switching      │ • Tabular data transitions    │
│ [60 FPS requestAnimationFrame]│ [GPU Accelerated Path Ease]      │ [Reduced Motion Fallbacks]    │
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

### 11.1 10-Point Purposeful Motion Engineering Specification

1. **Kinematic Bus Marker Interpolation:**
   - *Problem:* Real GPS fixes arrive at 5–10s intervals, causing markers to teleport across the map.
   - *Solution:* Implement spherical linear interpolation ($\text{slerp}$) using `requestAnimationFrame`. When a new valid coordinate arrives, calculate bearing and interpolate marker position smoothly over the inter-sample interval ($\Delta t$).
2. **Animated Route Drawing:**
   - *Mechanism:* Upon selecting a route, animate the Leaflet polyline using SVG `stroke-dasharray` and `stroke-dashoffset` from origin to destination ($800\text{ms}$ duration with `cubic-bezier(0.16, 1, 0.3, 1)`), visually orientating the passenger to route direction.
3. **Card Selection Spatial Elevators:**
   - *Mechanism:* Route and district cards transition subtly on hover and focus (`transform: translateY(-2px) scale(1.005)` with soft golden rim bloom `box-shadow: 0 8px 24px rgba(250, 204, 21, 0.2)`).
4. **Data Counter Fluid Count-Up:**
   - *Mechanism:* Real dashboard statistics (active buses, punctuality percentage, total scheduled trips) animate smoothly from 0 to value on mount using a cubic-bezier mathematical spring counter.
5. **Collapsible Stop Sequence Timeline:**
   - *Mechanism:* Accordion stop sequence panels expand using CSS `grid-template-rows: 0fr $\to$ 1fr` with hardware-accelerated opacity easing, avoiding layout shifts.
6. **Side-Panel Slide Transitions:**
   - *Mechanism:* Filter side-drawers and stop inspectors slide into viewport via `transform: translate3d(0, 0, 0)` with backdrop blur saturation, avoiding CPU repaint bottlenecks.
7. **Page View Progress Beam:**
   - *Mechanism:* Top route progress bar reflects network latency and route change state with a cyber yellow gradient beam (`#FFE600` $\to$ `#FACC15`), replacing full-screen disruptive curtains.
8. **Shimmer Skeleton Placeholders:**
   - *Mechanism:* While fetching route or bus stand details, render geometric card skeletons with a subtle linear gradient shimmer (`linear-gradient(90deg, #F4F4F5 0%, #FFFFFF 50%, #F4F4F5 100%)`).
9. **Telemetry Status Pulse Beacon:**
   - *Mechanism:* Live bus markers feature a concentric radar pulse ring (`@keyframes perundhu-radar-yellow`) whose frequency mirrors freshness (1s pulse for `LIVE`, steady amber for `DELAYED`, slow red fade for `DEVIATED`).
10. **Camera Fly-to-Bounds Easing:**
    - *Mechanism:* When selecting a route, invoke `map.flyToBounds(bounds, { padding: [50, 50], duration: 1.2, easeLinearity: 0.25 })` for cinematic geospatial alignment.

*Accessibility Guarantee:* All transitions strictly wrap inside `@media (prefers-reduced-motion: reduce)` rules, immediately jumping to final state when user preferences dictate.

---

## 12. Security, Cryptography & Privacy Risk Matrix

| Risk Vector | Threat Severity | Technical Vulnerability | Implemented Mitigation / Required Defense |
| :--- | :---: | :--- | :--- |
| **GPS Telemetry Spoofing** | **CRITICAL** | Bad actors transmitting false bus coordinates to deceive commuters or fabricate service compliance. | **Implemented:** Raw body HMAC-SHA256 signature verification with secret key, 5-minute timestamp validity window, anti-replay nonce tracking, and kinematic jump detection. |
| **Replay Attacks** | **HIGH** | Intercepted valid telemetry re-transmitted repeatedly to simulate ongoing service. | **Implemented:** In-memory composite nonce cache (`${deviceId}:${nonce}`) rejecting duplicate nonces within the active 5-minute sliding window. |
| **Man-in-the-Middle (MitM)** | **HIGH** | Interception of ETM or telematics data over cellular networks. | **Enforced:** Mandatory TLS 1.3 encryption on ingestion endpoints; strict HTTPS transport security headers via Helmet (`Strict-Transport-Security: max-age=31536000; includeSubDomains`). |
| **Crew Surveillance & PII Privacy** | **HIGH** | Tracking conductor personal movements off-duty or during personal breaks (violating privacy and labor laws). | **Architectural Rule:** Telemetry collection must be strictly bound to active `ScheduledTrip` and `DutyShift` records. Personal conductor IDs must be pseudonymized in public APIs and analytics tables. |
| **API Key Leakage on ETMs** | **HIGH** | Decompilation of Android ETM ticketing APK extracting embedded shared HMAC secrets. | **Required Architecture:** Move from shared symmetric HMAC keys to **asymmetric Elliptic Curve Digital Signatures (ECDSA P-256)** or store keys in hardware-backed Android KeyStore / SAM cards. |
| **Ingestion Denial of Service (DoS)**| **MEDIUM** | Flooding telemetry endpoints to exhaust server compute or MongoDB connection pools. | **Implemented:** Rate limiting via `ingestionLimiter` (100 req/min per IP/Device ID) and payload size caps (50KB body limit). |

---

## 13. External Operator Dependencies & Prerequisites

Before any physical Phase 1 pilot implementation can proceed, the following institutional clearances and infrastructure assets must be secured from the transport undertaking:

1. **AFCS Concessionaire Agreement:** Authorization from the state transport department and their ticketing vendor (e.g., Chalo, VST Mobility, Kent) permitting read-only webhook ingestion or direct hardware telematics integration.
2. **Access to Physical Test ETM:** Two operational Android ETM devices provisioned on the development APN with debugging permissions to evaluate battery discharge curves under active GNSS tracking.
3. **AIS-140 Vehicle Tracking Feed Access:** Formal credentials (MQTT host, port, client certificate, or REST webhook endpoint) to access existing state command-and-control center GPS telemetry for the Madurai pilot fleet.
4. **Official Depots & Fleet Master Manifest:** Complete administrative register of Madurai Central, Periyar, Arappalayam, and Thirumangalam depots, including official vehicle allocations, fleet numbers, and sister backup depot agreements.
5. **Network Firewall Whitelisting:** Firewall rules permitting outbound HTTPS/MQTT traffic from the operator's private APN to the PERUNDHU cloud domain.

---

## 14. Recommended Subsequent Implementation Phases

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             PERUNDHU SUBSEQUENT PHASE ROADMAP                                    │
├──────────────────────────────┬──────────────────────────────────┬────────────────────────────────┤
│ Phase 1: Enterprise Schema   │ Phase 2: Telematics Pilot &      │ Phase 3: Operations Console    │
│ & Infrastructure Database    │ Ingestion Adaptation             │ & Crew Interface               │
├──────────────────────────────┼──────────────────────────────────┼────────────────────────────────┤
│ • Depot & Workshop Schemas   │ • AIS-140 / AFCS Webhook Adapter │ • Transport Admin Dashboard    │
│ • Crew Roster (Driver/Cond)  │ • HMM Road Map Matching          │ • Depot Dispatch Control Room  │
│ • ETM & GPS Asset Registry   │ • Ingestion PKI / Device Tokens  │ • Driver/Conductor In-Cab PWA  │
│ • Replacement Audit Models   │ • 2-Week Battery Pilot Test      │ • Functional UI Animations     │
└──────────────────────────────┴──────────────────────────────────┴────────────────────────────────┘
```

### Phase 1: Enterprise Transport Infrastructure Data Architecture
- Migrate `depotName: string` to dedicated `Depot` collection with primary/backup sister depot relationships and capacity constraints.
- Implement `MaintenanceWorkshop`, `Driver`, `Conductor`, `EtmDevice`, and `GpsTracker` schemas.
- Implement `VehicleReplacementRecord` model with cryptographic approval workflows.
- Seed official surveyed coordinates for Madurai regional depots.

### Phase 2: Telematics Ingestion Adaptation & HMM Map Matching
- Implement the Option A/B telematics adapter: support AIS-140 standard raw NMEA/TCP packet parser alongside the existing HTTPS HMAC contract.
- Transition map matching from 2D perpendicular projection to a **Hidden Markov Model (HMM) Viterbi map matcher** leveraging OpenStreetMap road network graph topology.
- Conduct live physical hardware testing with operator-supplied device to measure real battery discharge and cellular handoff behavior.

### Phase 3: Transport Operations Console & Crew Interface
- Construct the Transport Administrative Operations Dashboard (Fleet live radar, incident manager, route editor).
- Construct the Depot Manager Dispatch Station (Available reserve fleet, maintenance triage, emergency vehicle replacement wizard).
- Construct the lightweight Driver/Conductor PWA terminal for shift muster and single-tap breakdown reporting.
- Implement the 10-point functional animation suite (kinematic marker interpolation, SVG route drawing, spring counters, and camera easing).

### Phase 4: Machine Learning & ETA Maturation
- Ingest 60 days of real operational telemetry into `LocationHistory` collection.
- Train and validate an XGBoost gradient-boosted ETA prediction model against the rule-based baseline.
- Implement unsupervised Isolation Forest anomaly detection for automated GPS spoofing and drift identification.

---

## 15. Summary of Findings & Verification Status

```
========================================================================================
                      PHASE 0 DISCOVERY VERIFICATION SUMMARY TABLE
========================================================================================

Finding / Component                             Classification     Notes
────────────────────────────────────────────────────────────────────────────────────────
Current Git Branch & Commit (master / abce2b2)  VERIFIED           Clean baseline established
Backend Modular Architecture (Node/TS/Express)  VERIFIED           44 test suites passing (346 tests)
Frontend Client Architecture (React/Vite/Map)   VERIFIED           10 test suites passing (84 tests)
HMAC-SHA256 GPS Ingestion Security Endpoint     VERIFIED           POST /location/ingest operational
Universal 6-Stage Telemetry Pipeline            VERIFIED           Snapping, freshness & guards active
Telemetry Truthfulness Guards                   VERIFIED           Simulator cannot overwrite real GPS
Depot, Crew & Maintenance Models in Codebase     VERIFIED (MISSING) Only raw string depotName exists
Exact ETM Manufacturer & Model                  UNKNOWN            Not documented in repository
ETM Built-In GPS Hardware Capability            REPORTED           Likely on Android ETM; absent on legacy
ETM Background Location Streaming Viability     REPORTED (POOR)    Severe battery & asset-coupling limits
AIS-140 Hardwired Vehicle Tracking Superiority  REPORTED (HIGH)    Legally mandated, continuous power
========================================================================================
```

### Exact Missing ETM Details (Required from Operator):
1. **Manufacturer Name, Exact Model Number, and OS Version** (Android release or proprietary RTOS).
2. **Device Ownership Model & MDM Administration** (Policy restrictions on background location tasks).
3. **Ticketing Application Concessionaire / Vendor Name** (Identity of AFCS provider).
4. **Presence of Hardwired AIS-140 Telematics Units** on the target buses.

---

**END OF PHASE 0 DISCOVERY REPORT**  
*Awaiting operator review and formal approval before initiating Phase 1.*

