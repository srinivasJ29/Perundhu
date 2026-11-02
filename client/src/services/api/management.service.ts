import { httpClient } from './client';
import { PaginatedResult } from '../../types/api';

export interface OperationalStatsDto {
  fleet: {
    totalRegisteredBuses: number;
    availableBuses: number;
    busesInService: number;
    reserveBuses: number;
    busesUnderMaintenance: number;
    breakdownBuses: number;
  };
  operations: {
    totalDepots: number;
    primaryDepots: number;
    backupDepots: number;
    activeTransfers: number;
  };
  workshops: {
    activeWorkshops: number;
    workloadPendingMaintenance: number;
  };
}

export interface DepotDto {
  _id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  organizationId: string;
  divisionId?: string;
  depotType: 'PRIMARY' | 'SECONDARY' | 'BACKUP';
  primaryDepotId?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address?: string;
  contactPhone?: string;
  totalCapacity: number;
  serviceBaysCount: number;
  fuelPumpsAvailable: boolean;
  associatedBusStandIds: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
  createdAt: string;
  updatedAt: string;
}

export interface DepotBusDto {
  _id: string;
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  vehicleType: string;
  status: string;
  isReserveFleet: boolean;
  assignedDriverId?: { fullName: string; employeeId: string; badgeNumber: string; contactNumber?: string };
  assignedConductorId?: { fullName: string; employeeId: string; badgeNumber: string; contactNumber?: string };
  assignedEtmDeviceId?: { deviceId: string; deviceModel: string; gpsAvailabilityStatus: string };
  assignedGpsTrackerId?: { deviceId: string; deviceModel: string; gpsAvailabilityStatus: string };
  currentAssignedTripId?: { tripCode: string; departureTime: string; arrivalTime: string };
  currentOdometerKm?: number;
}

export interface BackupDepotsResponseDto {
  primaryDepot: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
  };
  backupDepots: Array<
    DepotDto & {
      totalReserveFleetCount: number;
      availableReserveCount: number;
      reserveBuses: Array<{
        id: string;
        registrationNumber: string;
        fleetNumber: string;
        vehicleType: string;
        status: string;
        isAvailable: boolean;
      }>;
    }
  >;
}

export interface ReserveBusDto {
  _id: string;
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  vehicleType: string;
  status: string;
  isReserveFleet: boolean;
  isAvailableForDispatch: boolean;
  ineligibilityReason?: string;
  depotId?: { nameEn: string; code: string; depotType: string };
  assignedGpsTrackerId?: { deviceId: string; gpsAvailabilityStatus: string; status: string };
  assignedEtmDeviceId?: { deviceId: string; gpsAvailabilityStatus: string; status: string };
  currentAssignedTripId?: { tripCode: string; departureTime: string; arrivalTime: string };
}

export interface WorkshopDto {
  _id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  organizationId: string;
  divisionId?: string;
  depotId?: string;
  workshopType: 'DEPOT_PIT_LANE' | 'REGIONAL_CENTRAL_WORKSHOP';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  totalBays: number;
  activeBaysOccupied: number;
  capabilities: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'FULL_CAPACITY';
  contactPhone?: string;
}

export interface BusStandManagementDto {
  _id: string;
  districtId: { _id: string; nameEn: string; nameTa: string; code: string } | string;
  divisionId?: string;
  depotIds?: any[];
  code: string;
  nameEn: string;
  nameTa: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  standType: 'INTERCITY_TERMINAL' | 'MOFUSSIL' | 'TOWN_STAND';
  totalPlatforms: number;
  isActive: boolean;
}

export interface DepotTransferDto {
  _id: string;
  transferNumber: string;
  busId: {
    _id: string;
    registrationNumber: string;
    fleetNumber: string;
    vehicleType: string;
    status: string;
    isReserveFleet: boolean;
  };
  fromDepotId: {
    _id: string;
    nameEn: string;
    nameTa: string;
    code: string;
    depotType: string;
  };
  toDepotId: {
    _id: string;
    nameEn: string;
    nameTa: string;
    code: string;
    depotType: string;
  };
  reason: string;
  reasonDetails?: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  requestTimestamp: string;
  approvalTimestamp?: string;
  completionTimestamp?: string;
  notes?: string;
  auditHistory: Array<{
    action: string;
    performedBy: string;
    timestamp: string;
    notes?: string;
  }>;
}

export const managementService = {
  // Operational Statistics
  async getGlobalStats(): Promise<OperationalStatsDto> {
    const res = await httpClient.get<{ data: OperationalStatsDto }>('/stats/operational');
    return res.data;
  },

  async getDepotStats(depotId: string): Promise<any> {
    const res = await httpClient.get<{ data: any }>(`/depots/${depotId}/stats`);
    return res.data;
  },

  // Depots
  async listDepots(params: Record<string, any> = {}): Promise<PaginatedResult<DepotDto>> {
    return httpClient.get<PaginatedResult<DepotDto>>('/depots', { params });
  },

  async getDepotById(id: string): Promise<DepotDto> {
    const res = await httpClient.get<{ data: DepotDto }>(`/depots/${id}`);
    return res.data;
  },

  async createDepot(data: any): Promise<DepotDto> {
    const res = await httpClient.post<{ data: DepotDto }>('/admin/depots', data);
    return res.data;
  },

  async updateDepotStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE'): Promise<DepotDto> {
    const res = await httpClient.patch<{ data: DepotDto }>(`/admin/depots/${id}/status`, { status });
    return res.data;
  },

  async getDepotBuses(depotId: string, params: Record<string, any> = {}): Promise<PaginatedResult<DepotBusDto>> {
    return httpClient.get<PaginatedResult<DepotBusDto>>(`/depots/${depotId}/buses`, { params });
  },

  async getBackupDepots(primaryDepotId: string): Promise<BackupDepotsResponseDto> {
    const res = await httpClient.get<{ data: BackupDepotsResponseDto }>(`/depots/${primaryDepotId}/backup-depots`);
    return res.data;
  },

  async reassignBackupDepot(backupDepotId: string, newPrimaryDepotId: string): Promise<DepotDto> {
    const res = await httpClient.patch<{ data: DepotDto }>(`/admin/depots/${backupDepotId}/primary`, {
      newPrimaryDepotId
    });
    return res.data;
  },

  // Reserve Fleet
  async getReserveFleet(params: Record<string, any> = {}): Promise<PaginatedResult<ReserveBusDto>> {
    return httpClient.get<PaginatedResult<ReserveBusDto>>('/reserve-fleet', { params });
  },

  async setBusReserveStatus(busId: string, isReserveFleet: boolean, reason?: string): Promise<any> {
    const res = await httpClient.patch<{ data: any }>(`/admin/buses/${busId}/reserve`, {
      isReserveFleet,
      reason
    });
    return res.data;
  },

  // Workshops
  async listWorkshops(params: Record<string, any> = {}): Promise<PaginatedResult<WorkshopDto>> {
    return httpClient.get<PaginatedResult<WorkshopDto>>('/workshops', { params });
  },

  async getWorkshopById(id: string): Promise<WorkshopDto> {
    const res = await httpClient.get<{ data: WorkshopDto }>(`/workshops/${id}`);
    return res.data;
  },

  async createWorkshop(data: any): Promise<WorkshopDto> {
    const res = await httpClient.post<{ data: WorkshopDto }>('/admin/workshops', data);
    return res.data;
  },

  async updateWorkshop(id: string, data: any): Promise<WorkshopDto> {
    const res = await httpClient.patch<{ data: WorkshopDto }>(`/admin/workshops/${id}`, data);
    return res.data;
  },

  // Bus Stands
  async listBusStands(params: Record<string, any> = {}): Promise<PaginatedResult<BusStandManagementDto>> {
    return httpClient.get<PaginatedResult<BusStandManagementDto>>('/bus-stands', { params });
  },

  async getBusStandById(id: string): Promise<BusStandManagementDto> {
    const res = await httpClient.get<{ data: BusStandManagementDto }>(`/bus-stands/${id}`);
    return res.data;
  },

  async createBusStand(data: any): Promise<BusStandManagementDto> {
    const res = await httpClient.post<{ data: BusStandManagementDto }>('/admin/bus-stands', data);
    return res.data;
  },

  async updateBusStand(id: string, data: any): Promise<BusStandManagementDto> {
    const res = await httpClient.patch<{ data: BusStandManagementDto }>(`/admin/bus-stands/${id}`, data);
    return res.data;
  },

  // Transfers
  async listTransfers(params: Record<string, any> = {}): Promise<PaginatedResult<DepotTransferDto>> {
    return httpClient.get<PaginatedResult<DepotTransferDto>>('/admin/transfers', { params });
  },

  async getTransferById(id: string): Promise<DepotTransferDto> {
    const res = await httpClient.get<{ data: DepotTransferDto }>(`/admin/transfers/${id}`);
    return res.data;
  },

  async requestTransfer(data: {
    transferNumber: string;
    busId: string;
    fromDepotId: string;
    toDepotId: string;
    reason: string;
    reasonDetails?: string;
    notes?: string;
  }): Promise<DepotTransferDto> {
    const res = await httpClient.post<{ data: DepotTransferDto }>('/admin/transfers', data);
    return res.data;
  },

  async approveTransfer(id: string, notes?: string): Promise<DepotTransferDto> {
    const res = await httpClient.patch<{ data: DepotTransferDto }>(`/admin/transfers/${id}/approve`, { notes });
    return res.data;
  },

  async rejectTransfer(id: string, notes?: string): Promise<DepotTransferDto> {
    const res = await httpClient.patch<{ data: DepotTransferDto }>(`/admin/transfers/${id}/reject`, { notes });
    return res.data;
  },

  async startTransferTransit(id: string, notes?: string): Promise<DepotTransferDto> {
    const res = await httpClient.patch<{ data: DepotTransferDto }>(`/admin/transfers/${id}/start-transit`, { notes });
    return res.data;
  },

  async completeTransfer(id: string, notes?: string): Promise<DepotTransferDto> {
    const res = await httpClient.patch<{ data: DepotTransferDto }>(`/admin/transfers/${id}/complete`, { notes });
    return res.data;
  },

  async cancelTransfer(id: string, notes?: string): Promise<DepotTransferDto> {
    const res = await httpClient.patch<{ data: DepotTransferDto }>(`/admin/transfers/${id}/cancel`, { notes });
    return res.data;
  }
};

