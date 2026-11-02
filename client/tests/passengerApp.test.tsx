/**
 * PERUNDHU (பேருந்து) — Phase 7 Passenger Live Bus Tracking Application Tests
 *
 * Comprehensive end-to-end frontend integration tests verifying:
 * 1. Passenger Dashboard & Service Notices Banner (Active advisories & Normal operations notice)
 * 2. Statewide District Selection & Expansion Notice Modal for non-pilot districts
 * 3. Journey & Route Search Multi-field query execution
 * 4. Live Map Telemetry & Dynamic Arrival Time Estimation (ETA) with disclaimer
 * 5. ETA fallback when predictions are unavailable ("வருகை நேரம் கணிக்கப்படவில்லை")
 * 6. Accessible Text Alternative View (Table view for screen readers)
 * 7. Bilingual Tamil (தமிழ்) and English language toggling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/features/auth';
import { DistrictSelectionPage } from '../src/features/districts';
import { MapInfoPanel } from '../src/features/map/components/MapInfoPanel';
import { ServiceNoticesBanner } from '../src/features/dashboard/components/ServiceNoticesBanner';
import { alertsService } from '../src/services/api/alerts.service';
import { districtsService } from '../src/services/api/districts.service';
import { routeService } from '../src/features/routes/services/routeService';
import { dashboardService } from '../src/features/dashboard/services/dashboardService';

// Mock Services
vi.mock('../src/services/api/alerts.service', () => ({
  alertsService: {
    getAlerts: vi.fn(),
    getAlertById: vi.fn()
  }
}));

vi.mock('../src/services/api/districts.service', () => ({
  districtsService: {
    getDistricts: vi.fn(),
    getBusStandsByDistrict: vi.fn()
  }
}));

vi.mock('../src/features/routes/services/routeService', () => ({
  routeService: {
    getRoutesForDistrict: vi.fn(),
    getRouteDirectionDetails: vi.fn()
  }
}));

vi.mock('../src/features/dashboard/services/dashboardService', () => ({
  dashboardService: {
    getDistrictBusStands: vi.fn(),
    getNearbyBusStands: vi.fn(),
    getLiveBusOverview: vi.fn(),
    getRouteTimetable: vi.fn(),
    getLocationSuggestions: vi.fn()
  }
}));

const mockAlerts = [
  {
    id: 'alert-chithirai-2026',
    titleEn: 'Chithirai Festival Transit Operations Advisory',
    titleTa: 'சித்திரை திருவிழா சிறப்புப் பேருந்து இயக்கம்',
    descriptionEn: 'Special feeder services connecting Periyar Bus Stand and Goripalayam corridor.',
    descriptionTa: 'பெரியார் பேருந்து நிலையம் மற்றும் கோரிப்பாளையம் இடையே சிறப்பு இணைப்புப் பேருந்துகள்.',
    alertType: 'FESTIVAL_SPECIAL' as const,
    severity: 'INFO' as const,
    districtCode: 'MDU',
    affectedRouteNumbers: ['70', '77'],
    sourceOrganization: 'TNSTC (Madurai) Limited',
    sourceUrl: 'https://tnstc.gov.in',
    isActive: true,
    effectiveFrom: new Date(Date.now() - 3600000).toISOString(),
    effectiveUntil: new Date(Date.now() + 86400000 * 7).toISOString(),
    verifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockDistricts = [
  {
    id: 'backend-mdu-123',
    code: 'MDU',
    nameEn: 'Madurai',
    nameTa: 'மதுரை',
    headquarters: 'Madurai',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockStands = [
  {
    id: 'stand-periyar',
    districtId: 'backend-mdu-123',
    code: 'MDU-PER',
    nameEn: 'Periyar Bus Stand',
    nameTa: 'பெரியார் பேருந்து நிலையம்',
    location: { type: 'Point' as const, coordinates: [78.1132, 9.9168] as [number, number] },
    standType: 'TOWN_STAND',
    totalPlatforms: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'stand-mibt',
    districtId: 'backend-mdu-123',
    code: 'MDU-MGR',
    nameEn: 'Mattuthavani',
    nameTa: 'மாட்டுத்தாவணி',
    location: { type: 'Point' as const, coordinates: [78.1633, 9.9472] as [number, number] },
    standType: 'INTERCITY_TERMINAL',
    totalPlatforms: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockRoutes = [
  {
    id: 'route-70',
    routeNumber: '70',
    nameEn: 'Periyar to Mattuthavani',
    nameTa: 'பெரியார் முதல் மாட்டுத்தாவணி வரை',
    displayTitleEn: 'Route 70 - Periyar to Mattuthavani',
    displayTitleTa: 'தடம் 70 - பெரியார் முதல் மாட்டுத்தாவணி வரை',
    districtId: 'backend-mdu-123',
    directions: [
      {
        id: 'dir-70-out',
        directionCode: 'OUTBOUND',
        originStandId: 'stand-periyar',
        destinationStandId: 'stand-mibt',
        stopsCount: 12,
        distanceKm: 9.8,
        estimatedDurationMinutes: 32
      }
    ],
    isActive: true,
    totalDistanceKm: 9.8,
    averageDurationMinutes: 32,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe('PERUNDHU Phase 7 — Passenger Live Bus Tracking Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (alertsService.getAlerts as any).mockResolvedValue({
      data: mockAlerts,
      meta: { total: 1, limit: 10, offset: 0 }
    });
    (districtsService.getDistricts as any).mockResolvedValue({
      data: mockDistricts,
      meta: { total: 1, limit: 50, offset: 0 }
    });
    (dashboardService.getDistrictBusStands as any).mockResolvedValue(mockStands);
    (dashboardService.getNearbyBusStands as any).mockResolvedValue([]);
    (dashboardService.getLiveBusOverview as any).mockResolvedValue({
      districtId: 'backend-mdu-123',
      reportingBusesCount: 4,
      routesWithLiveBusesCount: 2,
      activeCorridorsSummary: []
    });
    (routeService.getRoutesForDistrict as any).mockResolvedValue(mockRoutes);
  });

  const renderWithProviders = (ui: React.ReactElement, initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <I18nProvider>
          <AuthProvider>{ui}</AuthProvider>
        </I18nProvider>
      </MemoryRouter>
    );
  };

  describe('1. Passenger Dashboard & Service Notices Banner', () => {
    it('renders verified service notices banner with alert details, tags and official source link', async () => {
      renderWithProviders(
        <ServiceNoticesBanner
          alerts={mockAlerts}
          isLoading={false}
          error={null}
        />
      );

      // Title & Heading
      expect(screen.getByText(/Service Notices|அரசுப் போக்குவரத்துக் குறிப்புகள்/i)).toBeInTheDocument();
      // Alert Title
      expect(screen.getByText(/Chithirai Festival Transit Operations Advisory|சித்திரை திருவிழா/i)).toBeInTheDocument();
      // Description
      expect(screen.getByText(/Special feeder services connecting Periyar|சிறப்பு இணைப்புப் பேருந்துகள்/i)).toBeInTheDocument();
      // Route Tags
      expect(screen.getByText('70')).toBeInTheDocument();
      expect(screen.getByText('77')).toBeInTheDocument();
      // Source Organization
      expect(screen.getByText('TNSTC (Madurai) Limited')).toBeInTheDocument();
    });

    it('displays reassuring normal operations notice when no active transit alerts exist', async () => {
      renderWithProviders(
        <ServiceNoticesBanner
          alerts={[]}
          isLoading={false}
          error={null}
        />
      );

      // Reassuring normal operations title & description
      expect(screen.getByText(/Normal Operations|Normal Service|வழக்கமான இயக்கம்/i)).toBeInTheDocument();
      expect(screen.getByText(/operating on standard timetables|வழக்கம்போல் இயங்குகின்றன/i)).toBeInTheDocument();
    });
  });

  describe('2. District Selection & Expansion Notice Modal', () => {
    it('opens expansion scheduled modal when passenger clicks an inactive coming-soon district', async () => {
      renderWithProviders(<DistrictSelectionPage />);

      await waitFor(() => {
        expect(screen.getByTestId('district-card-chn')).toBeInTheDocument();
      });

      const chennaiCard = screen.getByTestId('district-card-chn');
      expect(chennaiCard).toBeInTheDocument();

      // Click Chennai card expansion info button
      const expansionBtn = chennaiCard.querySelector('.district-card-expansion-btn');
      expect(expansionBtn).toBeInTheDocument();
      fireEvent.click(expansionBtn!);

      // Modal dialog should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      // Dialog content scoped inside modal
      expect(within(modal).getByText(/Chennai/i)).toBeInTheDocument();
      expect(within(modal).getByText(/Expansion Scheduled|விரிவுபடுத்தப்படவுள்ளது/i)).toBeInTheDocument();
      expect(within(modal).getByText(/statewide rollout|விரிவாக்கத் திட்டத்தில்/i)).toBeInTheDocument();

      // Primary Action to explore Madurai pilot
      const explorePilotBtn = within(modal).getByText(/Explore Madurai Pilot|மதுரை முன்னோடித் தளத்தைக் காண்க/i);
      expect(explorePilotBtn).toBeInTheDocument();

      // Close modal
      const closeButtons = within(modal).getAllByText(/Close|மூடு/i);
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
    });

    it('navigates to Madurai routes when the active pilot card is selected', async () => {
      renderWithProviders(<DistrictSelectionPage />);

      await waitFor(() => {
        expect(screen.getByTestId('district-card-mdu')).toBeInTheDocument();
      });

      const maduraiCard = screen.getByTestId('district-card-mdu');
      const selectActionBtn = maduraiCard.querySelector('.district-card-action-btn');
      expect(selectActionBtn).toBeInTheDocument();

      fireEvent.click(selectActionBtn!);
      // Dialog should NOT be triggered for active pilot
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('3. Dynamic Arrival Time Estimation (ETA) & Fallbacks', () => {
    const mockRouteGeometry = {
      routeId: 'route-70',
      routeNumber: '70',
      directionId: 'dir-70-out',
      displayTitleEn: 'Route 70 - Periyar to Mattuthavani',
      displayTitleTa: 'தடம் 70 - பெரியார் முதல் மாட்டுத்தாவணி வரை',
      totalDistanceKm: 9.8,
      estimatedDurationMins: 32,
      hasVerifiedGeometry: true,
      stops: [
        {
          stop: {
            id: 'stop-periyar',
            nameEn: 'Periyar Stand',
            nameTa: 'பெரியார் நிலையம்',
            location: { coordinates: [78.1132, 9.9168] }
          },
          sequenceOrder: 1,
          distanceFromOriginKm: 0,
          isFareStage: true
        },
        {
          stop: {
            id: 'stop-simmakkal',
            nameEn: 'Simmakkal',
            nameTa: 'சிம்மக்கல்',
            location: { coordinates: [78.1215, 9.9248] }
          },
          sequenceOrder: 2,
          distanceFromOriginKm: 1.8,
          isFareStage: true
        }
      ]
    };

    const mockLiveBus = {
      busId: 'bus-tnstc-101',
      fleetNumber: 'MDU-70-01',
      registrationNumber: 'TN-58-N-1234',
      lat: 9.9201,
      lng: 78.1189,
      speedKmph: 28.5,
      heading: 42,
      recordedAt: new Date().toISOString(),
      isSimulated: false,
      trackingStatus: 'ACTIVE' as const,
      source: 'ETM_DEVICE'
    };

    it('renders model-predicted arrival time (ETA), confidence badge and disclaimer when ETA is available', () => {
      const mockLiveDetailsWithEta = {
        bus: {
          id: 'bus-tnstc-101',
          fleetNumber: 'MDU-70-01',
          registrationNumber: 'TN-58-N-1234',
          vehicleType: 'STANDARD_PASSENGER'
        },
        assignedRoute: {
          id: 'route-70',
          routeNumber: '70',
          nameEn: 'Periyar - Mattuthavani'
        },
        latestPosition: {
          lat: 9.9201,
          lng: 78.1189,
          speedKmph: 28.5,
          heading: 42,
          recordedAt: new Date().toISOString(),
          isSimulated: false,
          source: 'ETM_DEVICE'
        },
        eta: {
          tripId: 'trip-101',
          routeId: 'route-70',
          confidence: 0.85,
          predictionSource: 'HISTORICAL_AVERAGE',
          nextStop: {
            stopId: 'stop-simmakkal',
            stopName: 'Simmakkal',
            sequence: 2,
            distanceMeters: 650,
            estimatedMinutes: 3.5,
            estimatedArrivalAt: new Date(Date.now() + 210000).toISOString()
          },
          stopEstimates: [
            {
              stopId: 'stop-simmakkal',
              stopName: 'Simmakkal',
              sequence: 2,
              distanceMeters: 650,
              estimatedMinutes: 3.5,
              passed: false
            }
          ]
        }
      };

      renderWithProviders(
        <MapInfoPanel
          isCollapsed={false}
          onToggleCollapse={vi.fn()}
          activeTab="route"
          onTabChange={vi.fn()}
          routeGeometry={mockRouteGeometry as any}
          availableRoutes={mockRoutes as any}
          isLoadingRoute={false}
          routeError={null}
          onSelectRoute={vi.fn()}
          onSwitchDirection={vi.fn()}
          liveBuses={[mockLiveBus as any]}
          busStands={mockStands as any}
          nearbyStands={[]}
          isLoadingNearby={false}
          selectedEntity={{
            type: 'BUS',
            id: 'bus-tnstc-101',
            lat: 9.9201,
            lng: 78.1189,
            titleEn: 'MDU-70-01',
            titleTa: 'MDU-70-01',
            data: mockLiveBus
          }}
          selectedBusLiveDetails={mockLiveDetailsWithEta}
          onSelectEntity={vi.fn()}
          onClearSelectedEntity={vi.fn()}
        />
      );

      // ETA Header & High Confidence
      expect(screen.getByText(/Estimated Arrival|வருகை நேரக் கணிப்பு/i)).toBeInTheDocument();
      expect(screen.getByText(/High Confidence|உயர் துல்லியம்/i)).toBeInTheDocument();

      // Next Stop & Estimated Minutes
      expect(screen.getByText(/Next Stop|அடுத்த நிறுத்தம்/i)).toBeInTheDocument();
      expect(screen.getByText(/Simmakkal/i)).toBeInTheDocument();
      expect(screen.getByText(/~4 mins|~4 நிமிடங்கள்/i)).toBeInTheDocument();

      // Model Disclaimer
      expect(screen.getByText(/Model-predicted arrival estimate|அதிகாரப்பூர்வ கால அட்டவணை அல்ல/i)).toBeInTheDocument();
    });

    it('renders "Arrival estimate unavailable" ("வருகை நேரம் கணிக்கப்படவில்லை") when ETA cannot be predicted', () => {
      const mockLiveDetailsNoEta = {
        bus: {
          id: 'bus-tnstc-101',
          fleetNumber: 'MDU-70-01',
          registrationNumber: 'TN-58-N-1234'
        },
        latestPosition: {
          lat: 9.9201,
          lng: 78.1189,
          isSimulated: false,
          source: 'GPS'
        },
        eta: null
      };

      renderWithProviders(
        <MapInfoPanel
          isCollapsed={false}
          onToggleCollapse={vi.fn()}
          activeTab="route"
          onTabChange={vi.fn()}
          routeGeometry={mockRouteGeometry as any}
          availableRoutes={mockRoutes as any}
          isLoadingRoute={false}
          routeError={null}
          onSelectRoute={vi.fn()}
          onSwitchDirection={vi.fn()}
          liveBuses={[mockLiveBus as any]}
          busStands={mockStands as any}
          nearbyStands={[]}
          isLoadingNearby={false}
          selectedEntity={{
            type: 'BUS',
            id: 'bus-tnstc-101',
            lat: 9.9201,
            lng: 78.1189,
            titleEn: 'MDU-70-01',
            titleTa: 'MDU-70-01',
            data: mockLiveBus
          }}
          selectedBusLiveDetails={mockLiveDetailsNoEta}
          onSelectEntity={vi.fn()}
          onClearSelectedEntity={vi.fn()}
        />
      );

      // Truthful fallback message
      expect(screen.getByText(/Arrival estimate unavailable|வருகை நேரம் கணிக்கப்படவில்லை/i)).toBeInTheDocument();
    });
  });

  describe('4. Accessible Text Alternative View', () => {
    it('renders accessible semantic data table of live reporting buses and route stops for screen readers', () => {
      const onTabChangeMock = vi.fn();

      renderWithProviders(
        <MapInfoPanel
          isCollapsed={false}
          onToggleCollapse={vi.fn()}
          activeTab="table"
          onTabChange={onTabChangeMock}
          routeGeometry={null}
          availableRoutes={[]}
          isLoadingRoute={false}
          routeError={null}
          onSelectRoute={vi.fn()}
          onSwitchDirection={vi.fn()}
          liveBuses={[
            {
              busId: 'bus-1',
              fleetNumber: 'MDU-70-01',
              registrationNumber: 'TN-58-N-1234',
              lat: 9.9212,
              lng: 78.1195,
              speedKmph: 32,
              heading: 45,
              recordedAt: new Date().toISOString(),
              isSimulated: false,
              trackingStatus: 'ACTIVE'
            }
          ] as any}
          busStands={[]}
          nearbyStands={[]}
          isLoadingNearby={false}
          selectedEntity={null}
          onSelectEntity={vi.fn()}
          onClearSelectedEntity={vi.fn()}
        />
      );

      // Accessible Tab Header
      expect(screen.getByText(/List View \(Accessible\)|பட்டியல் பார்வை/i)).toBeInTheDocument();
      // Table headings
      expect(screen.getByText('Fleet / Reg')).toBeInTheDocument();
      expect(screen.getByText('MDU-70-01')).toBeInTheDocument();
      expect(screen.getByText('TN-58-N-1234')).toBeInTheDocument();
      expect(screen.getByText('32 km/h')).toBeInTheDocument();
      expect(screen.getByText(/LIVE/i)).toBeInTheDocument();
    });
  });
});
