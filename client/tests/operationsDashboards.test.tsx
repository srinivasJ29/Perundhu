// @vitest-environment jsdom
/**
 * PERUNDHU (பேருந்து) — Phase 12 Admin, Depot, Driver & Conductor Dashboards Tests
 *
 * Verifies:
 * 1. Transport Administrator Dashboard (Executive Command Centre, Metrics Grid, Depot Fleet Breakdown, Export Modal).
 * 2. Depot Manager Dashboard (Depot Profile, Fleet KPIs, Scheduled Departures, Trip Assignment Modal).
 * 3. Dispatcher Dashboard (Dispatch Radar, Strict Provenance Separation for Hardware GPS vs Simulator, Delayed Departures, Countdown).
 * 4. Driver Dashboard (Mobile-first interface, 3-Step Lifecycle: Confirm Readiness -> Start Trip -> Complete Trip, Read-only GPS Indicator).
 * 5. Conductor Dashboard (Mobile-first interface, Paired ETM Device, Honest Telemetry Notice, Ordered Fare Stages).
 * 6. Report Export Modal (Role-authorized CSV Download trigger).
 * 7. Bilingual Tamil parity across dashboards.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import {
  TransportAdminDashboardPage,
  DepotManagerDashboardPage,
  DispatcherDashboardPage,
  DriverDashboardPage,
  ConductorDashboardPage,
  ReportExportModal
} from '../src/features/management';
import { operationsService } from '../src/services/api/operations.service';
import { safeSetItem } from '../src/lib/storage';
import { STORAGE_KEYS } from '../src/config/constants';
import {
  TransportAdminDashboardData,
  DepotManagerDashboardData,
  DispatcherDashboardData,
  DriverDashboardData,
  ConductorDashboardData
} from '../src/types/domain';

// Mock operationsService
vi.mock('../src/services/api/operations.service', () => ({
  operationsService: {
    getTransportAdminDashboard: vi.fn(),
    getDepotManagerDashboard: vi.fn(),
    getDispatcherDashboard: vi.fn(),
    getDriverDashboard: vi.fn(),
    getConductorDashboard: vi.fn(),
    assignTripBus: vi.fn(),
    assignTripDriver: vi.fn(),
    assignTripConductor: vi.fn(),
    driverConfirmReady: vi.fn(),
    driverStartTrip: vi.fn(),
    driverCompleteTrip: vi.fn(),
    addTripRemark: vi.fn(),
    exportReport: vi.fn()
  }
}));

const mockAdminData: TransportAdminDashboardData = {
  metrics: {
    totalRegisteredBuses: 120,
    activeBuses: 95,
    inactiveBuses: 5,
    reserveBuses: 15,
    maintenanceBuses: 5,
    busesInTransit: 42,
    gpsConnectedBuses: 38,
    gpsStaleBuses: 4,
    gpsOfflineBuses: 78,
    totalTripsToday: 350,
    activeScheduledTrips: 42,
    completedTrips: 210,
    delayedTrips: 6,
    cancelledTrips: 2,
    activeAlertsCount: 1,
    fleetUtilizationPercent: 79,
    driverAvailability: {
      total: 150,
      available: 66,
      assigned: 84,
      onDuty: 42,
      onLeave: 12
    },
    conductorAvailability: {
      total: 140,
      available: 56,
      assigned: 84,
      onDuty: 42,
      onLeave: 10
    }
  },
  depotFleetSummary: [
    {
      depotId: 'dep-mdu-1',
      depotCode: 'MDU-CEN',
      depotNameEn: 'Madurai Central Depot',
      depotNameTa: 'மதுரை மத்திய பணிமனை',
      totalBuses: 60,
      activeBuses: 48,
      inTransitBuses: 22,
      reserveBuses: 8
    },
    {
      depotId: 'dep-mdu-2',
      depotCode: 'MDU-MAT',
      depotNameEn: 'Mattuthavani Depot',
      depotNameTa: 'மாட்டுத்தாவணி பணிமனை',
      totalBuses: 60,
      activeBuses: 47,
      inTransitBuses: 20,
      reserveBuses: 7
    }
  ],
  divisionOverview: [
    {
      divisionId: 'div-mdu',
      divisionCode: 'MDU',
      nameEn: 'Madurai Division',
      nameTa: 'மதுரை கோட்டம்',
      depotCount: 2,
      busCount: 120,
      tripCount: 350
    }
  ],
  recentAlerts: [
    {
      id: 'alt-1',
      titleEn: 'Departure Delay in Corridor 70',
      titleTa: 'வழித்தடம் 70ல் தாமதம்',
      severity: 'WARNING',
      category: 'SCHEDULE_DELAY',
      routeNumber: '70A',
      createdAt: new Date().toISOString()
    }
  ],
  etaServiceStatus: {
    status: 'OPERATIONAL',
    activeModel: 'LightGBM-ETA-v2.1',
    confidence: 0.94,
    fallbackActive: false
  },
  generatedAt: new Date().toISOString()
};

const mockDepotData: DepotManagerDashboardData = {
  depot: {
    id: 'dep-mdu-1',
    code: 'MDU-CEN',
    nameEn: 'Madurai Central Depot',
    nameTa: 'மதுரை மத்திய பணிமனை',
    totalCapacity: 80,
    divisionName: 'Madurai Division'
  },
  fleetSummary: {
    total: 60,
    active: 48,
    inTransit: 22,
    reserve: 8,
    maintenance: 4,
    offline: 0
  },
  buses: [
    {
      id: 'bus-1',
      registrationNumber: 'TN 58 N 1234',
      fleetNumber: 'MDU-701',
      vehicleType: 'DELUXE',
      status: 'IN_SERVICE',
      isReserve: false,
      currentTripCode: 'TRIP-101',
      lastGpsUpdate: new Date().toISOString(),
      gpsFreshness: 'CONNECTED'
    }
  ],
  departures: [
    {
      id: 'trip-101',
      tripCode: 'TRIP-101',
      routeNumber: '70A',
      origin: 'Madurai Junction',
      destination: 'Mattuthavani',
      departureTime: '08:00',
      arrivalTime: '08:45',
      status: 'IN_TRANSIT',
      assignedBusNumber: 'TN 58 N 1234',
      assignedBusId: 'bus-1',
      assignedDriverName: 'Murugan P',
      assignedDriverId: 'drv-1',
      assignedConductorName: 'Karthik S',
      assignedConductorId: 'cnd-1',
      isDelayed: false,
      delayMins: 0
    },
    {
      id: 'trip-102',
      tripCode: 'TRIP-102',
      routeNumber: '71B',
      origin: 'Madurai Junction',
      destination: 'Thirumangalam',
      departureTime: '08:30',
      arrivalTime: '09:20',
      status: 'SCHEDULED',
      assignedBusNumber: undefined,
      assignedDriverName: undefined,
      assignedConductorName: undefined,
      isDelayed: true,
      delayMins: 15
    }
  ],
  staffSummary: {
    totalDrivers: 65,
    availableDrivers: 40,
    assignedDrivers: 20,
    onLeaveDrivers: 5,
    totalConductors: 60,
    availableConductors: 38,
    assignedConductors: 18,
    onLeaveConductors: 4
  },
  devicesSummary: {
    totalEtms: 55,
    onlineEtms: 50,
    lowBatteryEtms: 2,
    totalGpsTrackers: 60,
    onlineGpsTrackers: 58
  },
  generatedAt: new Date().toISOString()
};

const mockDispatcherData: DispatcherDashboardData = {
  operatingBuses: [
    {
      busId: 'bus-1',
      registrationNumber: 'TN 58 N 1234',
      fleetNumber: 'MDU-701',
      routeNumber: '70A',
      tripCode: 'TRIP-101',
      currentSpeed: 34.5,
      heading: 90,
      coordinates: [9.9252, 78.1198],
      lastRecordedAt: new Date().toISOString(),
      freshnessCategory: 'FRESH',
      sourceProvenance: 'HARDWARE_GPS',
      isSimulated: false,
      trackingStatus: 'TRACKING_ACTIVE'
    },
    {
      busId: 'bus-sim',
      registrationNumber: 'TN 58 N 9999',
      fleetNumber: 'MDU-SIM-01',
      routeNumber: '77',
      tripCode: 'TRIP-SIM',
      currentSpeed: 28.0,
      heading: 180,
      coordinates: [9.9312, 78.1120],
      lastRecordedAt: new Date().toISOString(),
      freshnessCategory: 'FRESH',
      sourceProvenance: 'SIMULATOR',
      isSimulated: true,
      trackingStatus: 'SIMULATED'
    }
  ],
  activeTrips: [
    {
      tripId: 'trip-101',
      tripCode: 'TRIP-101',
      routeNumber: '70A',
      origin: 'Madurai Junction',
      destination: 'Mattuthavani',
      departureTime: '08:00',
      arrivalTime: '08:45',
      busRegistration: 'TN 58 N 1234',
      driverName: 'Murugan P',
      progressPercent: 45,
      delayMinutes: 0,
      status: 'IN_TRANSIT'
    }
  ],
  delayedTrips: [
    {
      tripId: 'trip-102',
      tripCode: 'TRIP-102',
      routeNumber: '71B',
      departureTime: '08:30',
      scheduledVsActualDiffMins: 15,
      remarks: 'Traffic congestion at Goripalayam Junction'
    }
  ],
  upcomingDepartures: [
    {
      tripId: 'trip-103',
      tripCode: 'TRIP-103',
      routeNumber: '3A',
      departureTime: '09:00',
      timeUntilDepartureMins: 5,
      busAssigned: true,
      driverAssigned: true
    }
  ],
  operationalAlerts: [
    {
      id: 'alt-1',
      severity: 'WARNING',
      messageEn: '15m delay detected on Route 71B',
      messageTa: 'வழித்தடம் 71Bல் 15 நிமிடம் தாமதம்',
      createdAt: new Date().toISOString()
    }
  ],
  generatedAt: new Date().toISOString()
};

const mockDriverData: DriverDashboardData = {
  driver: {
    id: 'drv-1',
    employeeId: 'EMP-5801',
    badgeNumber: 'DRV-5801',
    fullName: 'Murugan P',
    depotName: 'Madurai Central Depot',
    licenseNumber: 'TN58 20100001234',
    status: 'ACTIVE'
  },
  assignedBus: {
    id: 'bus-1',
    registrationNumber: 'TN 58 N 1234',
    fleetNumber: 'MDU-701',
    vehicleType: 'DELUXE',
    livery: 'TNSTC_CLASSIC_GREEN'
  },
  activeTrip: {
    id: 'trip-101',
    tripCode: 'TRIP-101',
    routeNumber: '70A',
    originStopName: 'Madurai Junction',
    destinationStopName: 'Mattuthavani',
    departureTime: '08:00',
    arrivalTime: '08:45',
    totalDistanceKm: 12.5,
    status: 'SCHEDULED',
    isReady: false,
    orderedStops: [
      { sequence: 1, stopId: 'stp-1', nameEn: 'Madurai Junction', nameTa: 'மதுரை சந்திப்பு', scheduledTime: '08:00', isPassed: true },
      { sequence: 2, stopId: 'stp-2', nameEn: 'Simmakkal', nameTa: 'சிம்மக்கல்', scheduledTime: '08:15', isPassed: false },
      { sequence: 3, stopId: 'stp-3', nameEn: 'Goripalayam', nameTa: 'கோரிப்பாளையம்', scheduledTime: '08:25', isPassed: false },
      { sequence: 4, stopId: 'stp-4', nameEn: 'Mattuthavani', nameTa: 'மாட்டுத்தாவணி', scheduledTime: '08:45', isPassed: false }
    ],
    gpsStatus: {
      connected: true,
      source: 'HARDWARE_GPS',
      lastPing: new Date().toISOString()
    },
    etmStatus: {
      paired: true,
      deviceModel: 'ETM-2024-X',
      conductorName: 'Karthik S'
    }
  },
  recentTrips: [],
  operationalNotices: [],
  generatedAt: new Date().toISOString()
};

const mockConductorData: ConductorDashboardData = {
  conductor: {
    id: 'cnd-1',
    employeeId: 'EMP-5802',
    badgeNumber: 'CND-5801',
    fullName: 'Karthik S',
    depotName: 'Madurai Central Depot',
    status: 'ACTIVE'
  },
  assignedTrip: {
    id: 'trip-101',
    tripCode: 'TRIP-101',
    routeNumber: '70A',
    originStopName: 'Madurai Junction',
    destinationStopName: 'Mattuthavani',
    departureTime: '08:00',
    arrivalTime: '08:45',
    status: 'IN_TRANSIT',
    busRegistration: 'TN 58 N 1234',
    orderedStops: [
      { sequence: 1, stopId: 'stp-1', nameEn: 'Madurai Junction', nameTa: 'மதுரை சந்திப்பு', scheduledTime: '08:00', fareStage: 'Stage 1 (₹0)' },
      { sequence: 2, stopId: 'stp-2', nameEn: 'Simmakkal', nameTa: 'சிம்மக்கல்', scheduledTime: '08:15', fareStage: 'Stage 2 (₹7)' },
      { sequence: 3, stopId: 'stp-3', nameEn: 'Goripalayam', nameTa: 'கோரிப்பாளையம்', scheduledTime: '08:25', fareStage: 'Stage 3 (₹12)' },
      { sequence: 4, stopId: 'stp-4', nameEn: 'Mattuthavani', nameTa: 'மாட்டுத்தாவணி', scheduledTime: '08:45', fareStage: 'Stage 4 (₹18)' }
    ]
  },
  etmDevice: {
    id: 'etm-1',
    deviceId: 'ETM-2024-001',
    deviceModel: 'Verifone-TNSTC-POS',
    batteryLevelPercent: 94,
    connectionStatus: 'ONLINE',
    telemetryNotice: 'ETM Ticketing Telemetry Pending Live Terminal Handshake — Passenger counts protected'
  },
  operationalNotices: [],
  tripHistory: [],
  generatedAt: new Date().toISOString()
};

describe('Phase 12 Operations Dashboards UI Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeSetItem(STORAGE_KEYS.LANGUAGE, 'en');
  });

  describe('1. Transport Administrator Dashboard', () => {
    it('renders executive command centre with live MongoDB KPIs and AI service health', async () => {
      vi.mocked(operationsService.getTransportAdminDashboard).mockResolvedValue(mockAdminData);

      render(
        <MemoryRouter>
          <I18nProvider>
            <TransportAdminDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      // Loading state check
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for data load
      await waitFor(() => {
        expect(screen.getAllByText('120')[0]).toBeInTheDocument(); // totalRegisteredBuses
      });

      // Verify KPIs
      expect(screen.getAllByText('42').length).toBeGreaterThan(0); // busesInTransit
      expect(screen.getByText('38')).toBeInTheDocument(); // gpsConnectedBuses
      expect(screen.getAllByText('350').length).toBeGreaterThan(0); // totalTripsToday

      // Verify AI/ML Health
      expect(screen.getByText('OPERATIONAL')).toBeInTheDocument();
      expect(screen.getByText(/LightGBM-ETA-v2.1/i)).toBeInTheDocument();

      // Verify Depot Comparison table
      expect(screen.getByText('Madurai Central Depot')).toBeInTheDocument();
      expect(screen.getByText('Mattuthavani Depot')).toBeInTheDocument();
    });

    it('opens and closes sanitized CSV report export modal', async () => {
      vi.mocked(operationsService.getTransportAdminDashboard).mockResolvedValue(mockAdminData);

      render(
        <MemoryRouter>
          <I18nProvider>
            <TransportAdminDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('120')[0]).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      // Modal is visible
      expect(screen.getByText(/official role-authorized csv export/i)).toBeInTheDocument();
      expect(screen.getByText(/formula injection protection/i)).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText(/official role-authorized csv export/i)).not.toBeInTheDocument();
    });
  });

  describe('2. Depot Manager Dashboard', () => {
    it('renders depot profile, scheduled departures and delay indicators', async () => {
      vi.mocked(operationsService.getDepotManagerDashboard).mockResolvedValue(mockDepotData);

      render(
        <MemoryRouter>
          <I18nProvider>
            <DepotManagerDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Madurai Central Depot/i).length).toBeGreaterThan(0);
      });

      expect(screen.getByText(/MDU-CEN/i)).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument(); // assigned fleet

      // Check scheduled departures
      expect(screen.getByText('70A')).toBeInTheDocument();
      expect(screen.getAllByText('TN 58 N 1234').length).toBeGreaterThan(0);

      // Check delayed departure badge
      expect(screen.getByText('71B')).toBeInTheDocument();
      expect(screen.getByText(/15m delay/i)).toBeInTheDocument();
    });

    it('opens trip assignment modal and triggers assignment', async () => {
      vi.mocked(operationsService.getDepotManagerDashboard).mockResolvedValue(mockDepotData);
      vi.mocked(operationsService.assignTripBus).mockResolvedValue({
        success: true,
        tripId: 'trip-102',
        busId: 'bus-1'
      });

      render(
        <MemoryRouter>
          <I18nProvider>
            <DepotManagerDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('71B')).toBeInTheDocument();
      });

      // Click "Assign" button for unassigned trip 71B via data-testid
      const assignButton = screen.getByTestId('assign-trip-trip-102');
      fireEvent.click(assignButton);

      // Verify modal opened
      expect(screen.getByText(/trip assignment management/i)).toBeInTheDocument();

      // Select bus in modal
      const busSelect = screen.getByRole('combobox');
      fireEvent.change(busSelect, { target: { value: 'bus-1' } });

      // Click save assignment
      const confirmButton = screen.getByRole('button', { name: /confirm assignment/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(operationsService.assignTripBus).toHaveBeenCalledWith('trip-102', 'bus-1');
      });
    });
  });

  describe('3. Dispatcher Dashboard & Strict Provenance Separation', () => {
    it('displays active radar with clear separation between Certified AIS-140 GPS and Simulator', async () => {
      vi.mocked(operationsService.getDispatcherDashboard).mockResolvedValue(mockDispatcherData);

      render(
        <MemoryRouter>
          <I18nProvider>
            <DispatcherDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('TN 58 N 1234')).toBeInTheDocument();
      });

      // Bus 1: Certified Hardware GPS
      expect(screen.getByText(/HARDWARE_GPS/i)).toBeInTheDocument();

      // Bus sim: Simulator Badge (must never be portrayed as real hardware GPS)
      expect(screen.getAllByText(/SIMULATOR/i).length).toBeGreaterThan(0);

      // Delayed Trips section
      expect(screen.getByText('+15m')).toBeInTheDocument();

      // Upcoming countdown
      expect(screen.getByText('09:00 (5m)')).toBeInTheDocument();
    });
  });

  describe('4. Driver Dashboard (Mobile-First Cockpit)', () => {
    it('renders assigned trip, stops timeline, and 3-step action lifecycle', async () => {
      vi.mocked(operationsService.getDriverDashboard).mockResolvedValue(mockDriverData);
      vi.mocked(operationsService.driverConfirmReady).mockResolvedValue({
        success: true,
        tripId: 'trip-101'
      });

      render(
        <MemoryRouter>
          <I18nProvider>
            <DriverDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Murugan P')).toBeInTheDocument();
      });

      expect(screen.getByText(/DRV-5801/i)).toBeInTheDocument();
      expect(screen.getByText('TN 58 N 1234')).toBeInTheDocument();
      expect(screen.getAllByText('Madurai Junction').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mattuthavani').length).toBeGreaterThan(0);

      // Stops timeline
      expect(screen.getByText('Simmakkal')).toBeInTheDocument();
      expect(screen.getByText('Goripalayam')).toBeInTheDocument();

      // Action workflow button: "1. Confirm Pre-Trip Readiness"
      const readinessButton = screen.getByTestId('driver-confirm-ready-btn');
      fireEvent.click(readinessButton);

      await waitFor(() => {
        expect(operationsService.driverConfirmReady).toHaveBeenCalledWith('trip-101');
      });
    });

    it('handles start trip and complete trip transitions', async () => {
      const inTransitData: DriverDashboardData = {
        ...mockDriverData,
        activeTrip: {
          ...mockDriverData.activeTrip!,
          status: 'IN_TRANSIT',
          isReady: true
        }
      };
      vi.mocked(operationsService.getDriverDashboard).mockResolvedValue(inTransitData);
      vi.mocked(operationsService.driverCompleteTrip).mockResolvedValue({
        success: true,
        tripId: 'trip-101',
        status: 'COMPLETED'
      });

      render(
        <MemoryRouter>
          <I18nProvider>
            <DriverDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('driver-complete-trip-btn')).toBeInTheDocument();
      });

      const completeBtn = screen.getByTestId('driver-complete-trip-btn');
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(operationsService.driverCompleteTrip).toHaveBeenCalledWith('trip-101');
      });
    });
  });

  describe('5. Conductor Dashboard (Mobile-First ETM Console)', () => {
    it('displays conductor profile, paired ETM status, honest pending notice, and fare stages', async () => {
      vi.mocked(operationsService.getConductorDashboard).mockResolvedValue(mockConductorData);

      render(
        <MemoryRouter>
          <I18nProvider>
            <ConductorDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Karthik S')).toBeInTheDocument();
      });

      expect(screen.getByText(/CND-5801/i)).toBeInTheDocument();
      expect(screen.getByText('ETM-2024-001')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();

      // Honest telemetry notice verification (never fabricate ticketing counts)
      expect(screen.getByTestId('etm-telemetry-notice')).toHaveTextContent(
        /ETM Ticketing Telemetry Pending Live Terminal Handshake — Passenger counts protected/i
      );

      // Fare stages list
      expect(screen.getByText(/Stage 1 \(₹0\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 2 \(₹7\)/i)).toBeInTheDocument();
    });
  });

  describe('6. Sanitized CSV Export Modal', () => {
    it('renders export options and downloads sanitized CSV', async () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const onClose = vi.fn();

      render(
        <I18nProvider>
          <ReportExportModal isOpen={true} onClose={onClose} />
        </I18nProvider>
      );

      expect(screen.getByText(/official role-authorized csv export/i)).toBeInTheDocument();

      // Select Report Type
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'TRIP_COMPLETION' } });

      const downloadBtn = screen.getByRole('button', { name: /export csv/i });
      expect(downloadBtn).toBeInTheDocument();
      fireEvent.click(downloadBtn);

      // Verify anchor click was called for download
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });
  });

  describe('7. Bilingual Tamil Parity', () => {
    it('renders Tamil labels when language is set to ta', async () => {
      safeSetItem(STORAGE_KEYS.LANGUAGE, 'ta');
      vi.mocked(operationsService.getTransportAdminDashboard).mockResolvedValue(mockAdminData);

      render(
        <MemoryRouter>
          <I18nProvider>
            <TransportAdminDashboardPage />
          </I18nProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('மதுரை மத்திய பணிமனை')).toBeInTheDocument();
      });

      expect(screen.getByText('நிர்வாக களம்')).toBeInTheDocument();
    });
  });
});
