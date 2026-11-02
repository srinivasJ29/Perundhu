/**
 * PERUNDHU (பேருந்து) — Phase 12 Dashboard Operations Types
 * Strict server-side contracts for Transport Admin, Depot Manager, Dispatcher,
 * Driver, and Conductor command centres with verified data integrity.
 */

export interface TransportAdminDashboardData {
  metrics: {
    totalRegisteredBuses: number;
    activeBuses: number;
    inactiveBuses: number;
    reserveBuses: number;
    maintenanceBuses: number;
    busesInTransit: number;
    gpsConnectedBuses: number;
    gpsStaleBuses: number;
    gpsOfflineBuses: number;
    totalTripsToday: number;
    activeScheduledTrips: number;
    completedTrips: number;
    delayedTrips: number;
    cancelledTrips: number;
    activeAlertsCount: number;
    fleetUtilizationPercent: number;
    driverAvailability: {
      total: number;
      available: number;
      assigned: number;
      onDuty: number;
      onLeave: number;
    };
    conductorAvailability: {
      total: number;
      available: number;
      assigned: number;
      onDuty: number;
      onLeave: number;
    };
  };
  depotFleetSummary: Array<{
    depotId: string;
    depotCode: string;
    depotNameEn: string;
    depotNameTa: string;
    totalBuses: number;
    activeBuses: number;
    inTransitBuses: number;
    reserveBuses: number;
  }>;
  divisionOverview: Array<{
    divisionId: string;
    divisionCode: string;
    nameEn: string;
    nameTa: string;
    depotCount: number;
    busCount: number;
    tripCount: number;
  }>;
  recentAlerts: Array<{
    id: string;
    titleEn: string;
    titleTa: string;
    severity: string;
    category: string;
    routeNumber?: string;
    createdAt: string;
  }>;
  etaServiceStatus: {
    status: 'OPERATIONAL' | 'DEGRADED';
    activeModel: string;
    confidence: number;
    fallbackActive: boolean;
  };
  generatedAt: string;
}

export interface DepotManagerDashboardData {
  depot: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
    totalCapacity: number;
    divisionName?: string;
  };
  fleetSummary: {
    total: number;
    active: number;
    inTransit: number;
    reserve: number;
    maintenance: number;
    offline: number;
  };
  buses: Array<{
    id: string;
    registrationNumber: string;
    fleetNumber: string;
    vehicleType: string;
    status: string;
    isReserve: boolean;
    currentTripCode?: string;
    lastGpsUpdate?: string;
    gpsFreshness: 'CONNECTED' | 'STALE' | 'OFFLINE';
  }>;
  departures: Array<{
    id: string;
    tripCode: string;
    routeNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
    assignedBusNumber?: string;
    assignedBusId?: string;
    assignedDriverName?: string;
    assignedDriverId?: string;
    assignedConductorName?: string;
    assignedConductorId?: string;
    isDelayed: boolean;
    delayMins: number;
  }>;
  staffSummary: {
    totalDrivers: number;
    availableDrivers: number;
    assignedDrivers: number;
    onLeaveDrivers: number;
    totalConductors: number;
    availableConductors: number;
    assignedConductors: number;
    onLeaveConductors: number;
  };
  devicesSummary: {
    totalEtms: number;
    onlineEtms: number;
    lowBatteryEtms: number;
    totalGpsTrackers: number;
    onlineGpsTrackers: number;
  };
  generatedAt: string;
}

export interface DispatcherDashboardData {
  operatingBuses: Array<{
    busId: string;
    registrationNumber: string;
    fleetNumber: string;
    routeNumber?: string;
    tripCode?: string;
    currentSpeed: number;
    heading: number;
    coordinates: [number, number];
    lastRecordedAt: string;
    freshnessCategory: 'FRESH' | 'RECENT' | 'STALE' | 'CRITICAL';
    sourceProvenance: string;
    isSimulated: boolean;
    trackingStatus: string;
  }>;
  activeTrips: Array<{
    tripId: string;
    tripCode: string;
    routeNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    busRegistration?: string;
    driverName?: string;
    progressPercent: number;
    delayMinutes: number;
    status: string;
  }>;
  delayedTrips: Array<{
    tripId: string;
    tripCode: string;
    routeNumber: string;
    departureTime: string;
    scheduledVsActualDiffMins: number;
    remarks?: string;
  }>;
  upcomingDepartures: Array<{
    tripId: string;
    tripCode: string;
    routeNumber: string;
    departureTime: string;
    timeUntilDepartureMins: number;
    busAssigned: boolean;
    driverAssigned: boolean;
  }>;
  operationalAlerts: Array<{
    id: string;
    severity: string;
    messageEn: string;
    messageTa: string;
    createdAt: string;
  }>;
  generatedAt: string;
}

export interface DriverDashboardData {
  driver: {
    id: string;
    employeeId: string;
    badgeNumber: string;
    fullName: string;
    depotName?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    status: string;
  };
  assignedBus: {
    id: string;
    registrationNumber: string;
    fleetNumber: string;
    vehicleType: string;
    livery: string;
  } | null;
  activeTrip: {
    id: string;
    tripCode: string;
    routeNumber: string;
    originStopName: string;
    destinationStopName: string;
    departureTime: string;
    arrivalTime: string;
    totalDistanceKm: number;
    status: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
    isReady: boolean;
    orderedStops: Array<{
      sequence: number;
      stopId: string;
      nameEn: string;
      nameTa: string;
      scheduledTime: string;
      isPassed: boolean;
    }>;
    gpsStatus: {
      connected: boolean;
      source: string;
      lastPing?: string;
    };
    etmStatus: {
      paired: boolean;
      deviceModel?: string;
      conductorName?: string;
    };
  } | null;
  recentTrips: Array<{
    id: string;
    tripCode: string;
    routeNumber: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
    completedAt?: string;
  }>;
  operationalNotices: Array<{
    id: string;
    title: string;
    message: string;
    severity: string;
    createdAt: string;
  }>;
  generatedAt: string;
}

export interface ConductorDashboardData {
  conductor: {
    id: string;
    employeeId: string;
    badgeNumber: string;
    fullName: string;
    depotName?: string;
    status: string;
  };
  assignedTrip: {
    id: string;
    tripCode: string;
    routeNumber: string;
    originStopName: string;
    destinationStopName: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
    busRegistration?: string;
    orderedStops: Array<{
      sequence: number;
      stopId: string;
      nameEn: string;
      nameTa: string;
      scheduledTime: string;
      fareStage?: string;
    }>;
  } | null;
  etmDevice: {
    id?: string;
    deviceId?: string;
    deviceModel?: string;
    batteryLevelPercent?: number;
    connectionStatus: 'ONLINE' | 'OFFLINE' | 'UNPAIRED';
    telemetryNotice: string;
  };
  operationalNotices: Array<{
    id: string;
    title: string;
    message: string;
    severity: string;
    createdAt: string;
  }>;
  tripHistory: Array<{
    id: string;
    tripCode: string;
    routeNumber: string;
    date: string;
    status: string;
  }>;
  generatedAt: string;
}

export type ReportType =
  | 'FLEET_STATUS'
  | 'TRIP_COMPLETION'
  | 'ROUTE_PERFORMANCE'
  | 'GPS_DEVICE_HEALTH'
  | 'STAFF_ASSIGNMENTS';

