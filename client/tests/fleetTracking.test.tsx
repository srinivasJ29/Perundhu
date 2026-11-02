// @vitest-environment jsdom
/**
 * PERUNDHU (பேருந்து) — Phase 6: Live Fleet Tracking & Interactive Map System Tests
 * Tests fleet sidebar, category filters, bus selection, detailed telemetry card,
 * marker movement logic, fit-to-fleet triggers, and truthful hardware source badges.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../src/i18n';
import { MapInfoPanel } from '../src/features/map/components/MapInfoPanel';
import { LiveBusMarkerData, SelectedMapEntity } from '../src/features/map/types';
import { STORAGE_KEYS } from '../src/config/constants';
import { safeSetItem } from '../src/lib/storage';

describe('PERUNDHU Phase 6 — Live Fleet Tracking & Map Panel Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeSetItem(STORAGE_KEYS.LANGUAGE, 'en');
  });
  const mockBuses: LiveBusMarkerData[] = [
    {
      busId: 'bus-001',
      fleetNumber: 'TN-58-N-1001',
      registrationNumber: 'TN 58 N 1001',
      routeNumber: '70',
      lat: 9.9252,
      lng: 78.1198,
      heading: 90,
      speedKmph: 35,
      trackingStatus: 'LIVE',
      source: 'VEHICLE_HARDWARE_GPS',
      isSimulated: false,
      recordedAt: new Date(Date.now() - 5000).toISOString(),
      lastReceivedAt: Date.now() - 5000
    },
    {
      busId: 'bus-002',
      fleetNumber: 'TN-58-N-1002',
      registrationNumber: 'TN 58 N 1002',
      routeNumber: '70B',
      lat: 9.9312,
      lng: 78.1255,
      heading: 180,
      speedKmph: 0,
      trackingStatus: 'STALE',
      source: 'SIMULATOR',
      isSimulated: true,
      recordedAt: new Date(Date.now() - 40000).toISOString(),
      lastReceivedAt: Date.now() - 40000
    },
    {
      busId: 'bus-003',
      fleetNumber: 'TN-58-N-1003',
      registrationNumber: 'TN 58 N 1003',
      routeNumber: '77',
      lat: 9.918,
      lng: 78.112,
      heading: 270,
      speedKmph: 42,
      trackingStatus: 'LIVE',
      source: 'ETM_GPS',
      isSimulated: false,
      recordedAt: new Date(Date.now() - 10000).toISOString(),
      lastReceivedAt: Date.now() - 10000
    }
  ];

  const defaultProps = {
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
    liveBuses: mockBuses,
    filteredBuses: mockBuses,
    fleetFilter: 'ALL' as const,
    onFleetFilterChange: vi.fn(),
    fleetSearch: '',
    onFleetSearchChange: vi.fn(),
    selectedBusLiveDetails: null,
    isLoadingBusDetails: false,
    onFitToFleet: vi.fn(),
    onFitToRoute: vi.fn(),
    busStands: [],
    nearbyStands: [],
    isLoadingNearby: false,
    selectedEntity: null,
    onSelectEntity: vi.fn(),
    onClearSelectedEntity: vi.fn()
  };

  it('renders the Live Fleet Sidebar with count and list of active buses', () => {
    render(
      <I18nProvider>
        <MapInfoPanel {...defaultProps} />
      </I18nProvider>
    );

    expect(screen.getByText(/TN-58-N-1001/i)).toBeInTheDocument();
    expect(screen.getByText(/TN-58-N-1002/i)).toBeInTheDocument();
    expect(screen.getByText(/TN-58-N-1003/i)).toBeInTheDocument();
  });

  it('displays category filter pills with correct counts and triggers filter change', () => {
    const onFleetFilterChange = vi.fn();
    render(
      <I18nProvider>
        <MapInfoPanel {...defaultProps} onFleetFilterChange={onFleetFilterChange} />
      </I18nProvider>
    );

    // Filter pills
    const allBtn = screen.getByRole('button', { name: /all/i });
    expect(allBtn).toBeInTheDocument();
    expect(allBtn).toHaveTextContent('(3)');

    const movingBtn = screen.getByRole('button', { name: /moving/i });
    expect(movingBtn).toBeInTheDocument();
    expect(movingBtn).toHaveTextContent('(2)'); // bus-001 (35 km/h) & bus-003 (42 km/h)

    fireEvent.click(movingBtn);
    expect(onFleetFilterChange).toHaveBeenCalledWith('MOVING');

    const realGpsBtn = screen.getByRole('button', { name: /live gps/i });
    expect(realGpsBtn).toBeInTheDocument();
    expect(realGpsBtn).toHaveTextContent('(2)'); // bus-001 & bus-003
  });

  it('handles fleet search input changes and clear button', () => {
    const onFleetSearchChange = vi.fn();
    render(
      <I18nProvider>
        <MapInfoPanel
          {...defaultProps}
          fleetSearch="1001"
          onFleetSearchChange={onFleetSearchChange}
        />
      </I18nProvider>
    );

    const input = screen.getByPlaceholderText(/search by fleet/i);
    expect(input).toHaveValue('1001');

    fireEvent.change(input, { target: { value: '1002' } });
    expect(onFleetSearchChange).toHaveBeenCalledWith('1002');

    const clearBtn = screen.getByRole('button', { name: /clear fleet search/i });
    fireEvent.click(clearBtn);
    expect(onFleetSearchChange).toHaveBeenCalledWith('');
  });

  it('triggers onSelectEntity when clicking a bus in the fleet list', () => {
    const onSelectEntity = vi.fn();
    render(
      <I18nProvider>
        <MapInfoPanel {...defaultProps} onSelectEntity={onSelectEntity} />
      </I18nProvider>
    );

    const busCard = screen.getByText('TN-58-N-1001').closest('.map-bus-card')!;
    fireEvent.click(busCard);

    expect(onSelectEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'BUS',
        id: 'bus-001',
        titleEn: 'TN-58-N-1001'
      })
    );
  });

  it('renders comprehensive Selected Bus Details Card with truthful badges and metadata', () => {
    const selectedBusEntity: SelectedMapEntity = {
      type: 'BUS',
      id: 'bus-001',
      lat: 9.9252,
      lng: 78.1198,
      titleEn: 'TN-58-N-1001',
      titleTa: 'அரசுப் பேருந்து',
      subtitleEn: 'TN 58 N 1001',
      data: mockBuses[0]
    };

    const mockLiveDetails = {
      bus: {
        id: 'bus-001',
        registrationNumber: 'TN 58 N 1001',
        fleetNumber: 'TN-58-N-1001',
        vehicleType: 'ULTRA_DELUXE',
        currentDepotId: {
          id: 'depot-01',
          nameEn: 'Madurai Central Depot',
          nameTa: 'மதுரை மத்திய பணிமனை',
          code: 'MDU-CEN'
        }
      },
      latestPosition: {
        lat: 9.9252,
        lng: 78.1198,
        speedKmph: 35,
        heading: 90,
        source: 'VEHICLE_HARDWARE_GPS',
        isSimulated: false,
        trackingStatus: 'LIVE',
        recordedAt: new Date().toISOString()
      },
      assignedRoute: {
        id: 'route-70',
        routeNumber: '70',
        nameEn: 'Periyar to Mattuthavani',
        nameTa: 'பெரியார் முதல் மாட்டுத்தாவணி'
      },
      deviceHealth: {
        networkConnectivity: 'ONLINE',
        gpsSignalStatus: 'ACQUIRED_3D',
        satellitesTracked: 12
      }
    };

    render(
      <I18nProvider>
        <MapInfoPanel
          {...defaultProps}
          selectedEntity={selectedBusEntity}
          selectedBusLiveDetails={mockLiveDetails}
        />
      </I18nProvider>
    );

    // Header and Registration
    expect(screen.getAllByText('TN 58 N 1001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/ULTRA DELUXE/i)).toBeInTheDocument();

    // Truthful source badge
    expect(screen.getAllByText('LIVE GPS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ONLINE')).toBeInTheDocument();

    // Depot
    expect(screen.getByText(/Madurai Central Depot/i)).toBeInTheDocument();

    // Route
    expect(screen.getByText('Route 70')).toBeInTheDocument();

    // Coordinates
    expect(screen.getByText('9.92520, 78.11980')).toBeInTheDocument();

    // Speed & Heading
    expect(screen.getByText(/35 km\/h • 90° \(E\)/i)).toBeInTheDocument();

    // Device health
    expect(screen.getByText(/ACQUIRED_3D • 12 Sats/i)).toBeInTheDocument();
  });

  it('triggers onFitToFleet when the Fit Map to Fleet button is clicked', () => {
    const onFitToFleet = vi.fn();
    render(
      <I18nProvider>
        <MapInfoPanel {...defaultProps} onFitToFleet={onFitToFleet} />
      </I18nProvider>
    );

    const fitBtn = screen.getByTitle(/fit map to fleet/i);
    fireEvent.click(fitBtn);

    expect(onFitToFleet).toHaveBeenCalledTimes(1);
  });

  it('displays truthful empty state with hardware disclosure when liveBuses is empty', () => {
    render(
      <I18nProvider>
        <MapInfoPanel
          {...defaultProps}
          liveBuses={[]}
          filteredBuses={[]}
        />
      </I18nProvider>
    );

    expect(screen.getByText(/no live bus positions are available right now/i)).toBeInTheDocument();
    expect(screen.getByText(/physical vehicle gps hardware and etm units are verified/i)).toBeInTheDocument();
  });
});
