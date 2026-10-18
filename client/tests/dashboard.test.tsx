/**
 * PERUNDHU (பேருந்து) — Step 6 Home Dashboard Test Suite
 * Tests UI rendering, backend integration, geolocation lifecycle,
 * timetable modal, search validation, and bilingual switching.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import { AuthProvider } from '../src/features/auth';
import { DashboardPage } from '../src/features/dashboard';
import { dashboardService } from '../src/features/dashboard/services/dashboardService';
import { districtsService } from '../src/services/api/districts.service';
import { routeService } from '../src/features/routes/services/routeService';
import * as geolocationModule from '../src/features/location/geolocation';

// Mock Services
vi.mock('../src/features/dashboard/services/dashboardService', () => ({
  dashboardService: {
    getDistrictBusStands: vi.fn(),
    getNearbyBusStands: vi.fn(),
    getLiveBusOverview: vi.fn(),
    getRouteTimetable: vi.fn(),
    getLocationSuggestions: vi.fn()
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
    totalPlatforms: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockNearbyStands = [
  {
    ...mockStands[1],
    distanceMeters: 1200
  },
  {
    ...mockStands[0],
    distanceMeters: 5400
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
      }
    ],
    servingBusStands: ['Mattuthavani', 'Periyar Bus Stand']
  }
];

const mockRoute70Detail = {
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
    stopsCount: 7,
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
          location: { type: 'Point' as const, coordinates: [78.1633, 9.9472] as [number, number] }
        }
      },
      {
        sequenceOrder: 7,
        distanceFromOriginKm: 7.6,
        cumulativeDurationMinutes: 24,
        isFareStage: true,
        stop: {
          id: 'stop-per',
          code: 'STP-MDU-PER',
          nameEn: 'Periyar Bus Stand',
          nameTa: 'பெரியார் பேருந்து நிலையம்',
          location: { type: 'Point' as const, coordinates: [78.1132, 9.9168] as [number, number] }
        }
      }
    ]
  }
};

const mockLiveOverview = {
  activeTripsCount: 0,
  registeredFleetCount: 3,
  reportingBusesCount: 0,
  isSimulatedSource: false,
  buses: [
    {
      id: 'bus-1',
      registrationNumber: 'TN-58-N-1980',
      fleetNumber: 'MDU-PRY-045',
      depotName: 'Periyar Depot',
      vehicleType: 'ORDINARY_NON_AC' as const,
      status: 'IN_SERVICE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  lastCheckedTime: '10:00:00 AM'
};

const mockTimetable = {
  routeId: 'route-70',
  routeNumber: '70',
  dayOfWeek: 'ALL',
  outbound: [
    {
      tripId: 'trip-out-0800',
      tripCode: 'TRIP-70-OUT-0800',
      departureTime: '08:00',
      arrivalTime: '08:24',
      status: 'SCHEDULED' as const
    }
  ],
  inbound: [
    {
      tripId: 'trip-in-0845',
      tripCode: 'TRIP-70-IN-0845',
      departureTime: '08:45',
      arrivalTime: '09:09',
      status: 'SCHEDULED' as const
    }
  ]
};

function renderDashboard(initialEntries: string[] = ['/dashboard']) {
  return render(
    <I18nProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <DashboardPage />
        </MemoryRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

describe('PERUNDHU Step 6 — Complete Home Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(districtsService.getDistricts).mockResolvedValue({
      data: mockDistricts,
      pagination: { total: 1, page: 1, limit: 50, totalPages: 1, hasNextPage: false, hasPrevPage: false }
    });

    vi.mocked(routeService.getRoutesForDistrict).mockResolvedValue(mockRoutes);
    vi.mocked(routeService.getRouteDirectionDetails).mockResolvedValue(mockRoute70Detail);
    vi.mocked(dashboardService.getDistrictBusStands).mockResolvedValue(mockStands);
    vi.mocked(dashboardService.getLiveBusOverview).mockResolvedValue(mockLiveOverview);
    vi.mocked(dashboardService.getRouteTimetable).mockResolvedValue(mockTimetable);
    vi.mocked(dashboardService.getLocationSuggestions).mockResolvedValue([
      { id: 'stand-mgr', code: 'MDU-MGR', nameEn: 'Mattuthavani', nameTa: 'மாட்டுத்தாவணி', type: 'BUS_STAND' },
      { id: 'stand-per', code: 'MDU-PER', nameEn: 'Periyar Bus Stand', nameTa: 'பெரியார் பேருந்து நிலையம்', type: 'BUS_STAND' }
    ]);
  });

  describe('6.1 Dashboard Header & Branding', () => {
    it('renders PERUNDHU brand, Tamil name பேருந்து, and district context pill', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('பேருந்து')).toBeInTheDocument();
        expect(screen.getByText(/PERUNDHU • TNSTC/i)).toBeInTheDocument();
      });

      // Verify district pill renders with Change button
      expect(screen.getByTestId('selected-district-pill')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Change|மாற்றுக/i })).toBeInTheDocument();
    });

    it('toggles language between Tamil and English on button click', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('பேருந்து')).toBeInTheDocument();
      });

      // Language button starts with 'English' (since default is Tamil)
      const langBtn = screen.getByRole('button', { name: /Switch to English|தமிழுக்கு மாறுக/i });
      fireEvent.click(langBtn);

      await waitFor(() => {
        expect(screen.getByText(/Where would you like to go today\?/i)).toBeInTheDocument();
      });
    });
  });

  describe('6.2 Journey Quick Search', () => {
    it('validates empty inputs and alerts passenger', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /Where would you like to go today\?|இன்று நீங்கள் எங்கு செல்ல விரும்புகிறீர்கள்\?/i
          })
        ).toBeInTheDocument();
      });

      const searchBtn = screen.getByRole('button', { name: /Search Buses|பேருந்துகளைக் கண்டறியவும்/i });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Please select both origin and destination stops|புறப்படும் மற்றும் சேரும் இடங்களைத் தேர்ந்தெடுக்கவும்/i)
        ).toBeInTheDocument();
      });
    });

    it('validates identical origin and destination', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Origin bus stand|புறப்படும் பேருந்து நிலையம்/i)).toBeInTheDocument();
      });

      const fromInput = screen.getByPlaceholderText(/Origin bus stand|புறப்படும் பேருந்து நிலையம்/i);
      const toInput = screen.getByPlaceholderText(/Destination bus stand|சேரும் பேருந்து நிலையம்/i);
      const searchBtn = screen.getByRole('button', { name: /Search Buses|பேருந்துகளைக் கண்டறியவும்/i });

      fireEvent.change(fromInput, { target: { value: 'Periyar' } });
      fireEvent.change(toInput, { target: { value: 'Periyar' } });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Origin and destination stops cannot be the same|புறப்படும் இடமும் சேருமிடமும் ஒன்றாக இருக்க முடியாது/i)
        ).toBeInTheDocument();
      });
    });

    it('swaps origin and destination when swap button is pressed', async () => {
      renderDashboard();

      const fromInput = screen.getByPlaceholderText(/Origin bus stand|புறப்படும் பேருந்து நிலையம்/i);
      const toInput = screen.getByPlaceholderText(/Destination bus stand|சேரும் பேருந்து நிலையம்/i);
      const swapBtn = screen.getByRole('button', { name: /Swap origin and destination|இடங்களை மாற்றுக/i });

      fireEvent.change(fromInput, { target: { value: 'Mattuthavani' } });
      fireEvent.change(toInput, { target: { value: 'Periyar' } });

      fireEvent.click(swapBtn);

      expect((fromInput as HTMLInputElement).value).toBe('Periyar');
      expect((toInput as HTMLInputElement).value).toBe('Mattuthavani');
    });

    it('finds direct corridor routes and displays honest multi-modal notice', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(routeService.getRoutesForDistrict).toHaveBeenCalled();
      });

      const fromInput = screen.getByPlaceholderText(/Origin bus stand|புறப்படும் பேருந்து நிலையம்/i);
      const toInput = screen.getByPlaceholderText(/Destination bus stand|சேரும் பேருந்து நிலையம்/i);
      const searchBtn = screen.getByRole('button', { name: /Search Buses|பேருந்துகளைக் கண்டறியவும்/i });

      fireEvent.change(fromInput, { target: { value: 'Mattuthavani' } });
      fireEvent.change(toInput, { target: { value: 'Periyar' } });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Direct Route Available|நேரடி பேருந்து சேவை கிடைக்கிறது/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Statewide multi-leg trip planning is scheduled|மாநில அளவிலான தானியங்கி பல அடுக்கு பயணத் திட்டம்/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('6.3 Selected Route Card & Ground Truth Metrics', () => {
    it('displays prompt to choose a route if none is selected', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(
          screen.getByText(/No route currently selected|தற்போது எந்த வழித்தடமும் தேர்ந்தெடுக்கப்படவில்லை/i)
        ).toBeInTheDocument();
      });
    });

    it('displays route details, stops count from sequence, and distance when route is selected', async () => {
      renderDashboard(['/dashboard?routeId=route-70&directionId=dir-70-outbound']);

      await waitFor(() => {
        expect(screen.getByTestId('selected-route-pill')).toBeInTheDocument();
        expect(screen.getByText('70')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/7\.6 km/i)).toBeInTheDocument();
        expect(screen.getByText(/24 mins/i)).toBeInTheDocument();
      });
    });
  });

  describe('6.4 Nearby Bus Stands with On-Demand Geolocation', () => {
    it('requests geolocation on-demand and shows genuine distance', async () => {
      vi.spyOn(geolocationModule, 'requestUserGeolocation').mockResolvedValue({
        coordinates: { lat: 9.9252, lng: 78.1198 },
        accuracyMeters: 15,
        isWithinTamilNadu: true,
        timestamp: Date.now()
      });

      vi.mocked(dashboardService.getNearbyBusStands).mockResolvedValue(mockNearbyStands);

      renderDashboard();

      await waitFor(() => {
        expect(
          screen.getAllByRole('button', { name: /Detect Nearby Bus Stands|அருகிலுள்ள நிலையங்களைக் கண்டறியவும்/i }).length
        ).toBeGreaterThan(0);
      });

      const detectBtn = screen.getAllByRole('button', {
        name: /Detect Nearby Bus Stands|அருகிலுள்ள நிலையங்களைக் கண்டறியவும்/i
      })[0];
      fireEvent.click(detectBtn);

      await waitFor(() => {
        expect(screen.getByText('1.2 km')).toBeInTheDocument();
        expect(screen.getByText('5.4 km')).toBeInTheDocument();
      });
    });

    it('handles permission denied gracefully and falls back to district bus stands', async () => {
      vi.spyOn(geolocationModule, 'requestUserGeolocation').mockRejectedValue(
        new Error('Location permission was denied.')
      );

      renderDashboard();

      const detectBtn = screen.getAllByRole('button', {
        name: /Detect Nearby Bus Stands|அருகிலுள்ள நிலையங்களைக் கண்டறியவும்/i
      })[0];
      fireEvent.click(detectBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Location Access Denied|இருப்பிட அனுமதி மறுக்கப்பட்டது/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('6.5 Live Bus Overview Ground-Truth Telemetry', () => {
    it('displays 0 reporting buses and honest message when no buses are active', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(
          screen.getByText(/No live bus locations are available for this route right now|இந்த வழித்தடத்திற்கான நேரடி பேருந்து இருப்பிடங்கள் தற்போது கிடைக்கவில்லை/i)
        ).toBeInTheDocument();
        expect(screen.getByText('STANDBY')).toBeInTheDocument();
      });
    });

    it('displays registered depot fleet chips from actual backend records', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('TN-58-N-1980')).toBeInTheDocument();
        expect(screen.getByText('(MDU-PRY-045)')).toBeInTheDocument();
      });
    });
  });

  describe('6.6 Timetables Modal & Passenger Guidance', () => {
    it('opens timetable modal and displays scheduled departures and schedule notice', async () => {
      renderDashboard(['/dashboard?routeId=route-70&directionId=dir-70-outbound']);

      await waitFor(() => {
        expect(screen.getByText('70')).toBeInTheDocument();
      });

      const timetableCard = screen.getAllByRole('button', {
        name: /Timetables|கால அட்டவணை/i
      })[0];
      fireEvent.click(timetableCard);

      await waitFor(() => {
        expect(
          screen.getByText(/Scheduled departure times reflect planned operational timetables|அட்டவணைப்படுத்தப்பட்ட புறப்பாடு நேரங்கள்/i)
        ).toBeInTheDocument();
        expect(screen.getByText('08:00')).toBeInTheDocument();
        expect(screen.getByText('08:24')).toBeInTheDocument();
      });
    });

    it('renders 5-step passenger guidance in Tamil and English', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /How to use PERUNDHU|பேருந்து செயலியை எவ்வாறு பயன்படுத்துவது\?/i
          })
        ).toBeInTheDocument();
        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText('Step 2')).toBeInTheDocument();
        expect(screen.getByText('Step 3')).toBeInTheDocument();
        expect(screen.getByText('Step 4')).toBeInTheDocument();
        expect(screen.getByText('Step 5')).toBeInTheDocument();
      });
    });
  });
});
