/**
 * PERUNDHU (பேருந்து) — Phase 2 Management Test Suite
 * Tests UI rendering, API integration, and user interactions for:
 * - Operations Hub
 * - Depot Management
 * - Reserve Fleet
 * - Workshop Management
 * - Bus Stand Management
 * - Depot Transfers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../src/i18n';
import {
  OperationsHubPage,
  DepotManagementPage,
  ReserveFleetPage,
  WorkshopManagementPage,
  BusStandManagementPage,
  DepotTransferPage
} from '../src/features/management';
import { managementService } from '../src/services/api/management.service';
import { districtsService } from '../src/services/api/districts.service';
import { busesService } from '../src/services/api/buses.service';

// Mock Services
vi.mock('../src/services/api/management.service', () => ({
  managementService: {
    getGlobalStats: vi.fn(),
    getDepotStats: vi.fn(),
    listDepots: vi.fn(),
    getDepotById: vi.fn(),
    createDepot: vi.fn(),
    updateDepotStatus: vi.fn(),
    getDepotBuses: vi.fn(),
    getBackupDepots: vi.fn(),
    reassignBackupDepot: vi.fn(),
    getReserveFleet: vi.fn(),
    setBusReserveStatus: vi.fn(),
    listWorkshops: vi.fn(),
    getWorkshopById: vi.fn(),
    createWorkshop: vi.fn(),
    updateWorkshop: vi.fn(),
    listBusStands: vi.fn(),
    getBusStandById: vi.fn(),
    createBusStand: vi.fn(),
    updateBusStand: vi.fn(),
    listTransfers: vi.fn(),
    getTransferById: vi.fn(),
    requestTransfer: vi.fn(),
    approveTransfer: vi.fn(),
    rejectTransfer: vi.fn(),
    startTransferTransit: vi.fn(),
    completeTransfer: vi.fn(),
    cancelTransfer: vi.fn()
  }
}));

vi.mock('../src/services/api/districts.service', () => ({
  districtsService: {
    getDistricts: vi.fn()
  }
}));

vi.mock('../src/services/api/buses.service', () => ({
  busesService: {
    getBuses: vi.fn()
  }
}));

const mockGlobalStats = {
  fleet: {
    totalRegisteredBuses: 120,
    availableBuses: 45,
    busesInService: 60,
    reserveBuses: 10,
    busesUnderMaintenance: 4,
    breakdownBuses: 1
  },
  operations: {
    totalDepots: 5,
    primaryDepots: 3,
    backupDepots: 2,
    activeTransfers: 2
  },
  workshops: {
    activeWorkshops: 3,
    workloadPendingMaintenance: 5
  }
};

const mockDepots = [
  {
    _id: 'depot-1',
    code: 'MDU-DEP-01',
    nameEn: 'Madurai Central Depot',
    nameTa: 'மதுரை மத்திய பணிமனை',
    organizationId: 'org-1',
    depotType: 'PRIMARY',
    location: { type: 'Point', coordinates: [78.1198, 9.9252] },
    totalCapacity: 60,
    serviceBaysCount: 6,
    fuelPumpsAvailable: true,
    associatedBusStandIds: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'depot-2',
    code: 'MDU-DEP-02',
    nameEn: 'Tirupparankunram Backup Depot',
    nameTa: 'திருப்பரங்குன்றம் காப்பு பணிமனை',
    organizationId: 'org-1',
    depotType: 'BACKUP',
    primaryDepotId: 'depot-1',
    location: { type: 'Point', coordinates: [78.071, 9.882] },
    totalCapacity: 30,
    serviceBaysCount: 2,
    fuelPumpsAvailable: true,
    associatedBusStandIds: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockReserveBuses = [
  {
    _id: 'bus-1',
    registrationNumber: 'TN-58-N-9901',
    fleetNumber: 'MDU-RES-01',
    depotName: 'Madurai Central Depot',
    vehicleType: 'ORDINARY_NON_AC',
    status: 'RESERVED',
    isReserveFleet: true,
    isAvailableForDispatch: true,
    depotId: { nameEn: 'Madurai Central Depot', code: 'MDU-DEP-01', depotType: 'PRIMARY' }
  },
  {
    _id: 'bus-2',
    registrationNumber: 'TN-58-N-9902',
    fleetNumber: 'MDU-RES-02',
    depotName: 'Madurai Central Depot',
    vehicleType: 'DELUXE_NON_AC',
    status: 'IN_SERVICE',
    isReserveFleet: true,
    isAvailableForDispatch: false,
    ineligibilityReason: 'Bus has active scheduled trip'
  }
];

const mockWorkshops = [
  {
    _id: 'ws-1',
    code: 'MDU-WS-01',
    nameEn: 'Madurai Central Heavy Pit Lane',
    nameTa: 'மதுரை மத்திய கனரக பணிமனை தளம்',
    organizationId: 'org-1',
    workshopType: 'DEPOT_PIT_LANE',
    location: { type: 'Point', coordinates: [78.1198, 9.9252] },
    totalBays: 8,
    activeBaysOccupied: 3,
    capabilities: ['ROUTINE_SERVICE', 'PREVENTIVE_MAINTENANCE', 'ENGINE_OVERHAUL'],
    status: 'ACTIVE'
  }
];

const mockBusStands = [
  {
    _id: 'stand-1',
    districtId: { _id: 'dist-1', nameEn: 'Madurai', nameTa: 'மதுரை', code: 'MDU' },
    code: 'MDU-STAND-01',
    nameEn: 'Mattuthavani Integrated Bus Terminal',
    nameTa: 'மாட்டுத்தாவணி பேருந்து நிலையம்',
    location: { type: 'Point', coordinates: [78.1585, 9.9431] },
    standType: 'INTERCITY_TERMINAL',
    totalPlatforms: 24,
    isActive: true
  }
];

const mockTransfers = [
  {
    _id: 'tr-1',
    transferNumber: 'TR-100001',
    busId: {
      _id: 'bus-1',
      registrationNumber: 'TN-58-N-9901',
      fleetNumber: 'MDU-RES-01',
      vehicleType: 'ORDINARY_NON_AC',
      status: 'AVAILABLE',
      isReserveFleet: false
    },
    fromDepotId: {
      _id: 'depot-1',
      nameEn: 'Madurai Central Depot',
      nameTa: 'மதுரை மத்திய பணிமனை',
      code: 'MDU-DEP-01',
      depotType: 'PRIMARY'
    },
    toDepotId: {
      _id: 'depot-2',
      nameEn: 'Tirupparankunram Backup Depot',
      nameTa: 'திருப்பரங்குன்றம் காப்பு பணிமனை',
      code: 'MDU-DEP-02',
      depotType: 'BACKUP'
    },
    reason: 'FLEET_REBALANCING',
    status: 'REQUESTED',
    requestedBy: 'admin-1',
    requestTimestamp: new Date().toISOString(),
    auditHistory: []
  }
];

describe('Phase 2 Management Frontend Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Operations Hub with live stats and navigation links', async () => {
    vi.mocked(managementService.getGlobalStats).mockResolvedValue(mockGlobalStats);

    render(
      <MemoryRouter>
        <I18nProvider>
          <OperationsHubPage />
        </I18nProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Depots Management|பணிமனை மேலாண்மை/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Reserve Fleet Dispatch|ரிசர்வ் கடற்படை தயார்நிலை/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Maintenance Workshops|பணிமனைப் பட்டறைகள்/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Depot Management page with table and depots list', async () => {
    vi.mocked(managementService.listDepots).mockResolvedValue({
      data: mockDepots as any,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

    render(
      <MemoryRouter>
        <I18nProvider>
          <DepotManagementPage />
        </I18nProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MDU-DEP-01')).toBeInTheDocument();
      expect(screen.getByText('MDU-DEP-02')).toBeInTheDocument();
    });

    expect(screen.getByText('PRIMARY')).toBeInTheDocument();
    expect(screen.getByText('BACKUP')).toBeInTheDocument();
  });

  it('renders Reserve Fleet page with availability status badges', async () => {
    vi.mocked(managementService.getReserveFleet).mockResolvedValue({
      data: mockReserveBuses as any,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
    vi.mocked(managementService.listDepots).mockResolvedValue({
      data: mockDepots as any,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

    render(
      <MemoryRouter>
        <I18nProvider>
          <ReserveFleetPage />
        </I18nProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('TN-58-N-9901')).toBeInTheDocument();
      expect(screen.getByText('TN-58-N-9902')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/READY|தயார் நிலை/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/UNAVAILABLE|தயாரில்லை/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Bus has active scheduled trip')).toBeInTheDocument();
  });

  it('renders Workshop Management page with bay occupancy and capabilities', async () => {
    vi.mocked(managementService.listWorkshops).mockResolvedValue({
      data: mockWorkshops as any,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
    vi.mocked(managementService.listDepots).mockResolvedValue({
      data: mockDepots as any,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

    render(
      <MemoryRouter>
        <I18nProvider>
          <WorkshopManagementPage />
        </I18nProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MDU-WS-01')).toBeInTheDocument();
      expect(screen.getByText('PIT LANE')).toBeInTheDocument();
      expect(screen.getByText('ROUTINE_SERVICE')).toBeInTheDocument();
    });
  });

  it('renders Bus Stand Management page with platform info and stand types', async () => {
    vi.mocked(managementService.listBusStands).mockResolvedValue({
      data: mockBusStands as any,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
    vi.mocked(districtsService.getDistricts).mockResolvedValue({
      data: [
        {
          id: 'dist-1',
          code: 'MDU',
          nameEn: 'Madurai',
          nameTa: 'மதுரை',
          headquarters: 'Madurai',
          createdAt: '',
          updatedAt: ''
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

    render(
      <MemoryRouter>
        <I18nProvider>
          <BusStandManagementPage />
        </I18nProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MDU-STAND-01')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
    });

    expect(screen.getByText('INTERCITY_TERMINAL')).toBeInTheDocument();
  });

  it('renders Depot Transfer page with transfer requests and approval actions', async () => {
    vi.mocked(managementService.listTransfers).mockResolvedValue({
      data: mockTransfers as any,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
    vi.mocked(managementService.listDepots).mockResolvedValue({
      data: mockDepots as any,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
    vi.mocked(busesService.getBuses).mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

    render(
      <MemoryRouter>
        <I18nProvider>
          <DepotTransferPage />
        </I18nProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('TR-100001')).toBeInTheDocument();
      expect(screen.getByText('REQUESTED')).toBeInTheDocument();
    });

    expect(screen.getByTitle('Approve Transfer')).toBeInTheDocument();
    expect(screen.getByTitle('Reject Transfer')).toBeInTheDocument();
  });
});
