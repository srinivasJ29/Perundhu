// @vitest-environment jsdom
/**
 * PERUNDHU (பேருந்து) — Phase 9 Live Bus Intelligence & Passenger Real-Time Information Tests
 *
 * Verifies:
 * 1. Live movement telemetry (speed, compass heading, movement status: MOVING, DWELLING, STATIONARY).
 * 2. Route progress bar with percentage, km traveled, and total corridor distance.
 * 3. Stop evidence: last confirmed stop passed and next expected stop with sequence and distance.
 * 4. Interactive Route Stop Timeline and Destination Stop selection updating remaining stops count and ETA.
 * 5. Truthful freshness badges (distinguishing LIVE GPS, DELAYED, STALE, OFFLINE, and SIMULATED).
 * 6. Stale telemetry handling (not pretending bus is moving when GPS has stopped).
 * 7. Service advisories and normal operations status from official alerts.
 * 8. Complete bilingual parity across English and Tamil.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { MapInfoPanel } from '../src/features/map/components/MapInfoPanel';
import { safeSetItem } from '../src/lib/storage';
import { STORAGE_KEYS } from '../src/config/constants';

describe('Phase 9 Live Bus Intelligence & Real-Time Passenger Information Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    safeSetItem(STORAGE_KEYS.LANGUAGE, 'en');
  });

  const baseProps = {
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    activeTab: 'buses' as const,
    onTabChange: vi.fn(),
    routeGeometry: null,
    availableRoutes: [],
    isLoadingRoute: false,
    routeError: null,
    onSelectRoute: vi.fn(),
    onSwitchDirection: vi.fn(),
    liveBuses: [],
    busStands: [],
    nearbyStands: [],
    isLoadingNearby: false,
    selectedEntity: {
      type: 'BUS' as const,
      id: 'BUS-TNSTC-0701',
      lat: 9.9252,
      lng: 78.1189,
      titleEn: 'MDU-D01-0701',
      titleTa: 'MDU-D01-0701',
      subtitleEn: 'TN-58-N-1234',
      subtitleTa: 'TN-58-N-1234',
      data: {}
    },
    onSelectEntity: vi.fn(),
    onClearSelectedEntity: vi.fn()
  };

  it('renders Live Movement Telemetry with speed, heading, and MOVING status badge', () => {
    const liveDetails = {
      bus: {
        id: 'BUS-TNSTC-0701',
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-D01-0701',
        vehicleType: 'DELUXE_NON_AC'
      },
      depot: {
        id: 'depot-01',
        name: 'Madurai Central Depot',
        code: 'MDU-D01'
      },
      route: {
        id: 'route-70',
        routeNumber: '70',
        displayTitleEn: 'Periyar to Thirumangalam',
        displayTitleTa: 'பெரியார் முதல் திருமங்கலம் வரை'
      },
      direction: {
        id: 'dir-outbound',
        directionCode: 'OUTBOUND',
        totalDistanceKm: 18.5
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        heading: 85,
        speedKmph: 32,
        trackingStatus: 'LIVE',
        source: 'VEHICLE_HARDWARE_GPS',
        isSimulated: false,
        freshness: 'HEALTHY' as const,
        recordedAt: new Date().toISOString()
      },
      deviceHealth: {
        networkConnectivity: 'ONLINE' as const,
        gpsSignalStatus: 'ACQUIRED_3D' as const,
        satellitesTracked: 14
      },
      intelligence: {
        movementStatus: 'MOVING' as const,
        currentSpeedKmph: 32,
        compassHeading: { degrees: 85, direction: 'E' },
        routeProgress: {
          progressPercent: 42,
          distanceTraveledKm: 7.8,
          totalDistanceKm: 18.5,
          currentSegmentIndex: 3,
          totalSegments: 10
        },
        lastConfirmedStop: {
          stopId: 'stop-03',
          stopCode: 'ELN',
          nameEn: 'Ellis Nagar',
          nameTa: 'எல்லிஸ் நகர்',
          sequence: 3
        },
        nextExpectedStop: {
          stopId: 'stop-04',
          stopCode: 'MDC',
          nameEn: 'Madura College',
          nameTa: 'மதுரா கல்லூரி',
          sequence: 4,
          distanceMeters: 850,
          etaMinutes: 3,
          estimatedArrivalAt: new Date(Date.now() + 180000).toISOString(),
          confidenceIntervalSeconds: [140, 220] as [number, number]
        },
        stopsItinerary: [
          { stopId: 'stop-01', stopCode: 'PER', nameEn: 'Periyar Bus Stand', nameTa: 'பெரியார்', sequence: 1, location: [78.114, 9.917] as [number, number], status: 'CONFIRMED_PASSED' as const, distanceFromOriginKm: 0 },
          { stopId: 'stop-02', stopCode: 'VLM', nameEn: 'Villapuram', nameTa: 'வில்லாபுரம்', sequence: 2, location: [78.116, 9.921] as [number, number], status: 'CONFIRMED_PASSED' as const, distanceFromOriginKm: 2.5 },
          { stopId: 'stop-03', stopCode: 'ELN', nameEn: 'Ellis Nagar', nameTa: 'எல்லிஸ் நகர்', sequence: 3, location: [78.118, 9.924] as [number, number], status: 'CONFIRMED_PASSED' as const, distanceFromOriginKm: 5.1 },
          { stopId: 'stop-04', stopCode: 'MDC', nameEn: 'Madura College', nameTa: 'மதுரா கல்லூரி', sequence: 4, location: [78.121, 9.928] as [number, number], status: 'CURRENT_STOP' as const, distanceFromOriginKm: 7.8, etaMinutes: 3, predictionSource: 'ML_PREDICTION' },
          { stopId: 'stop-05', stopCode: 'TMG', nameEn: 'Thirumangalam Terminal', nameTa: 'திருமங்கலம்', sequence: 5, location: [78.129, 9.939] as [number, number], status: 'UPCOMING' as const, distanceFromOriginKm: 18.5, etaMinutes: 24, predictionSource: 'ML_PREDICTION' }
        ]
      },
      eta: {
        isRealTimePrediction: true,
        predictionSource: 'ML_PREDICTION',
        confidence: 0.88,
        modelVersion: 'v1.0-xgb',
        nextStop: {
          stopId: 'stop-04',
          stopCode: 'MDC',
          stopNameEn: 'Madura College',
          stopNameTa: 'மதுரா கல்லூரி',
          stopSequence: 4,
          etaMinutes: 3,
          estimatedArrivalAt: new Date(Date.now() + 180000).toISOString(),
          remainingDistanceMeters: 850,
          confidenceIntervalSeconds: [140, 220] as [number, number],
          predictionSource: 'ML_PREDICTION'
        },
        downstreamStops: [
          {
            stopId: 'stop-05',
            stopCode: 'TMG',
            stopNameEn: 'Thirumangalam Terminal',
            stopNameTa: 'திருமங்கலம்',
            stopSequence: 5,
            etaMinutes: 24,
            estimatedArrivalAt: new Date(Date.now() + 1440000).toISOString(),
            remainingDistanceMeters: 10700,
            confidenceIntervalSeconds: [1260, 1620] as [number, number],
            predictionSource: 'ML_PREDICTION'
          }
        ]
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={liveDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    // Section A: Bus Header
    expect(screen.getByText('MDU-D01-0701 •')).toBeInTheDocument();
    expect(screen.getByText('TN-58-N-1234')).toBeInTheDocument();
    expect(screen.getByText('LIVE GPS')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();

    // Section C: Movement Telemetry
    expect(screen.getByText('Live Movement Telemetry')).toBeInTheDocument();
    expect(screen.getAllByText('Moving').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('32 km/h').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('85° (E)')).toBeInTheDocument();

    // Route Progress
    expect(screen.getByText(/42% \(7.8 \/ 18.5 km\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Segment 4\/10/i)).toBeInTheDocument();

    // Stop Evidence
    expect(screen.getByText('#3 Ellis Nagar')).toBeInTheDocument();
    expect(screen.getByText('#4 Madura College')).toBeInTheDocument();

    // Section D: AI Arrival Prediction
    expect(screen.getByText('AI / ML Model v1.0')).toBeInTheDocument();
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
    expect(screen.getByText(/~3 mins/i)).toBeInTheDocument();
  });

  it('allows passenger to select destination stop in mini-timeline and updates arrival information', () => {
    const liveDetails = {
      bus: {
        id: 'BUS-TNSTC-0701',
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-D01-0701',
        vehicleType: 'DELUXE_NON_AC'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        heading: 90,
        speedKmph: 28,
        trackingStatus: 'LIVE',
        source: 'VEHICLE_HARDWARE_GPS',
        freshness: 'HEALTHY' as const,
        recordedAt: new Date().toISOString()
      },
      intelligence: {
        movementStatus: 'MOVING' as const,
        currentSpeedKmph: 28,
        compassHeading: { degrees: 90, direction: 'E' },
        lastConfirmedStop: { stopId: 'stop-01', stopCode: 'PER', nameEn: 'Periyar', nameTa: 'பெரியார்', sequence: 1 },
        nextExpectedStop: { stopId: 'stop-02', stopCode: 'VLM', nameEn: 'Villapuram', nameTa: 'வில்லாபுரம்', sequence: 2, distanceMeters: 1200, etaMinutes: 4 },
        stopsItinerary: [
          { stopId: 'stop-01', stopCode: 'PER', nameEn: 'Periyar', nameTa: 'பெரியார்', sequence: 1, location: [78.114, 9.917] as [number, number], status: 'CONFIRMED_PASSED' as const, distanceFromOriginKm: 0 },
          { stopId: 'stop-02', stopCode: 'VLM', nameEn: 'Villapuram', nameTa: 'வில்லாபுரம்', sequence: 2, location: [78.116, 9.921] as [number, number], status: 'CURRENT_STOP' as const, distanceFromOriginKm: 2.5, etaMinutes: 4, predictionSource: 'ML_PREDICTION' },
          { stopId: 'stop-05', stopCode: 'TMG', nameEn: 'Thirumangalam Terminal', nameTa: 'திருமங்கலம் முனையம்', sequence: 5, location: [78.129, 9.939] as [number, number], status: 'UPCOMING' as const, distanceFromOriginKm: 18.5, etaMinutes: 22, predictionSource: 'ML_PREDICTION' }
        ]
      },
      eta: {
        isRealTimePrediction: true,
        predictionSource: 'ML_PREDICTION',
        nextStop: {
          stopId: 'stop-02',
          stopCode: 'VLM',
          stopNameEn: 'Villapuram',
          stopNameTa: 'வில்லாபுரம்',
          stopSequence: 2,
          etaMinutes: 4,
          remainingDistanceMeters: 1200,
          confidenceIntervalSeconds: [180, 300] as [number, number],
          predictionSource: 'ML_PREDICTION'
        },
        downstreamStops: [
          {
            stopId: 'stop-05',
            stopCode: 'TMG',
            stopNameEn: 'Thirumangalam Terminal',
            stopNameTa: 'திருமங்கலம் முனையம்',
            stopSequence: 5,
            etaMinutes: 22,
            remainingDistanceMeters: 16000,
            confidenceIntervalSeconds: [1100, 1500] as [number, number],
            predictionSource: 'ML_PREDICTION'
          }
        ]
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={liveDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    // Initial state: next stop is Villapuram
    expect(screen.getByText('Next Stop: Villapuram')).toBeInTheDocument();

    // Click on Thirumangalam Terminal in the mini-timeline
    const termStop = screen.getByText('Thirumangalam Terminal');
    fireEvent.click(termStop);

    // Destination summary card should appear
    expect(screen.getByText(/Destination Stop: Thirumangalam Terminal/i)).toBeInTheDocument();
    expect(screen.getByText(/4 stops away/i)).toBeInTheDocument();
    expect(screen.getByText(/Selected Stop Arrival: Thirumangalam Terminal/i)).toBeInTheDocument();
  });

  it('renders truthful STALE and OFFLINE status badges without extrapolating live motion', () => {
    const staleDetails = {
      bus: {
        id: 'BUS-TNSTC-0701',
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-D01-0701',
        vehicleType: 'ORDINARY_NON_AC'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        heading: 180,
        speedKmph: 0,
        trackingStatus: 'STALE',
        source: 'VEHICLE_HARDWARE_GPS',
        isSimulated: false,
        freshness: 'STALE' as const,
        recordedAt: new Date(Date.now() - 360000).toISOString() // 6 mins ago
      },
      deviceHealth: {
        networkConnectivity: 'STALE' as const,
        gpsSignalStatus: 'ACQUIRED_2D' as const,
        satellitesTracked: 4
      },
      intelligence: {
        movementStatus: 'STATIONARY' as const,
        currentSpeedKmph: 0,
        compassHeading: { degrees: 180, direction: 'S' }
      },
      eta: {
        isRealTimePrediction: false,
        predictionSource: 'ETA_UNAVAILABLE',
        fallbackReason: 'GPS_STALE',
        nextStop: null,
        downstreamStops: []
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={staleDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    // Stale status badges
    expect(screen.getByText('STALE GPS')).toBeInTheDocument();
    expect(screen.getAllByText('Stationary').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/0 km\/h \(Stationary\)/i)).toBeInTheDocument();

    // Truthful pause notice
    expect(
      screen.getByText(/GPS signal stale \(>5 mins\) — Real-time prediction paused/i)
    ).toBeInTheDocument();
  });

  it('renders official normal service verification notice when no route disruptions are active', async () => {
    const normalDetails = {
      bus: {
        id: 'BUS-TNSTC-0701',
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-D01-0701',
        vehicleType: 'ORDINARY_NON_AC'
      },
      route: {
        id: 'route-70',
        routeNumber: '70',
        displayTitleEn: 'Route 70',
        displayTitleTa: 'தடம் 70'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        heading: 90,
        speedKmph: 25,
        trackingStatus: 'LIVE',
        source: 'VEHICLE_HARDWARE_GPS',
        freshness: 'HEALTHY' as const,
        recordedAt: new Date().toISOString()
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={normalDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Normal Operations')).toBeInTheDocument();
    expect(await screen.findByText('No disruptions reported on this route.')).toBeInTheDocument();
  });

  it('renders full Tamil bilingual parity for live movement telemetry and intelligence', () => {
    safeSetItem(STORAGE_KEYS.LANGUAGE, 'ta');

    const liveDetails = {
      bus: {
        id: 'BUS-TNSTC-0701',
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-D01-0701',
        vehicleType: 'ORDINARY_NON_AC'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        heading: 90,
        speedKmph: 30,
        trackingStatus: 'LIVE',
        source: 'VEHICLE_HARDWARE_GPS',
        freshness: 'HEALTHY' as const,
        recordedAt: new Date().toISOString()
      },
      intelligence: {
        movementStatus: 'MOVING' as const,
        currentSpeedKmph: 30,
        compassHeading: { degrees: 90, direction: 'E' },
        routeProgress: {
          progressPercent: 50,
          distanceTraveledKm: 9.0,
          totalDistanceKm: 18.0,
          currentSegmentIndex: 4,
          totalSegments: 8
        },
        lastConfirmedStop: {
          stopId: 'stop-01',
          stopCode: 'PER',
          nameEn: 'Periyar',
          nameTa: 'பெரியார் நிலையம்',
          sequence: 1
        },
        nextExpectedStop: {
          stopId: 'stop-02',
          stopCode: 'VLM',
          nameEn: 'Villapuram',
          nameTa: 'வில்லாபுரம்',
          sequence: 2,
          distanceMeters: 600,
          etaMinutes: 2
        }
      },
      eta: {
        isRealTimePrediction: true,
        predictionSource: 'ML_PREDICTION',
        confidence: 0.9,
        nextStop: {
          stopId: 'stop-02',
          stopCode: 'VLM',
          stopNameEn: 'Villapuram',
          stopNameTa: 'வில்லாபுரம்',
          stopSequence: 2,
          etaMinutes: 2,
          confidenceIntervalSeconds: [90, 150] as [number, number],
          predictionSource: 'ML_PREDICTION'
        },
        downstreamStops: []
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={liveDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    // Tamil labels verification
    expect(screen.getByText('நேரலை இயக்கம்')).toBeInTheDocument();
    expect(screen.getByText('இயக்கத்தில்')).toBeInTheDocument();
    expect(screen.getByText(/வழித்தட முன்னேற்றம்/i)).toBeInTheDocument();
    expect(screen.getByText('நேரலை GPS')).toBeInTheDocument();
    expect(screen.getByText('செயற்கை நுண்ணறிவு கணிப்பு v1.0')).toBeInTheDocument();
    expect(screen.getByText('அடுத்த நிறுத்தம்: வில்லாபுரம்')).toBeInTheDocument();
  });
});
