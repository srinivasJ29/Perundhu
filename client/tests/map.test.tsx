import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/features/auth';
import { LiveMapPage } from '../src/features/map/pages/LiveMapPage';
import { STORAGE_KEYS } from '../src/config/constants';
import { safeSetItem } from '../src/lib/storage';

// 1. Mock Leaflet & React-Leaflet
vi.mock('leaflet', () => ({
  default: {
    divIcon: (opts: any) => ({ ...opts, _isDivIcon: true }),
    latLng: (lat: number, lng: number) => ({ lat, lng }),
    latLngBounds: () => ({ extend: vi.fn(), isValid: vi.fn(() => true) })
  },
  divIcon: (opts: any) => ({ ...opts, _isDivIcon: true }),
  latLng: (lat: number, lng: number) => ({ lat, lng }),
  latLngBounds: () => ({ extend: vi.fn(), isValid: vi.fn(() => true) })
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  AttributionControl: () => null,
  useMap: () => ({
    setView: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    invalidateSize: vi.fn()
  }),
  useMapEvents: () => ({}),
  Marker: ({ children, position, eventHandlers }: any) => (
    <div
      data-testid="map-marker"
      data-lat={position?.[0]}
      data-lng={position?.[1]}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="map-popup">{children}</div>,
  Polyline: ({ positions }: any) => (
    <div data-testid="map-polyline" data-positions={JSON.stringify(positions)} />
  ),
  Circle: () => <div data-testid="map-circle" />
}));

// 2. Mock Socket Client Manager
vi.mock('../src/services/socket/socketClient', () => ({
  socketClientManager: {
    setTokenProvider: vi.fn(),
    getConnectionState: vi.fn(() => 'CONNECTED'),
    onStateChange: vi.fn((cb) => {
      cb('CONNECTED');
      return vi.fn();
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribeRoute: vi.fn(),
    unsubscribeRoute: vi.fn(),
    subscribeBus: vi.fn(),
    unsubscribeBus: vi.fn(),
    subscribeToRoute: vi.fn(),
    unsubscribeFromRoute: vi.fn(),
    subscribeToBus: vi.fn(),
    unsubscribeFromBus: vi.fn(),
    onBusPosition: vi.fn(() => vi.fn()),
    onBusStatus: vi.fn(() => vi.fn()),
    onBusEta: vi.fn(() => vi.fn()),
    onBusNextStop: vi.fn(() => vi.fn()),
    onSubscriptionAck: vi.fn(() => vi.fn()),
    onSubscriptionError: vi.fn(() => vi.fn())
  }
}));

// 3. Mock Geolocation Module
vi.mock('../src/features/location/geolocation', () => ({
  requestUserGeolocation: vi.fn().mockResolvedValue({
    coords: {
      latitude: 9.9252,
      longitude: 78.1198,
      accuracy: 15
    },
    timestamp: Date.now()
  })
}));

// 4. Mock Service APIs
const {
  mockDistricts,
  mockStands,
  mockRoutes,
  mockDirectionDetail70Outbound,
  mockDirectionDetail70Inbound
} = vi.hoisted(() => {
  const mockDistricts = [
    {
      id: 'backend-mdu-123',
      code: 'MDU',
      nameEn: 'Madurai',
      nameTa: 'மதுரை',
      headquarters: 'Madurai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'backend-cbe-456',
      code: 'CBE',
      nameEn: 'Coimbatore',
      nameTa: 'கோயம்புத்தூர்',
      headquarters: 'Coimbatore',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockStands = [
    {
      id: 'stand-mgr',
      districtId: 'backend-mdu-123',
      code: 'MDU-MGR',
      nameEn: 'Mattuthavani',
      nameTa: 'மாட்டுத்தாவணி',
      location: { type: 'Point' as const, coordinates: [78.1633, 9.9472] as [number, number] },
      standType: 'INTERCITY_TERMINAL',
      totalPlatforms: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stand-per',
      districtId: 'backend-mdu-123',
      code: 'MDU-PER',
      nameEn: 'Periyar Bus Stand',
      nameTa: 'பெரியார் பேருந்து நிலையம்',
      location: { type: 'Point' as const, coordinates: [78.1132, 9.9168] as [number, number] },
      standType: 'TOWN_STAND',
      totalPlatforms: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockRoutes = [
    {
      id: 'route-70',
      routeNumber: '70',
      displayTitleEn: 'Mattuthavani to Periyar Bus Stand',
      displayTitleTa: 'மாட்டுத்தாவணி - பெரியார்',
      serviceCategory: 'TOWN_SERVICE',
      directions: [
        {
          id: 'dir-70-outbound',
          directionCode: 'OUTBOUND' as const,
          totalDistanceKm: 7.6,
          estimatedDurationMins: 24,
          originStopId: 'stop-mgr',
          destinationStopId: 'stop-per',
          stopSequenceAtStand: 1
        },
        {
          id: 'dir-70-inbound',
          directionCode: 'INBOUND' as const,
          totalDistanceKm: 7.6,
          estimatedDurationMins: 24,
          originStopId: 'stop-per',
          destinationStopId: 'stop-mgr',
          stopSequenceAtStand: 7
        }
      ]
    }
  ];

  const mockDirectionDetail70Outbound = {
    route: {
      id: 'route-70',
      routeNumber: '70',
      displayTitleEn: 'Mattuthavani to Periyar Bus Stand',
      displayTitleTa: 'மாட்டுத்தாவணி - பெரியார்',
      serviceCategory: 'TOWN_SERVICE'
    },
    direction: {
      id: 'dir-70-outbound',
      directionCode: 'OUTBOUND' as const,
      totalDistanceKm: 7.6,
      estimatedDurationMins: 24,
      originStopId: 'stop-mgr',
      destinationStopId: 'stop-per',
      routePolyline: {
        type: 'LineString',
        coordinates: [
          [78.1633, 9.9472],
          [78.1400, 9.9300],
          [78.1132, 9.9168]
        ]
      },
      stopsCount: 3,
      stops: [
        {
          sequenceOrder: 1,
          distanceFromOriginKm: 0,
          estimatedTimeMins: 0,
          isStage: true,
          stop: {
            id: 'stop-mgr',
            code: 'MDU-STOP-01',
            nameEn: 'Mattuthavani Terminal',
            nameTa: 'மாட்டுத்தாவணி முனையம்',
            location: { type: 'Point' as const, coordinates: [78.1633, 9.9472] as [number, number] }
          }
        },
        {
          sequenceOrder: 2,
          distanceFromOriginKm: 3.5,
          estimatedTimeMins: 11,
          isStage: false,
          stop: {
            id: 'stop-gor',
            code: 'MDU-STOP-02',
            nameEn: 'Goripalayam Junction',
            nameTa: 'கோரிப்பாளையம் சந்திப்பு',
            location: { type: 'Point' as const, coordinates: [78.1400, 9.9300] as [number, number] }
          }
        },
        {
          sequenceOrder: 3,
          distanceFromOriginKm: 7.6,
          estimatedTimeMins: 24,
          isStage: true,
          stop: {
            id: 'stop-per',
            code: 'MDU-STOP-03',
            nameEn: 'Periyar Bus Stand',
            nameTa: 'பெரியார் பேருந்து நிலையம்',
            location: { type: 'Point' as const, coordinates: [78.1132, 9.9168] as [number, number] }
          }
        }
      ]
    }
  };

  const mockDirectionDetail70Inbound = {
    route: {
      id: 'route-70',
      routeNumber: '70',
      displayTitleEn: 'Periyar to Mattuthavani',
      displayTitleTa: 'பெரியார் - மாட்டுத்தாவணி',
      serviceCategory: 'TOWN_SERVICE'
    },
    direction: {
      id: 'dir-70-inbound',
      directionCode: 'INBOUND' as const,
      totalDistanceKm: 7.6,
      estimatedDurationMins: 24,
      originStopId: 'stop-per',
      destinationStopId: 'stop-mgr',
      routePolyline: {
        type: 'LineString',
        coordinates: [
          [78.1132, 9.9168],
          [78.1400, 9.9300],
          [78.1633, 9.9472]
        ]
      },
      stopsCount: 3,
      stops: [
        {
          sequenceOrder: 1,
          distanceFromOriginKm: 0,
          estimatedTimeMins: 0,
          isStage: true,
          stop: {
            id: 'stop-per',
            code: 'MDU-STOP-03',
            nameEn: 'Periyar Bus Stand',
            nameTa: 'பெரியார் பேருந்து நிலையம்',
            location: { type: 'Point' as const, coordinates: [78.1132, 9.9168] as [number, number] }
          }
        },
        {
          sequenceOrder: 2,
          distanceFromOriginKm: 4.1,
          estimatedTimeMins: 13,
          isStage: false,
          stop: {
            id: 'stop-gor',
            code: 'MDU-STOP-02',
            nameEn: 'Goripalayam Junction',
            nameTa: 'கோரிப்பாளையம் சந்திப்பு',
            location: { type: 'Point' as const, coordinates: [78.1400, 9.9300] as [number, number] }
          }
        },
        {
          sequenceOrder: 3,
          distanceFromOriginKm: 7.6,
          estimatedTimeMins: 24,
          isStage: true,
          stop: {
            id: 'stop-mgr',
            code: 'MDU-STOP-01',
            nameEn: 'Mattuthavani Terminal',
            nameTa: 'மாட்டுத்தாவணி முனையம்',
            location: { type: 'Point' as const, coordinates: [78.1633, 9.9472] as [number, number] }
          }
        }
      ]
    }
  };

  return {
    mockDistricts,
    mockStands,
    mockRoutes,
    mockDirectionDetail70Outbound,
    mockDirectionDetail70Inbound
  };
});

vi.mock('../src/services/api/districts.service', () => ({
  districtsService: {
    getDistricts: vi.fn().mockResolvedValue({ success: true, data: mockDistricts })
  }
}));

vi.mock('../src/features/routes/services/routeService', () => ({
  routeService: {
    getRoutesForDistrict: vi.fn().mockResolvedValue(mockRoutes)
  }
}));

vi.mock('../src/features/map/services/mapDataService', () => ({
  mapDataService: {
    getDistrictBusStands: vi.fn().mockResolvedValue(mockStands),
    getNearbyBusStands: vi.fn().mockResolvedValue([]),
    getRouteDirectionDetails: vi.fn().mockImplementation((_routeId: string, directionId: string) => {
      if (directionId === 'dir-70-inbound') {
        return Promise.resolve(mockDirectionDetail70Inbound);
      }
      return Promise.resolve(mockDirectionDetail70Outbound);
    }),
    getRoutesServingBusStand: vi.fn().mockResolvedValue([]),
    getActiveTrips: vi.fn().mockResolvedValue([]),
    getRegisteredBuses: vi.fn().mockResolvedValue([])
  }
}));

function renderMapPage(initialEntries = ['/map?district=mdu']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            <Route path="/map" element={<LiveMapPage />} />
            <Route path="/routes/:routeId" element={<LiveMapPage />} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe('PERUNDHU Step 8 — Live Interactive Map & TypeScript Stabilization', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    safeSetItem(STORAGE_KEYS.LANGUAGE, 'en');

    const { districtsService } = await import('../src/services/api/districts.service');
    vi.mocked(districtsService.getDistricts).mockResolvedValue({
      success: true,
      data: mockDistricts
    } as any);

    const { routeService } = await import('../src/features/routes/services/routeService');
    vi.mocked(routeService.getRoutesForDistrict).mockResolvedValue(mockRoutes as any);

    const { mapDataService } = await import('../src/features/map/services/mapDataService');
    vi.mocked(mapDataService.getDistrictBusStands).mockResolvedValue(mockStands as any);
    vi.mocked(mapDataService.getNearbyBusStands).mockResolvedValue([]);
    vi.mocked(mapDataService.getRouteDirectionDetails).mockImplementation((_routeId: string, directionId: string) => {
      if (directionId === 'dir-70-inbound') {
        return Promise.resolve(mockDirectionDetail70Inbound as any);
      }
      return Promise.resolve(mockDirectionDetail70Outbound as any);
    });
    vi.mocked(mapDataService.getRoutesServingBusStand).mockResolvedValue([]);
    vi.mocked(mapDataService.getActiveTrips).mockResolvedValue([]);
    vi.mocked(mapDataService.getRegisteredBuses).mockResolvedValue([]);
  });

  describe('A. Map Page Rendering', () => {
    it('renders live map page without crashing, displaying brand title, back button and container', async () => {
      renderMapPage(['/map?district=mdu']);

      expect(screen.getByText('PERUNDHU')).toBeInTheDocument();
      expect(screen.getByText('பேருந்து')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Back to Dashboard/i })).toBeInTheDocument();
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('renders primary map controls, floating search bar and district context pill', async () => {
      renderMapPage(['/map?district=mdu']);

      // Floating search input placeholder
      expect(screen.getByPlaceholderText(/Search bus stands, stops, or routes/i)).toBeInTheDocument();

      // District context pill shows Madurai
      await waitFor(() => {
        expect(screen.getByText(/Madurai/i)).toBeInTheDocument();
      });

      // Layer selector button
      expect(screen.getByRole('button', { name: /Standard Street Map/i })).toBeInTheDocument();
    });

    it('displays non-pilot expansion notice banner when viewing an expansion district', async () => {
      renderMapPage(['/map?district=cbe']);

      await waitFor(() => {
        expect(screen.getByText(/scheduled for statewide rollout/i)).toBeInTheDocument();
      });

      // Shows switch back to Madurai pilot corridor button
      expect(screen.getByRole('button', { name: /Switch to Madurai Pilot/i })).toBeInTheDocument();
    });
  });

  describe('B. Route and Direction Parameters', () => {
    it('reads routeId and directionId parameters and renders route title and itinerary', async () => {
      renderMapPage(['/routes/route-70?district=mdu&directionId=dir-70-outbound']);

      await waitFor(() => {
        // Route number context pill
        expect(screen.getAllByText(/Route 70/i).length).toBeGreaterThan(0);
        // Route title in summary section or route pill
        expect(screen.getAllByText(/Mattuthavani to Periyar Bus Stand/i).length).toBeGreaterThan(0);
      });

      // Switch to stops tab to inspect the sequence itinerary
      const stopsTab = screen.getByRole('tab', { name: /Stops/i });
      fireEvent.click(stopsTab);

      // Ordered stops from route geometry
      await waitFor(() => {
        expect(screen.getAllByText(/Mattuthavani Terminal/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Goripalayam Junction/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Periyar Bus Stand/i).length).toBeGreaterThan(0);
      });
    });

    it('reads inbound direction parameter and loads inbound route details', async () => {
      renderMapPage(['/routes/route-70?district=mdu&directionId=dir-70-inbound']);

      await waitFor(() => {
        expect(screen.getAllByText(/Route 70/i).length).toBeGreaterThan(0);
      });

      const { mapDataService } = await import('../src/features/map/services/mapDataService');
      expect(mapDataService.getRouteDirectionDetails).toHaveBeenCalledWith(
        'route-70',
        'dir-70-inbound'
      );
    });

    it('falls back to first direction when directionId is missing from query params', async () => {
      renderMapPage(['/routes/route-70?district=mdu']);

      await waitFor(() => {
        expect(screen.getAllByText(/Route 70/i).length).toBeGreaterThan(0);
      });

      const { mapDataService } = await import('../src/features/map/services/mapDataService');
      // Defaults to dir-70-outbound from route metadata
      expect(mapDataService.getRouteDirectionDetails).toHaveBeenCalledWith(
        'route-70',
        'dir-70-outbound'
      );
    });
  });

  describe('C. Language Switching', () => {
    it('toggles language between English and Tamil, updating visible text immediately', async () => {
      renderMapPage(['/map?district=mdu']);

      // Initially in English
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();

      // Language button shows Tamil toggle option
      const langButton = screen.getByRole('button', { name: /Switch Language/i });
      expect(langButton).toHaveTextContent('தமிழ்');

      // Click to toggle to Tamil
      fireEvent.click(langButton);

      await waitFor(() => {
        expect(screen.getByText('முகப்பு பலகைக்குத் திரும்பு')).toBeInTheDocument();
        expect(langButton).toHaveTextContent('English');
      });

      // Click again to toggle back to English
      fireEvent.click(langButton);

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
        expect(langButton).toHaveTextContent('தமிழ்');
      });
    });
  });

  describe('D. Loading, Empty, and Error States', () => {
    it('handles route API error gracefully without crashing', async () => {
      const { mapDataService } = await import('../src/features/map/services/mapDataService');
      vi.mocked(mapDataService.getRouteDirectionDetails).mockRejectedValueOnce(
        new Error('Network timeout fetching corridor polyline')
      );

      renderMapPage(['/routes/route-70?district=mdu']);

      await waitFor(() => {
        expect(screen.getByText(/Network timeout fetching corridor polyline/i)).toBeInTheDocument();
      });

      // Map container remains intact
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('renders cleanly when no route is selected (district overview mode)', async () => {
      renderMapPage(['/map?district=mdu']);

      // No route selected pill
      expect(screen.queryByText(/Route 70/i)).not.toBeInTheDocument();

      // Bus stands are still queried and rendered
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });
    });
  });

  describe('E. Bus Stands and Stops', () => {
    it('renders bus stand markers for the surveyed Madurai corridor', async () => {
      renderMapPage(['/map?district=mdu']);

      await waitFor(() => {
        const markers = screen.getAllByTestId('map-marker');
        expect(markers.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('switches to nearby tab and selects bus stand when explore routes action is triggered', async () => {
      renderMapPage(['/map?district=mdu']);

      await waitFor(() => {
        expect(screen.getByText(/Mattuthavani/i)).toBeInTheDocument();
      });

      // Find the explore routes button for a stand popup
      const exploreButtons = screen.getAllByRole('button', { name: /View Routes from this Stand/i });
      expect(exploreButtons.length).toBeGreaterThan(0);

      // Trigger exploration
      fireEvent.click(exploreButtons[0]);

      // Nearby stands tab header should be present
      await waitFor(() => {
        expect(screen.getByText(/Nearby Bus Stands/i)).toBeInTheDocument();
      });
    });
  });
});
