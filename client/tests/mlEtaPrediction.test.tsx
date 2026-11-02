/**
 * PERUNDHU (பேருந்து) — Phase 9 Machine Learning Bus Arrival Time Prediction (ETA) UI Tests
 *
 * Verifies:
 * 1. AI/ML prediction badge ("AI / ML Model v1.0") and calibrated confidence intervals.
 * 2. Fallback to Corridor Baseline model badge ("Corridor Baseline").
 * 3. Graceful fallback when bus is deviated off-route ("Bus off scheduled corridor — ETA paused").
 * 4. Graceful fallback when GPS tracking is stale or offline.
 * 5. Downstream stop selection updating arrival estimation.
 * 6. Full bilingual rendering in Tamil (தமிழ்) and English.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { MapInfoPanel } from '../src/features/map/components/MapInfoPanel';
import { safeSetItem } from '../src/lib/storage';
import { STORAGE_KEYS } from '../src/config/constants';

describe('Phase 9 AI/ML Bus Arrival Prediction UI (Client Tests)', () => {
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
      id: 'BUS-01',
      lat: 9.9252,
      lng: 78.1189,
      titleEn: 'TNSTC Bus 101',
      titleTa: 'அரசுப் பேருந்து 101',
      subtitleEn: 'TN-58-N-1234',
      subtitleTa: 'TN-58-N-1234',
      data: {}
    },
    onSelectEntity: vi.fn(),
    onClearSelectedEntity: vi.fn()
  };

  it('renders AI/ML Model v1.0 badge and confidence intervals when ML_PREDICTION is active', () => {
    const mlLiveDetails = {
      bus: {
        id: 'BUS-01',
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-EXP-101',
        vehicleType: 'ULTRA_DELUXE'
      },
      assignedRoute: {
        id: 'route-70',
        routeNumber: '70',
        nameEn: 'Periyar to Mattuthavani',
        nameTa: 'பெரியார் முதல் மாட்டுத்தாவணி வரை'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        speedKmph: 24,
        heading: 90,
        source: 'VERIFIED_PHYSICAL_GPS',
        trackingStatus: 'LIVE',
        recordedAt: new Date().toISOString()
      },
      eta: {
        isRealTimePrediction: true,
        predictionSource: 'ML_PREDICTION',
        confidence: 0.88,
        modelVersion: 'v1.0-xgboost',
        generatedAt: new Date().toISOString(),
        nextStop: {
          stopId: 'stop-02',
          stopCode: 'STOP-02',
          stopNameEn: 'Simmakkal',
          stopNameTa: 'சிம்மக்கல்',
          stopSequence: 2,
          etaMinutes: 8,
          confidenceIntervalSeconds: [420, 540], // 7 - 9 mins
          estimatedArrivalAt: new Date(Date.now() + 8 * 60000).toISOString(),
          remainingDistanceMeters: 2400
        },
        downstreamStops: [
          {
            stopId: 'stop-02',
            stopCode: 'STOP-02',
            stopNameEn: 'Simmakkal',
            stopNameTa: 'சிம்மக்கல்',
            stopSequence: 2,
            etaMinutes: 8,
            confidenceIntervalSeconds: [420, 540],
            estimatedArrivalAt: new Date(Date.now() + 8 * 60000).toISOString(),
            remainingDistanceMeters: 2400
          },
          {
            stopId: 'stop-03',
            stopCode: 'STOP-03',
            stopNameEn: 'Goripalayam',
            stopNameTa: 'கோரிப்பாளையம்',
            stopSequence: 3,
            etaMinutes: 14,
            confidenceIntervalSeconds: [780, 960], // 13 - 16 mins
            estimatedArrivalAt: new Date(Date.now() + 14 * 60000).toISOString(),
            remainingDistanceMeters: 4500
          }
        ]
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={mlLiveDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    // Verify AI/ML Badge
    expect(screen.getByText('AI / ML Model v1.0')).toBeInTheDocument();

    // Verify arrival estimate text with confidence interval
    expect(screen.getAllByText(/~8 mins/)[0]).toBeInTheDocument();
    expect(screen.getByText(/\(7–9 mins\)/)).toBeInTheDocument();
    expect(screen.getByText(/Next Stop: Simmakkal/)).toBeInTheDocument();

    // Verify High Confidence badge
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
  });

  it('renders Corridor Baseline badge when ML prediction falls back to baseline', () => {
    const baselineLiveDetails = {
      bus: {
        id: 'BUS-01',
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-EXP-101'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        speedKmph: 18,
        source: 'SIMULATOR',
        trackingStatus: 'SIMULATED',
        recordedAt: new Date().toISOString()
      },
      eta: {
        isRealTimePrediction: false,
        predictionSource: 'BASELINE_ESTIMATE',
        confidence: 0.65,
        modelVersion: 'baseline-corridor-v1.0',
        nextStop: {
          stopId: 'stop-02',
          stopNameEn: 'Simmakkal',
          stopNameTa: 'சிம்மக்கல்',
          etaMinutes: 6,
          estimatedArrivalAt: new Date(Date.now() + 6 * 60000).toISOString()
        }
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={baselineLiveDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Corridor Baseline')).toBeInTheDocument();
    expect(screen.getByText(/~6 mins/)).toBeInTheDocument();
  });

  it('displays deviated notice when bus is off-corridor', () => {
    const deviatedLiveDetails = {
      bus: {
        id: 'BUS-01',
        registrationNumber: 'TN-58-N-1234'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        speedKmph: 22,
        trackingStatus: 'DEVIATED',
        recordedAt: new Date().toISOString()
      },
      eta: {
        isRealTimePrediction: false,
        predictionSource: 'ETA_UNAVAILABLE',
        fallbackReason: 'BUS_OFF_ROUTE'
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={deviatedLiveDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Bus off scheduled corridor — ETA paused')).toBeInTheDocument();
  });

  it('displays stale tracking notice when GPS is offline or stale', () => {
    const staleLiveDetails = {
      bus: {
        id: 'BUS-01',
        registrationNumber: 'TN-58-N-1234'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        speedKmph: 0,
        trackingStatus: 'OFFLINE',
        recordedAt: new Date(Date.now() - 600000).toISOString() // 10 mins ago
      },
      eta: {
        isRealTimePrediction: false,
        predictionSource: 'ETA_UNAVAILABLE',
        fallbackReason: 'GPS_STALE'
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={staleLiveDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('GPS signal stale (>5 mins) — Real-time prediction paused')).toBeInTheDocument();
  });

  it('allows user to select downstream stop and updates predicted arrival time', () => {
    const multiStopDetails = {
      bus: {
        id: 'BUS-01',
        registrationNumber: 'TN-58-N-1234'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        speedKmph: 25,
        trackingStatus: 'LIVE',
        recordedAt: new Date().toISOString()
      },
      eta: {
        isRealTimePrediction: true,
        predictionSource: 'ML_PREDICTION',
        confidence: 0.85,
        nextStop: {
          stopId: 'stop-02',
          stopCode: 'STOP-02',
          stopNameEn: 'Simmakkal',
          stopNameTa: 'சிம்மக்கல்',
          stopSequence: 2,
          etaMinutes: 5,
          confidenceIntervalSeconds: [260, 340],
          estimatedArrivalAt: new Date(Date.now() + 5 * 60000).toISOString()
        },
        downstreamStops: [
          {
            stopId: 'stop-02',
            stopCode: 'STOP-02',
            stopNameEn: 'Simmakkal',
            stopNameTa: 'சிம்மக்கல்',
            stopSequence: 2,
            etaMinutes: 5,
            confidenceIntervalSeconds: [260, 340],
            estimatedArrivalAt: new Date(Date.now() + 5 * 60000).toISOString()
          },
          {
            stopId: 'stop-03',
            stopCode: 'STOP-03',
            stopNameEn: 'Goripalayam',
            stopNameTa: 'கோரிப்பாளையம்',
            stopSequence: 3,
            etaMinutes: 12,
            confidenceIntervalSeconds: [660, 780],
            estimatedArrivalAt: new Date(Date.now() + 12 * 60000).toISOString()
          }
        ]
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={multiStopDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    // Initial state shows next stop (Simmakkal)
    expect(screen.getByText(/Next Stop: Simmakkal/)).toBeInTheDocument();
    expect(screen.getAllByText(/~5 mins/)[0]).toBeInTheDocument();

    // Select Goripalayam from dropdown
    const select = screen.getByRole('combobox', { name: /select a downstream stop/i });
    fireEvent.change(select, { target: { value: 'stop-03' } });

    // Displays selected stop arrival (Goripalayam ~12 mins)
    expect(screen.getByText(/Selected Stop Arrival: Goripalayam/)).toBeInTheDocument();
    expect(screen.getAllByText(/~12 mins/)[0]).toBeInTheDocument();
    expect(screen.getByText(/\(11–13 mins\)/)).toBeInTheDocument();
  });

  it('renders correctly in Tamil with bilingual parity', () => {
    safeSetItem(STORAGE_KEYS.LANGUAGE, 'ta');
    const mlLiveDetails = {
      bus: {
        id: 'BUS-01',
        registrationNumber: 'TN-58-N-1234'
      },
      latestPosition: {
        coordinates: [78.1189, 9.9252],
        speedKmph: 24,
        trackingStatus: 'LIVE',
        recordedAt: new Date().toISOString()
      },
      eta: {
        isRealTimePrediction: true,
        predictionSource: 'ML_PREDICTION',
        confidence: 0.9,
        nextStop: {
          stopId: 'stop-02',
          stopNameEn: 'Simmakkal',
          stopNameTa: 'சிம்மக்கல்',
          etaMinutes: 7,
          confidenceIntervalSeconds: [360, 480],
          estimatedArrivalAt: new Date(Date.now() + 7 * 60000).toISOString()
        }
      }
    };

    render(
      <MemoryRouter>
        <I18nProvider>
          <MapInfoPanel {...baseProps} selectedBusLiveDetails={mlLiveDetails} />
        </I18nProvider>
      </MemoryRouter>
    );

    // Verify Tamil AI/ML Badge
    expect(screen.getByText('செயற்கை நுண்ணறிவு கணிப்பு v1.0')).toBeInTheDocument();
    expect(screen.getByText(/அடுத்த நிறுத்தம்: சிம்மக்கல்/)).toBeInTheDocument();
    expect(screen.getByText(/~7 நிமிடங்கள்/)).toBeInTheDocument();
    expect(screen.getByText(/\(6–8 நிமி\)/)).toBeInTheDocument();
  });
});
