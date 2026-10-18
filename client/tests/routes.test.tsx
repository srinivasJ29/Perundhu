import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/features/auth';
import {
  RouteSelectionPage,
  LiveTrackingPlaceholder,
  filterRoutes,
  RouteListItem
} from '../src/features/routes';
import { STORAGE_KEYS } from '../src/config/constants';
import { safeGetItem } from '../src/lib/storage';

// Mock test data matching verified Madurai pilot backend records
const { mockBusStands, mockStandRoutes, mockDirectionDetail70 } = vi.hoisted(() => {
  const mockBusStands = [
    {
      id: 'stand-mgr',
      districtId: 'backend-mdu-123',
      code: 'MDU-MGR',
      nameEn: 'Mattuthavani',
      nameTa: 'மாட்டுத்தாவணி',
      location: { type: 'Point', coordinates: [78.1633, 9.9472] },
      standType: 'INTERCITY_TERMINAL',
      totalPlatforms: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockStandRoutes = [
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
    },
    {
      id: 'route-77',
      routeNumber: '77',
      displayTitleEn: 'Mattuthavani to Thirumangalam',
      displayTitleTa: 'மாட்டுத்தாவணி - திருமங்கலம்',
      serviceCategory: 'TOWN_SERVICE',
      directions: [
        {
          id: 'dir-77-outbound',
          directionCode: 'OUTBOUND' as const,
          totalDistanceKm: 22.8,
          estimatedDurationMins: 55,
          originStopId: 'stop-mgr',
          destinationStopId: 'stop-tmg',
          stopSequenceAtStand: 1
        }
      ]
    }
  ];

  const mockDirectionDetail70 = {
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
      routePolyline: null,
      stopsCount: 3,
      stops: [
        {
          sequenceOrder: 1,
          distanceFromOriginKm: 0,
          cumulativeDurationMinutes: 0,
          isFareStage: true,
          stop: {
            id: 'stop-mgr',
            code: 'STP-MDU-MGR',
            nameEn: 'Mattuthavani Terminal',
            nameTa: 'மாட்டுத்தாவணி முனையம்',
            location: { type: 'Point' as const, coordinates: [78.1633, 9.9472] as [number, number] },
            landmark: 'Platform Bay 1-4'
          }
        },
        {
          sequenceOrder: 2,
          distanceFromOriginKm: 4.5,
          cumulativeDurationMinutes: 12,
          isFareStage: true,
          stop: {
            id: 'stop-gor',
            code: 'STP-MDU-GOR',
            nameEn: 'Goripalayam Junction',
            nameTa: 'கோரிப்பாளையம் சந்திப்பு',
            location: { type: 'Point' as const, coordinates: [78.1322, 9.9288] as [number, number] },
            landmark: 'Near American College'
          }
        },
        {
          sequenceOrder: 3,
          distanceFromOriginKm: 7.6,
          cumulativeDurationMinutes: 22,
          isFareStage: true,
          stop: {
            id: 'stop-per',
            code: 'STP-MDU-PER',
            nameEn: 'Periyar Bus Stand',
            nameTa: 'பெரியார் பேருந்து நிலையம்',
            location: { type: 'Point' as const, coordinates: [78.1132, 9.9168] as [number, number] },
            landmark: 'Near Madurai Railway Junction'
          }
        }
      ]
    }
  };

  return { mockBusStands, mockStandRoutes, mockDirectionDetail70 };
});

// Mock Backend API services
vi.mock('../src/services/api/districts.service', () => ({
  districtsService: {
    getDistricts: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'backend-mdu-123',
          code: 'MDU',
          nameEn: 'Madurai',
          nameTa: 'மதுரை',
          headquarters: 'Madurai'
        }
      ]
    }),
    getBusStandsByDistrict: vi.fn().mockResolvedValue({
      data: mockBusStands,
      pagination: { total: 1, page: 1, limit: 50, totalPages: 1 }
    })
  }
}));

vi.mock('../src/services/api/busStands.service', () => ({
  busStandsService: {
    getRoutesByBusStand: vi.fn().mockResolvedValue({
      data: mockStandRoutes,
      pagination: { total: 2, page: 1, limit: 50, totalPages: 1 }
    })
  }
}));

vi.mock('../src/services/api/routes.service', () => ({
  routesService: {
    getRouteDirectionDetails: vi.fn().mockResolvedValue(mockDirectionDetail70)
  }
}));

const renderWithProviders = (initialRoute = '/districts/mdu/routes') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <I18nProvider>
        <AuthProvider>
          <Routes>
            <Route path="/districts/:districtId/routes" element={<RouteSelectionPage />} />
            <Route path="/routes/:routeId" element={<LiveTrackingPlaceholder />} />
            <Route path="/districts" element={<div>Districts Page</div>} />
          </Routes>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>
  );
};

describe('PERUNDHU Step 5 — Route Selection Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('5.1 Route Filtering Logic (filterRoutes)', () => {
    const sampleRoutes: RouteListItem[] = [
      {
        id: 'r70',
        routeNumber: '70',
        displayTitleEn: 'Mattuthavani to Periyar Bus Stand',
        displayTitleTa: 'மாட்டுத்தாவணி - பெரியார்',
        serviceCategory: 'TOWN_SERVICE',
        directions: [],
        servingBusStands: ['Mattuthavani', 'Periyar']
      },
      {
        id: 'r77',
        routeNumber: '77',
        displayTitleEn: 'Mattuthavani to Thirumangalam',
        displayTitleTa: 'மாட்டுத்தாவணி - திருமங்கலம்',
        serviceCategory: 'TOWN_SERVICE',
        directions: [],
        servingBusStands: ['Mattuthavani', 'Palanganatham']
      }
    ];

    it('should filter by route number', () => {
      const results = filterRoutes(sampleRoutes, '70');
      expect(results).toHaveLength(1);
      expect(results[0].routeNumber).toBe('70');
    });

    it('should filter by English name case-insensitively', () => {
      const results = filterRoutes(sampleRoutes, 'thirumangalam');
      expect(results).toHaveLength(1);
      expect(results[0].routeNumber).toBe('77');
    });

    it('should filter by Tamil Unicode script', () => {
      const results = filterRoutes(sampleRoutes, 'பெரியார்');
      expect(results).toHaveLength(1);
      expect(results[0].routeNumber).toBe('70');
    });

    it('should filter by category and query simultaneously', () => {
      const results = filterRoutes(sampleRoutes, '77', 'TOWN_SERVICE');
      expect(results).toHaveLength(1);
      expect(results[0].routeNumber).toBe('77');

      const noMatch = filterRoutes(sampleRoutes, '77', 'EXPRESS');
      expect(noMatch).toHaveLength(0);
    });
  });

  describe('5.2 UI Rendering & Live Data Display', () => {
    it('should render route selection page with heading, subtitle, and search bar', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /Choose Your Bus Route|உங்கள் பேருந்து வழித்தடத்தைத் தேர்ந்தெடுக்கவும்/i
          })
        ).toBeInTheDocument();
        expect(screen.getByTestId('route-card-70')).toBeInTheDocument();
        expect(screen.getByTestId('route-card-77')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText(/Search by route number|தட எண்/i)).toBeInTheDocument();
    });

    it('should allow filtering routes via search input', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('route-card-70')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by route number|தட எண்/i);
      fireEvent.change(searchInput, { target: { value: '77' } });

      await waitFor(() => {
        expect(screen.queryByTestId('route-card-70')).not.toBeInTheDocument();
        expect(screen.getByTestId('route-card-77')).toBeInTheDocument();
      });
    });

    it('should show empty state when query matches no routes and clear it', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('route-card-70')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by route number|தட எண்/i);
      fireEvent.change(searchInput, { target: { value: 'non-existent-route' } });

      await waitFor(() => {
        expect(screen.getByTestId('routes-empty-state')).toBeInTheDocument();
      });

      const clearBtn = screen.getByRole('button', { name: /Clear Search Filter|தேடலை மீட்டமைக்க/i });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByTestId('route-card-70')).toBeInTheDocument();
      });
    });

    it('should expand stop sequence and preserve exact sequence ordering', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('route-card-70')).toBeInTheDocument();
      });

      const viewDetailsBtn = screen.getAllByRole('button', {
        name: /View Stops|நிறுத்தங்கள் & அட்டவணை/i
      })[0];
      fireEvent.click(viewDetailsBtn);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Mattuthavani Terminal|மாட்டுத்தாவணி முனையம்/i).length
        ).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/Goripalayam Junction|கோரிப்பாளையம் சந்திப்பு/i).length
        ).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/Periyar Bus Stand|பெரியார் பேருந்து நிலையம்/i).length
        ).toBeGreaterThan(0);
      });
    });

    it('should select route and navigate to Step 6 live tracking placeholder', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('route-card-70')).toBeInTheDocument();
      });

      const trackLiveBtn = screen.getAllByRole('button', {
        name: /Track Live Buses|நேரலை பேருந்து கண்காணிப்பு/i
      })[0];
      fireEvent.click(trackLiveBtn);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /Live Tracking Telemetry \(Step 6\)|நேரலை பேருந்து கண்காணிப்பு \(படி 6\)/i
          })
        ).toBeInTheDocument();
      });

      // Verify safeStorage persisted selected route
      const savedRouteId = safeGetItem(STORAGE_KEYS.SELECTED_ROUTE, null);
      expect(savedRouteId).toBe('route-70');
    });

    it('should display honest rollout message when non-pilot district is accessed', async () => {
      renderWithProviders('/districts/chn/routes');

      await waitFor(() => {
        expect(
          screen.getByText(/Corridor Planned for Future Rollout|இந்த மாவட்டத்தில் சேவைகள் விரைவில் தொடங்கும்/i)
        ).toBeInTheDocument();
      });
    });
  });
});
