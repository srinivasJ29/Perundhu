import { httpClient } from './client';
import { PaginatedResult } from '../../types/api';

// =============================================================================
// Fleet Types
// =============================================================================

export interface FleetBusDto {
  id: string;
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  depotId?: string;
  homeDepotId?: string;
  vehicleType: string;
  manufacturer?: string;
  vehicleModel?: string;
  fuelType?: 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';
  seatingCapacity?: number;
  chassisNumber?: string;
  engineNumber?: string;
  registrationDate?: string;
  status: 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';
  isReserveFleet: boolean;
  assignedDriverId?: {
    id: string;
    fullName: string;
    employeeId: string;
    badgeNumber: string;
    contactNumber?: string;
    status: string;
  };
  assignedConductorId?: {
    id: string;
    fullName: string;
    employeeId: string;
    badgeNumber: string;
    contactNumber?: string;
    status: string;
  };
  assignedEtmDeviceId?: {
    id: string;
    deviceId: string;
    deviceModel: string;
    gpsAvailabilityStatus: 'VERIFIED_AVAILABLE' | 'VERIFIED_UNAVAILABLE' | 'UNKNOWN';
    status: string;
  };
  assignedGpsTrackerId?: {
    id: string;
    deviceId: string;
    deviceModel: string;
    gpsAvailabilityStatus: string;
    status: string;
  };
  depot?: {
    id: string;
    nameEn: string;
    nameTa: string;
    code: string;
  };
  currentAssignedTripId?: string;
  currentOdometerKm?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterBusPayload {
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  depotId?: string;
  homeDepotId?: string;
  vehicleType: 'ORDINARY_NON_AC' | 'DELUXE_NON_AC' | 'LOW_FLOOR_AC' | 'POINT_TO_POINT';
  manufacturer?: string;
  vehicleModel?: string;
  fuelType?: 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';
  seatingCapacity?: number;
  chassisNumber?: string;
  engineNumber?: string;
  registrationDate?: string;
  isReserveFleet?: boolean;
}

export interface UpdateBusPayload {
  depotName?: string;
  depotId?: string;
  vehicleType?: 'ORDINARY_NON_AC' | 'DELUXE_NON_AC' | 'LOW_FLOOR_AC' | 'POINT_TO_POINT';
  manufacturer?: string;
  vehicleModel?: string;
  fuelType?: 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';
  seatingCapacity?: number;
  chassisNumber?: string;
  engineNumber?: string;
  registrationDate?: string;
  isReserveFleet?: boolean;
  status?: 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';
  isActive?: boolean;
}

// =============================================================================
// Crew (Driver & Conductor) Types
// =============================================================================

export type CrewRole = 'DRIVER' | 'CONDUCTOR';
export type CrewAvailabilityStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ON_DUTY'
  | 'OFF_DUTY'
  | 'ON_LEAVE'
  | 'INACTIVE'
  | 'ACTIVE'
  | 'SUSPENDED';

export interface CrewMemberDto {
  id: string;
  employeeId: string;
  badgeNumber: string;
  fullName: string;
  role: CrewRole;
  organizationId: string;
  divisionId?: string;
  assignedDepotId: string;
  depot?: {
    id: string;
    nameEn: string;
    nameTa: string;
    code: string;
  };
  contactNumber?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  status: CrewAvailabilityStatus;
  currentAssignedBusId?: string;
  assignedBus?: {
    id: string;
    registrationNumber: string;
    fleetNumber: string;
  };
  assignedEtmDeviceId?: string;
  assignedEtm?: {
    id: string;
    deviceId: string;
    deviceModel: string;
    gpsAvailabilityStatus: string;
  };
  shiftPreference?: 'MORNING' | 'EVENING' | 'NIGHT' | 'ROTATING';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCrewPayload {
  employeeId: string;
  badgeNumber: string;
  fullName: string;
  organizationId: string;
  divisionId?: string;
  assignedDepotId: string;
  contactNumber?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  shiftPreference?: 'MORNING' | 'EVENING' | 'NIGHT' | 'ROTATING';
}

export interface UpdateCrewPayload {
  fullName?: string;
  badgeNumber?: string;
  assignedDepotId?: string;
  contactNumber?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  shiftPreference?: 'MORNING' | 'EVENING' | 'NIGHT' | 'ROTATING';
}

// =============================================================================
// Device Registry Types (ETM & GPS Tracker)
// =============================================================================

export type DeviceCategory = 'ETM' | 'GPS_TRACKER';
export type GpsAvailabilityStatus = 'VERIFIED_AVAILABLE' | 'VERIFIED_UNAVAILABLE' | 'UNKNOWN';
export type DeviceOperationalStatus = 'ACTIVE' | 'STANDBY' | 'FAULTY' | 'UNREGISTERED' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED';
export type DeviceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

export interface DeviceRegistryDto {
  id: string;
  deviceId: string;
  deviceCategory: DeviceCategory;
  manufacturer: string;
  deviceModel: string;
  serialNumber?: string;
  imei?: string;
  simIccid?: string;
  simPhoneNumber?: string;
  operatingSystem?: string;
  firmwareVersion?: string;
  gpsAvailabilityStatus: GpsAvailabilityStatus;
  gpsVerificationStatus?: string;
  supportedProtocols: string[];
  installationStatus?: 'UNINSTALLED' | 'INSTALLED' | 'MAINTENANCE_REMOVED';
  networkGenerations: string[];
  status: DeviceOperationalStatus;
  healthStatus: DeviceHealthStatus;
  depotId: string;
  depot?: {
    id: string;
    nameEn: string;
    nameTa: string;
    code: string;
  };
  currentAssignedBusId?: string;
  currentAssignedBus?: {
    id: string;
    registrationNumber: string;
    fleetNumber: string;
  };
  currentAssignedCrewId?: string;
  currentAssignedCrew?: {
    id: string;
    fullName: string;
    employeeId: string;
    role: string;
  };
  batteryHealthPercent?: number;
  lastHeartbeatAt?: string;
  lastCommunicationAt?: string;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEtmPayload {
  deviceId: string;
  manufacturer: string;
  deviceModel: string;
  depotId: string;
  serialNumber?: string;
  imei?: string;
  simIccid?: string;
  simPhoneNumber?: string;
  operatingSystem?: string;
  firmwareVersion?: string;
  gpsAvailabilityStatus?: GpsAvailabilityStatus;
  gpsVerificationStatus?: string;
  batteryHealthPercent?: number;
}

export interface CreateGpsTrackerPayload {
  deviceId: string;
  manufacturer: string;
  deviceModel: string;
  depotId: string;
  serialNumber?: string;
  imei?: string;
  simIccid?: string;
  simPhoneNumber?: string;
  firmwareVersion?: string;
  supportedProtocols?: ('HTTP' | 'HTTPS' | 'MQTT' | 'TCP')[];
  installationStatus?: 'UNINSTALLED' | 'INSTALLED' | 'MAINTENANCE_REMOVED';
}

export interface UpdateDevicePayload {
  manufacturer?: string;
  deviceModel?: string;
  serialNumber?: string;
  imei?: string;
  simIccid?: string;
  simPhoneNumber?: string;
  operatingSystem?: string;
  firmwareVersion?: string;
  gpsAvailabilityStatus?: GpsAvailabilityStatus;
  gpsVerificationStatus?: string;
  batteryHealthPercent?: number;
  depotId?: string;
  installationStatus?: 'UNINSTALLED' | 'INSTALLED' | 'MAINTENANCE_REMOVED';
  status?: DeviceOperationalStatus;
}

// =============================================================================
// Assignment History & Records
// =============================================================================

export interface AssignmentRecordDto {
  id: string;
  assignmentType: 'BUS_ETM' | 'BUS_GPS' | 'CONDUCTOR_ETM' | 'DRIVER_BUS' | 'BUS_DEPOT';
  busId?: {
    _id: string;
    registrationNumber: string;
    fleetNumber: string;
  };
  crewId?: {
    _id: string;
    employeeId: string;
    fullName: string;
    role: string;
  };
  deviceId?: {
    _id: string;
    deviceId: string;
    deviceCategory: string;
    deviceModel: string;
  };
  depotId?: {
    _id: string;
    nameEn: string;
    code: string;
  };
  status: 'ACTIVE' | 'UNASSIGNED' | 'SUPERSEDED';
  assignedAt: string;
  assignedBy: string;
  unassignedAt?: string;
  unassignedBy?: string;
  notes?: string;
  createdAt: string;
}

// =============================================================================
// Fleet & Device Monitoring Statistics
// =============================================================================

export interface FleetAndDeviceStatsDto {
  fleet: {
    total: number;
    inService: number;
    maintenance: number;
    offline: number;
    reserveFleet: number;
    withGps: number;
    withEtm: number;
  };
  crew: {
    totalDrivers: number;
    availableDrivers: number;
    assignedDrivers: number;
    onDutyDrivers: number;
    totalConductors: number;
    availableConductors: number;
    assignedConductors: number;
    onDutyConductors: number;
  };
  devices: {
    totalEtms: number;
    etmsOnline: number;
    etmsWithGpsVerified: number;
    etmsGpsUnknown: number;
    etmsGpsUnavailable: number;
    totalGpsTrackers: number;
    gpsTrackersOnline: number;
    installedGpsTrackers: number;
    communicationThresholdMinutes: number;
  };
}

// =============================================================================
// API Service Methods
// =============================================================================

export const fleetStaffDeviceService = {
  // ---------------------------------------------------------------------------
  // Fleet Buses
  // ---------------------------------------------------------------------------
  async listBuses(params: Record<string, any> = {}): Promise<PaginatedResult<FleetBusDto>> {
    return httpClient.get<PaginatedResult<FleetBusDto>>('/buses', { params });
  },

  async getBusById(id: string): Promise<FleetBusDto> {
    const res = await httpClient.get<{ data: FleetBusDto }>(`/buses/${id}`);
    return res.data;
  },

  async createBus(payload: RegisterBusPayload): Promise<FleetBusDto> {
    const res = await httpClient.post<{ data: FleetBusDto }>('/admin/buses', payload);
    return res.data;
  },

  async updateBus(id: string, payload: UpdateBusPayload): Promise<FleetBusDto> {
    const res = await httpClient.patch<{ data: FleetBusDto }>(`/admin/buses/${id}`, payload);
    return res.data;
  },

  async updateBusStatus(id: string, status: 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE'): Promise<FleetBusDto> {
    const res = await httpClient.patch<{ data: FleetBusDto }>(`/admin/buses/${id}/status`, { status });
    return res.data;
  },

  async assignBusDepot(busId: string, depotId: string, notes?: string): Promise<FleetBusDto> {
    const res = await httpClient.patch<{ data: FleetBusDto }>(`/admin/buses/${busId}/depot`, {
      depotId,
      notes
    });
    return res.data;
  },

  async getBusAssignments(busId: string): Promise<AssignmentRecordDto[]> {
    const res = await httpClient.get<{ data: AssignmentRecordDto[] }>(`/buses/${busId}/assignments`);
    return res.data;
  },

  // ---------------------------------------------------------------------------
  // Drivers
  // ---------------------------------------------------------------------------
  async listDrivers(params: Record<string, any> = {}): Promise<PaginatedResult<CrewMemberDto>> {
    return httpClient.get<PaginatedResult<CrewMemberDto>>('/drivers', { params });
  },

  async getDriverById(id: string): Promise<CrewMemberDto> {
    const res = await httpClient.get<{ data: CrewMemberDto }>(`/drivers/${id}`);
    return res.data;
  },

  async createDriver(payload: CreateCrewPayload): Promise<CrewMemberDto> {
    const res = await httpClient.post<{ data: CrewMemberDto }>('/admin/drivers', payload);
    return res.data;
  },

  async updateDriver(id: string, payload: UpdateCrewPayload): Promise<CrewMemberDto> {
    const res = await httpClient.patch<{ data: CrewMemberDto }>(`/admin/drivers/${id}`, payload);
    return res.data;
  },

  async updateDriverStatus(id: string, status: CrewAvailabilityStatus): Promise<CrewMemberDto> {
    const res = await httpClient.patch<{ data: CrewMemberDto }>(`/admin/drivers/${id}/status`, { status });
    return res.data;
  },

  async getDriverAssignments(id: string): Promise<AssignmentRecordDto[]> {
    const res = await httpClient.get<{ data: AssignmentRecordDto[] }>(`/drivers/${id}/assignments`);
    return res.data;
  },

  // ---------------------------------------------------------------------------
  // Conductors
  // ---------------------------------------------------------------------------
  async listConductors(params: Record<string, any> = {}): Promise<PaginatedResult<CrewMemberDto>> {
    return httpClient.get<PaginatedResult<CrewMemberDto>>('/conductors', { params });
  },

  async getConductorById(id: string): Promise<CrewMemberDto> {
    const res = await httpClient.get<{ data: CrewMemberDto }>(`/conductors/${id}`);
    return res.data;
  },

  async createConductor(payload: CreateCrewPayload): Promise<CrewMemberDto> {
    const res = await httpClient.post<{ data: CrewMemberDto }>('/admin/conductors', payload);
    return res.data;
  },

  async updateConductor(id: string, payload: UpdateCrewPayload): Promise<CrewMemberDto> {
    const res = await httpClient.patch<{ data: CrewMemberDto }>(`/admin/conductors/${id}`, payload);
    return res.data;
  },

  async updateConductorStatus(id: string, status: CrewAvailabilityStatus): Promise<CrewMemberDto> {
    const res = await httpClient.patch<{ data: CrewMemberDto }>(`/admin/conductors/${id}/status`, { status });
    return res.data;
  },

  async getConductorAssignments(id: string): Promise<AssignmentRecordDto[]> {
    const res = await httpClient.get<{ data: AssignmentRecordDto[] }>(`/conductors/${id}/assignments`);
    return res.data;
  },

  // ---------------------------------------------------------------------------
  // ETM Devices
  // ---------------------------------------------------------------------------
  async listEtms(params: Record<string, any> = {}): Promise<PaginatedResult<DeviceRegistryDto>> {
    return httpClient.get<PaginatedResult<DeviceRegistryDto>>('/devices/etms', { params });
  },

  async getEtmById(id: string): Promise<DeviceRegistryDto> {
    const res = await httpClient.get<{ data: DeviceRegistryDto }>(`/devices/etms/${id}`);
    return res.data;
  },

  async createEtm(payload: CreateEtmPayload): Promise<DeviceRegistryDto> {
    const res = await httpClient.post<{ data: DeviceRegistryDto }>('/admin/devices/etms', payload);
    return res.data;
  },

  async updateEtm(id: string, payload: UpdateDevicePayload): Promise<DeviceRegistryDto> {
    const res = await httpClient.patch<{ data: DeviceRegistryDto }>(`/admin/devices/etms/${id}`, payload);
    return res.data;
  },

  // ---------------------------------------------------------------------------
  // GPS Trackers
  // ---------------------------------------------------------------------------
  async listGpsTrackers(params: Record<string, any> = {}): Promise<PaginatedResult<DeviceRegistryDto>> {
    return httpClient.get<PaginatedResult<DeviceRegistryDto>>('/devices/gps-trackers', { params });
  },

  async getGpsTrackerById(id: string): Promise<DeviceRegistryDto> {
    const res = await httpClient.get<{ data: DeviceRegistryDto }>(`/devices/gps-trackers/${id}`);
    return res.data;
  },

  async createGpsTracker(payload: CreateGpsTrackerPayload): Promise<DeviceRegistryDto> {
    const res = await httpClient.post<{ data: DeviceRegistryDto }>('/admin/devices/gps-trackers', payload);
    return res.data;
  },

  async updateGpsTracker(id: string, payload: UpdateDevicePayload): Promise<DeviceRegistryDto> {
    const res = await httpClient.patch<{ data: DeviceRegistryDto }>(`/admin/devices/gps-trackers/${id}`, payload);
    return res.data;
  },

  // Common Device Status
  async updateDeviceStatus(id: string, status: DeviceOperationalStatus): Promise<DeviceRegistryDto> {
    const res = await httpClient.patch<{ data: DeviceRegistryDto }>(`/admin/devices/${id}/status`, { status });
    return res.data;
  },

  // ---------------------------------------------------------------------------
  // Controlled Assignments
  // ---------------------------------------------------------------------------
  async assignBusEtm(busId: string, deviceId?: string, notes?: string): Promise<any> {
    const res = await httpClient.post<{ data: any }>('/admin/assignments/bus-etm', {
      busId,
      deviceId,
      notes
    });
    return res.data;
  },

  async assignBusGps(busId: string, deviceId?: string, notes?: string): Promise<any> {
    const res = await httpClient.post<{ data: any }>('/admin/assignments/bus-gps', {
      busId,
      deviceId,
      notes
    });
    return res.data;
  },

  async assignConductorEtm(crewId: string, deviceId?: string, notes?: string): Promise<any> {
    const res = await httpClient.post<{ data: any }>('/admin/assignments/conductor-etm', {
      crewId,
      deviceId,
      notes
    });
    return res.data;
  },

  async assignDriverBus(crewId: string, busId?: string, notes?: string): Promise<any> {
    const res = await httpClient.post<{ data: any }>('/admin/assignments/driver-bus', {
      crewId,
      busId,
      notes
    });
    return res.data;
  },

  async listAssignments(params: Record<string, any> = {}): Promise<PaginatedResult<AssignmentRecordDto>> {
    return httpClient.get<PaginatedResult<AssignmentRecordDto>>('/admin/assignments', { params });
  },

  // ---------------------------------------------------------------------------
  // Monitoring Statistics
  // ---------------------------------------------------------------------------
  async getFleetAndDeviceStats(): Promise<FleetAndDeviceStatsDto> {
    const res = await httpClient.get<{ data: FleetAndDeviceStatsDto }>('/stats/fleet-devices');
    return res.data;
  }
};

