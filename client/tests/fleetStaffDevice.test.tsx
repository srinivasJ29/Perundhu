/**
 * PERUNDHU (பேருந்து) — Phase 3 Fleet, Crew & Device Test Suite
 * Tests UI rendering, API integration, and interactions for:
 * - Fleet Management
 * - Driver Management
 * - Conductor Management
 * - ETM Device Registry (GPS Verification Status UNKNOWN by default)
 * - GPS Tracker Registry
 * - Controlled Device & Staff Assignments
 * - Fleet & Device Telematics Monitoring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import {
  FleetManagementPage,
  DriverManagementPage,
  ConductorManagementPage,
  EtmRegistryPage,
  GpsTrackerRegistryPage,
  DeviceAssignmentPage,
  FleetDeviceMonitoringPage
} from '../src/features/management';
import { fleetStaffDeviceService } from '../src/services/api/fleetStaffDevice.service';
import { managementService } from '../src/services/api/management.service';

vi.mock('../src/services/api/fleetStaffDevice.service', () => ({
  fleetStaffDeviceService: {
    listBuses: vi.fn(),
    getBusById: vi.fn(),
    createBus: vi.fn(),
    updateBus: vi.fn(),
    updateBusStatus: vi.fn(),
    assignBusDepot: vi.fn(),
    getBusAssignments: vi.fn(),
    listDrivers: vi.fn(),
    getDriverById: vi.fn(),
    createDriver: vi.fn(),
    updateDriver: vi.fn(),
    updateDriverStatus: vi.fn(),
    getDriverAssignments: vi.fn(),
    listConductors: vi.fn(),
    getConductorById: vi.fn(),
    createConductor: vi.fn(),
    updateConductor: vi.fn(),
    updateConductorStatus: vi.fn(),
    getConductorAssignments: vi.fn(),
    listEtms: vi.fn(),
    getEtmById: vi.fn(),
    createEtm: vi.fn(),
    updateEtm: vi.fn(),
    listGpsTrackers: vi.fn(),
    getGpsTrackerById: vi.fn(),
    createGpsTracker: vi.fn(),
    updateGpsTracker: vi.fn(),
    updateDeviceStatus: vi.fn(),
    assignBusEtm: vi.fn(),
    assignBusGps: vi.fn(),
    assignConductorEtm: vi.fn(),
    assignDriverBus: vi.fn(),
    listAssignments: vi.fn(),
    getFleetAndDeviceStats: vi.fn()
  }
}));

vi.mock('../src/services/api/management.service', () => ({
  managementService: {
    listDepots: vi.fn()
  }
}));

const mockBuses = [
  {
    id: 'bus-1',
    registrationNumber: 'TN-58-N-1234',
    fleetNumber: 'MDU-EXP-101',
    depotName: 'Madurai Central Depot',
    vehicleType: 'ORDINARY_NON_AC',
    manufacturer: 'Ashok Leyland',
    vehicleModel: 'Viking BS6',
    fuelType: 'DIESEL',
    seatingCapacity: 45,
    status: 'IN_SERVICE',
    isReserveFleet: false,
    assignedGpsTrackerId: {
      id: 'gps-1',
      deviceId: 'GPS-MDU-01',
      deviceModel: 'FMB120',
      gpsAvailabilityStatus: 'VERIFIED_AVAILABLE'
    },
    assignedEtmDeviceId: {
      id: 'etm-1',
      deviceId: 'ETM-MDU-01',
      deviceModel: 'SmartPrint-700',
      gpsAvailabilityStatus: 'UNKNOWN'
    },
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
];

const mockDrivers = [
  {
    id: 'drv-1',
    employeeId: 'DRV-MDU-1001',
    badgeNumber: 'BDG-7089',
    fullName: 'S. Murugan',
    role: 'DRIVER',
    organizationId: 'org-1',
    assignedDepotId: 'depot-1',
    status: 'AVAILABLE',
    shiftPreference: 'MORNING',
    depot: { id: 'depot-1', nameEn: 'Madurai Central Depot', code: 'MDU-01' },
    assignedBus: { id: 'bus-1', registrationNumber: 'TN-58-N-1234', fleetNumber: 'MDU-EXP-101' },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
];

const mockConductors = [
  {
    id: 'cnd-1',
    employeeId: 'CND-MDU-2001',
    badgeNumber: 'BDG-9102',
    fullName: 'K. Arumugam',
    role: 'CONDUCTOR',
    organizationId: 'org-1',
    assignedDepotId: 'depot-1',
    status: 'ASSIGNED',
    shiftPreference: 'EVENING',
    depot: { id: 'depot-1', nameEn: 'Madurai Central Depot', code: 'MDU-01' },
    assignedEtm: { id: 'etm-1', deviceId: 'ETM-MDU-01', deviceModel: 'SmartPrint-700', gpsAvailabilityStatus: 'UNKNOWN' },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
];

const mockEtms = [
  {
    id: 'etm-1',
    deviceId: 'ETM-MDU-01',
    deviceCategory: 'ETM',
    manufacturer: 'Analogics Tech',
    deviceModel: 'SmartPrint-700',
    gpsAvailabilityStatus: 'UNKNOWN',
    status: 'ACTIVE',
    healthStatus: 'HEALTHY',
    depotId: 'depot-1',
    isOnline: true,
    batteryHealthPercent: 92,
    supportedProtocols: ['HTTP'],
    networkGenerations: ['4G'],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
];

const mockTrackers = [
  {
    id: 'gps-1',
    deviceId: 'GPS-MDU-01',
    deviceCategory: 'GPS_TRACKER',
    manufacturer: 'Teltonika',
    deviceModel: 'FMB120 GNSS',
    gpsAvailabilityStatus: 'VERIFIED_AVAILABLE',
    status: 'ACTIVE',
    healthStatus: 'HEALTHY',
    installationStatus: 'INSTALLED',
    depotId: 'depot-1',
    isOnline: true,
    supportedProtocols: ['HTTP', 'TCP'],
    networkGenerations: ['4G'],
    currentAssignedBus: { id: 'bus-1', registrationNumber: 'TN-58-N-1234', fleetNumber: 'MDU-EXP-101' },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
];

const mockAssignments = [
  {
    id: 'asgn-1',
    assignmentType: 'BUS_GPS',
    busId: { _id: 'bus-1', registrationNumber: 'TN-58-N-1234', fleetNumber: 'MDU-EXP-101' },
    deviceId: { _id: 'gps-1', deviceId: 'GPS-MDU-01', deviceCategory: 'GPS_TRACKER', deviceModel: 'FMB120 GNSS' },
    status: 'ACTIVE',
    assignedAt: '2026-10-15T08:00:00.000Z',
    assignedBy: 'admin',
    createdAt: '2026-10-15T08:00:00.000Z'
  }
];

const mockStats = {
  fleet: {
    total: 80,
    inService: 65,
    maintenance: 10,
    offline: 5,
    reserveFleet: 12,
    withGps: 60,
    withEtm: 55
  },
  crew: {
    totalDrivers: 90,
    availableDrivers: 25,
    assignedDrivers: 50,
    onDutyDrivers: 15,
    totalConductors: 85,
    availableConductors: 20,
    assignedConductors: 50,
    onDutyConductors: 15
  },
  devices: {
    totalEtms: 70,
    etmsOnline: 62,
    etmsWithGpsVerified: 5,
    etmsGpsUnknown: 60,
    etmsGpsUnavailable: 5,
    totalGpsTrackers: 75,
    gpsTrackersOnline: 70,
    installedGpsTrackers: 65,
    communicationThresholdMinutes: 15
  }
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <I18nProvider>
        {component}
      </I18nProvider>
    </MemoryRouter>
  );
};

describe('Phase 3 — Fleet, Staff & Device Management UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(managementService.listDepots).mockResolvedValue({
      data: [{ _id: 'depot-1', code: 'MDU-01', nameEn: 'Madurai Central Depot', nameTa: 'மதுரை மத்திய', organizationId: 'org-1' } as any]
    } as any);
  });

  describe('Fleet Management Page', () => {
    it('renders fleet registry and lists registered buses with vehicle specifications and attached devices', async () => {
      vi.mocked(fleetStaffDeviceService.listBuses).mockResolvedValue({
        data: mockBuses,
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      } as any);

      renderWithProviders(<FleetManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Fleet Registry|பேருந்துக் கடற்படை மேலாண்மை/i)).toBeInTheDocument();
        expect(screen.getByText('TN-58-N-1234')).toBeInTheDocument();
        expect(screen.getByText('MDU-EXP-101')).toBeInTheDocument();
        expect(screen.getByText(/GPS/i)).toBeInTheDocument();
        expect(screen.getByText(/ETM/i)).toBeInTheDocument();
      });
    });
  });

  describe('Driver Management Page', () => {
    it('renders driver registry with employee ID, badge number, and availability state', async () => {
      vi.mocked(fleetStaffDeviceService.listDrivers).mockResolvedValue({
        data: mockDrivers,
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      } as any);

      renderWithProviders(<DriverManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Driver Management|ஓட்டுநர்கள் மேலாண்மை/i)).toBeInTheDocument();
        expect(screen.getByText('S. Murugan')).toBeInTheDocument();
        expect(screen.getByText('DRV-MDU-1001')).toBeInTheDocument();
        expect(screen.getByText('BDG-7089')).toBeInTheDocument();
        expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
      });
    });
  });

  describe('Conductor Management Page', () => {
    it('renders conductor registry with paired ETM terminal', async () => {
      vi.mocked(fleetStaffDeviceService.listConductors).mockResolvedValue({
        data: mockConductors,
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      } as any);

      renderWithProviders(<ConductorManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Conductor Management|நடத்துநர்கள் மேலாண்மை/i)).toBeInTheDocument();
        expect(screen.getByText('K. Arumugam')).toBeInTheDocument();
        expect(screen.getByText('CND-MDU-2001')).toBeInTheDocument();
        expect(screen.getByText('ETM-MDU-01')).toBeInTheDocument();
      });
    });
  });

  describe('ETM Registry Page', () => {
    it('renders ETM devices and defaults GPS capability status to UNKNOWN unconfirmed tag', async () => {
      vi.mocked(fleetStaffDeviceService.listEtms).mockResolvedValue({
        data: mockEtms,
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      } as any);

      renderWithProviders(<EtmRegistryPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByText('ETM-MDU-01')).toBeInTheDocument();
        expect(screen.getAllByText(/UNKNOWN/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Live/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('GPS Tracker Registry Page', () => {
    it('renders dedicated hardware GPS trackers and mounted bus status', async () => {
      vi.mocked(fleetStaffDeviceService.listGpsTrackers).mockResolvedValue({
        data: mockTrackers,
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      } as any);

      renderWithProviders(<GpsTrackerRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText(/Dedicated Vehicle GPS Trackers|வாகன ஜிபிஎஸ் கருவிகள்/i)).toBeInTheDocument();
        expect(screen.getByText('GPS-MDU-01')).toBeInTheDocument();
        expect(screen.getByText('FMB120 GNSS')).toBeInTheDocument();
        expect(screen.getByText('INSTALLED')).toBeInTheDocument();
        expect(screen.getByText('TN-58-N-1234')).toBeInTheDocument();
      });
    });
  });

  describe('Device & Staff Assignment Console', () => {
    it('renders pairing console and assignment audit ledger', async () => {
      vi.mocked(fleetStaffDeviceService.listBuses).mockResolvedValue({ data: mockBuses } as any);
      vi.mocked(fleetStaffDeviceService.listDrivers).mockResolvedValue({ data: mockDrivers } as any);
      vi.mocked(fleetStaffDeviceService.listConductors).mockResolvedValue({ data: mockConductors } as any);
      vi.mocked(fleetStaffDeviceService.listEtms).mockResolvedValue({ data: mockEtms } as any);
      vi.mocked(fleetStaffDeviceService.listGpsTrackers).mockResolvedValue({ data: mockTrackers } as any);
      vi.mocked(fleetStaffDeviceService.listAssignments).mockResolvedValue({ data: mockAssignments } as any);

      renderWithProviders(<DeviceAssignmentPage />);

      await waitFor(() => {
        expect(screen.getByText(/Assignment Console|ஒதுக்கீட்டு மையம்/i)).toBeInTheDocument();
        expect(screen.getByText(/BUS_GPS|பேருந்து ↔ ஜிபிஎஸ்/i)).toBeInTheDocument();
        expect(screen.getByText(/Assignment Ledger|வரலாற்றுப் பதிவு/i)).toBeInTheDocument();
      });
    });
  });

  describe('Fleet & Device Telematics Monitoring Page', () => {
    it('renders aggregated fleet, crew, and device telemetry statistics with 15-min threshold', async () => {
      vi.mocked(fleetStaffDeviceService.getFleetAndDeviceStats).mockResolvedValue(mockStats);

      renderWithProviders(<FleetDeviceMonitoringPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getAllByText(/15/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/70/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/75/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
