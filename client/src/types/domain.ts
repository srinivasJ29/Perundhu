/**
 * PERUNDHU (பேருந்து) — Shared Domain Types
 * Strictly aligned with verified backend domain models
 */

// =============================================================================
// 1. GeoJSON Primitives
// =============================================================================

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][]; // Array of [longitude, latitude]
}

// =============================================================================
// 2. Authentication & User RBAC
// =============================================================================

export type UserRole =
  | 'PASSENGER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'TRANSPORT_ADMIN'
  | 'REGIONAL_ADMIN'
  | 'DIVISION_ADMIN'
  | 'DEPOT_MANAGER'
  | 'WORKSHOP_MANAGER'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'CONDUCTOR'
  | 'ANALYST';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status?: 'ACTIVE' | 'DISABLED';
  isActive?: boolean;
  organizationId?: string;
  divisionId?: string;
  depotId?: string;
  workshopId?: string;
  crewMemberId?: string;
  badgeNumber?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthSessionData {
  user: UserDto;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResult {
  user: UserDto;
  accessToken: string;
  refreshToken?: string;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
}

// =============================================================================
// 3. Districts & Bus Stands
// =============================================================================

export interface DistrictDto {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  headquarters: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusStandDto {
  id: string;
  districtId: string;
  code: string;
  nameEn: string;
  nameTa: string;
  location: GeoJsonPoint;
  standType: string;
  totalPlatforms: number;
  createdAt: string;
  updatedAt: string;
}

export interface NearbyBusStandDto extends BusStandDto {
  distanceMeters: number;
}

// =============================================================================
// 4. Routes, Directions & Stops
// =============================================================================

export interface StopDetailDto {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  location: GeoJsonPoint;
  landmark?: string;
}

export interface DirectionStopSequenceDto {
  sequenceOrder: number;
  distanceFromOriginKm: number;
  cumulativeDurationMinutes: number;
  isFareStage: boolean;
  stop: StopDetailDto;
}

export interface RouteSummaryDto {
  id: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  serviceCategory: string;
}

export interface StandSummaryDto {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  totalPlatforms?: number;
  location?: GeoJsonPoint;
}

export interface RouteDirectionDetailDto {
  route: RouteSummaryDto;
  direction: {
    id: string;
    directionCode: 'OUTBOUND' | 'INBOUND';
    totalDistanceKm: number;
    estimatedDurationMins: number;
    originStand?: StandSummaryDto | null;
    destinationStand?: StandSummaryDto | null;
    originStopId: string;
    destinationStopId: string;
    routePolyline: GeoJsonLineString | null;
    stopsCount: number;
    stops: DirectionStopSequenceDto[];
  };
}

export interface StandRouteDirectionDto {
  id: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  totalDistanceKm: number;
  estimatedDurationMins: number;
  originStopId: string;
  destinationStopId: string;
  stopSequenceAtStand?: number;
}

export interface StandRouteDto {
  id: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  serviceCategory: string;
  directions: StandRouteDirectionDto[];
}

// =============================================================================
// 5. Bus Fleet & Scheduled Trips
// =============================================================================

export type BusVehicleType =
  | 'ORDINARY_NON_AC'
  | 'DELUXE_NON_AC'
  | 'LOW_FLOOR_AC'
  | 'POINT_TO_POINT';

export type BusOperationalStatus = 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';

export interface BusDto {
  id: string;
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  vehicleType: BusVehicleType;
  status: BusOperationalStatus;
  isTrackingActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TripOperationalStatus =
  | 'SCHEDULED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ScheduledTripDto {
  id: string;
  tripCode: string;
  routeDirectionId: string;
  busId?: string;
  departureTime: string;
  arrivalTime: string;
  operationalDays: string[];
  status: TripOperationalStatus;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 6. Timetables & Departures
// =============================================================================

export interface RouteTimetableTripDto {
  tripId: string;
  tripCode: string;
  busFleetNumber?: string;
  departureTime: string;
  arrivalTime: string;
  status: TripOperationalStatus;
}

export interface RouteTimetableDto {
  routeId: string;
  routeNumber: string;
  dayOfWeek: string;
  outbound: RouteTimetableTripDto[];
  inbound: RouteTimetableTripDto[];
}

export interface StopDepartureItemDto {
  tripId: string;
  tripCode: string;
  routeNumber: string;
  destinationNameEn: string;
  destinationNameTa: string;
  scheduledDepartureTime: string;
}

export interface StopDeparturesDto {
  stopId: string;
  stopNameEn: string;
  stopNameTa: string;
  departures: StopDepartureItemDto[];
}

// =============================================================================
// 7. Real-Time Status, Next Stop & Dynamic ETA
// =============================================================================

export type StopArrivalStatus =
  | 'APPROACHING'
  | 'ARRIVED'
  | 'DEPARTED'
  | 'TERMINAL_REACHED';

export type TrackingTelemetryStatus =
  | 'LIVE'
  | 'SIMULATED'
  | 'DELAYED'
  | 'STALE'
  | 'DEVIATED'
  | 'OFFLINE'
  | 'UNAVAILABLE';

export type LocationTelemetrySource =
  | 'VEHICLE_HARDWARE_GPS'
  | 'OFFICIAL_FLEET_FEED'
  | 'AUTHORIZED_MOBILE_GPS'
  | 'DRIVER_MOBILE_APP'
  | 'ETM_GPS'
  | 'MANUAL_DISPATCH'
  | 'SIMULATOR';

export interface NextStopDetectionDto {
  tripId: string;
  busId: string;
  routeId?: string;
  status: StopArrivalStatus;
  nextStop: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
    sequence: number;
    distanceFromOriginMeters: number;
  } | null;
  progressRatio?: number;
  distanceAlongRouteMeters?: number;
  trackingStatus: TrackingTelemetryStatus;
}

export interface DownstreamStopEtaDto {
  stopId: string;
  stopCode: string;
  stopNameEn: string;
  stopNameTa: string;
  stopSequence: number;
  etaMinutes: number;
  estimatedArrivalAt: string | null;
  remainingDistanceMeters: number;
  effectiveSpeedKmph?: number;
  confidenceIntervalSeconds?: [number, number];
  confidenceLowerMinutes?: number;
  confidenceUpperMinutes?: number;
  predictionSource?: 'ML_PREDICTION' | 'BASELINE_ESTIMATE' | 'OFFICIAL_SCHEDULE' | 'ETA_UNAVAILABLE' | string;
  modelVersion?: string;
  fallbackReason?: string;
}

export interface DynamicTripEtaDto {
  tripId: string;
  busId: string;
  routeId: string;
  trackingStatus: TrackingTelemetryStatus;
  source: LocationTelemetrySource;
  isRealTimePrediction: boolean;
  predictionSource: 'ML_PREDICTION' | 'BASELINE_ESTIMATE' | 'OFFICIAL_SCHEDULE' | 'ETA_UNAVAILABLE' | string;
  confidence?: number;
  modelVersion?: string;
  fallbackReason?: string;
  nextStop: DownstreamStopEtaDto | null;
  downstreamStops: DownstreamStopEtaDto[];
  generatedAt: string;
}

export interface DynamicBusEtaDto {
  busId: string;
  registrationNumber: string;
  fleetNumber: string;
  activeTrip: ScheduledTripDto | null;
  trackingStatus: TrackingTelemetryStatus;
  source: LocationTelemetrySource;
  isRealTimePrediction: boolean;
  predictionSource: 'ML_PREDICTION' | 'BASELINE_ESTIMATE' | 'OFFICIAL_SCHEDULE' | 'ETA_UNAVAILABLE' | string;
  confidence?: number;
  modelVersion?: string;
  fallbackReason?: string;
  message?: string;
  downstreamStops: DownstreamStopEtaDto[];
}

export interface BusLiveIntelligenceDto {
  movementStatus: 'MOVING' | 'STATIONARY' | 'DWELLING' | 'UNAVAILABLE';
  currentSpeedKmph: number | null;
  compassHeading: { degrees: number; direction: string } | null;
  routeProgress: {
    progressPercent: number;
    distanceTraveledKm: number;
    totalDistanceKm: number;
    currentSegmentIndex: number;
    totalSegments: number;
  } | null;
  lastConfirmedStop: {
    stopId: string;
    stopCode: string;
    nameEn: string;
    nameTa: string;
    sequence: number;
  } | null;
  nextExpectedStop: {
    stopId: string;
    stopCode: string;
    nameEn: string;
    nameTa: string;
    sequence: number;
    distanceMeters: number;
    etaMinutes: number | null;
    estimatedArrivalAt?: string | null;
    confidenceIntervalSeconds?: [number, number];
  } | null;
  stopsItinerary: Array<{
    stopId: string;
    stopCode: string;
    nameEn: string;
    nameTa: string;
    sequence: number;
    location: [number, number];
    status: 'CONFIRMED_PASSED' | 'CURRENT_STOP' | 'UPCOMING';
    distanceFromOriginKm: number;
    etaMinutes?: number;
    estimatedArrivalAt?: string | null;
    confidenceIntervalSeconds?: [number, number];
    predictionSource?: string;
    isFareStage?: boolean;
  }>;
}

export interface BusLiveDetailDto {
  bus: {
    id: string;
    registrationNumber: string;
    fleetNumber: string;
    vehicleType: string;
    manufacturer?: string;
    vehicleModel?: string;
    fuelType?: string;
    seatingCapacity?: number;
    status: string;
    isReserveFleet: boolean;
  };
  depot: {
    id: string;
    name: string;
    code: string;
  } | null;
  assignedTrip: {
    id: string;
    tripCode: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
  } | null;
  route: {
    id: string;
    routeNumber: string;
    displayTitleEn: string;
    displayTitleTa: string;
  } | null;
  direction: {
    id: string;
    directionCode: string;
    totalDistanceKm?: number;
    estimatedDurationMins?: number;
  } | null;
  routeDetails?: RouteDirectionDetailDto | null;
  latestPosition: {
    coordinates: [number, number]; // [longitude, latitude]
    snappedCoordinates?: [number, number];
    heading: number;
    speedKmph: number;
    progressRatio?: number;
    distanceAlongRouteMeters?: number;
    totalRouteDistanceMeters?: number;
    trackingStatus: TrackingTelemetryStatus;
    source: LocationTelemetrySource;
    isSimulated: boolean;
    freshness: 'HEALTHY' | 'DELAYED' | 'STALE' | 'OFFLINE' | 'UNKNOWN';
    satellitesCount?: number;
    altitudeMeters?: number;
    gpsFixStatus?: string;
    batteryPercent?: number;
    networkSignalDbm?: number;
    recordedAt: string;
    receivedAt: string;
  } | null;
  deviceHealth?: {
    deviceId?: string;
    overallStatus: string;
    networkConnectivity: 'ONLINE' | 'DELAYED' | 'STALE' | 'OFFLINE';
    gpsSignalStatus: 'ACQUIRED_3D' | 'ACQUIRED_2D' | 'NO_FIX' | 'UNKNOWN';
    diagnosticSummary?: string;
    satellitesTracked?: number;
    batteryPercent?: number;
    latencySeconds?: number;
  } | null;
  eta?: DynamicBusEtaDto | null;
  intelligence?: BusLiveIntelligenceDto;
}

// =============================================================================
// 8. Health & System Status
// =============================================================================

export interface SystemHealthDto {
  status: 'healthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
}

export interface SystemReadinessDto {
  status: 'ready' | 'not_ready';
  timestamp: string;
  dependencies: {
    database: string;
  };
}

// =============================================================================
// 9. Service Alerts & Transit Advisories
// =============================================================================

export type ServiceAlertType =
  | 'ADVISORY'
  | 'DISRUPTION'
  | 'ROUTE_DIVERSION'
  | 'FESTIVAL_SPECIAL'
  | 'WEATHER_NOTICE';

export type ServiceAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface ServiceAlertDto {
  id: string;
  titleEn: string;
  titleTa: string;
  descriptionEn: string;
  descriptionTa: string;
  alertType: ServiceAlertType;
  severity: ServiceAlertSeverity;
  districtCode: string;
  affectedRouteNumbers: string[];
  affectedStandCodes?: string[];
  effectiveFrom: string;
  effectiveUntil: string;
  isActive: boolean;
  sourceOrganization: string;
  sourceUrl?: string;
  verifiedAt: string;
}

// =============================================================================
// 10. Intelligent Fleet Analytics & Optimization (Phase 10)
// =============================================================================

export type DataClassification =
  | 'OFFICIAL_VERIFIED'
  | 'AUTHORIZED_IMPORTED'
  | 'SECONDARY_VERIFIED'
  | 'COMMUNITY_SOURCED'
  | 'ESTIMATED'
  | 'PENDING_VERIFICATION'
  | 'RETIRED';

export interface DataProvenanceDto {
  sourceOrganization: string;
  sourceReference: string;
  retrievalTimestamp: string;
  dataCoverage: string;
  classification: DataClassification;
  verificationStatus: 'VERIFIED' | 'PROVISIONAL' | 'UNVERIFIED';
  processingVersion: string;
  lastVerifiedTimestamp?: string;
}

export interface FleetOverviewKpiDto {
  totalBuses: number;
  activeBuses: number;
  maintenanceBuses: number;
  offlineBuses: number;
  gpsFreshnessBreakdown: {
    healthy: number;
    delayed: number;
    stale: number;
    offline: number;
    unknown: number;
  };
  operationalAvailabilityBreakdown: {
    inService: number;
    maintenance: number;
    offline: number;
    available: number;
    reserve: number;
  };
  depotDistribution: Array<{
    depotId: string;
    depotName: string;
    depotCode: string;
    totalBuses: number;
    activeBuses: number;
    reserveBuses: number;
    maintenanceBuses: number;
  }>;
  routeDistribution: Array<{
    routeId: string;
    routeNumber: string;
    displayTitleEn: string;
    displayTitleTa: string;
    assignedBusesCount: number;
    activeTrackingBusesCount: number;
  }>;
  telemetryHealth: {
    totalPositionsRecorded: number;
    averageUpdateIntervalSeconds: number;
    coverageRatio: number;
  };
  dataProvenance: DataProvenanceDto;
  generatedAt: string;
}

export interface RoutePerformanceDto {
  routeId: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  directionCode: string;
  samplePeriod: {
    from: string;
    to: string;
    observedTripsCount: number;
  };
  averageDurationMinutes: number;
  scheduledDurationMinutes: number;
  p50DurationMinutes: number;
  p90DurationMinutes: number;
  durationVariance: number;
  averageDwellTimeSeconds: number;
  segments: Array<{
    fromStopId: string;
    fromStopNameEn: string;
    fromStopNameTa: string;
    toStopId: string;
    toStopNameEn: string;
    toStopNameTa: string;
    averageTravelTimeMinutes: number;
    scheduledTravelTimeMinutes: number;
    delayDeviationMinutes: number;
    congestionLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CONGESTED';
  }>;
  gpsCoverageRatio: number;
  dataProvenance: DataProvenanceDto;
}

export interface ScheduleAdherenceDto {
  routeId: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  samplePeriod: {
    from: string;
    to: string;
    evaluatedTripsCount: number;
  };
  onTimePercentage: number;
  delayedPercentage: number;
  earlyPercentage: number;
  averageDelayMinutes: number;
  maxDelayMinutes: number;
  delayDistribution: {
    onTime: number;
    slightDelay: number;
    moderateDelay: number;
    severeDelay: number;
    early: number;
  };
  adherenceByStop: Array<{
    stopId: string;
    stopNameEn: string;
    stopNameTa: string;
    sequence: number;
    onTimePercentage: number;
    averageDelayMinutes: number;
  }>;
  dataProvenance: DataProvenanceDto;
}

export interface DemandAnalyticsDto {
  status: 'DATA_AVAILABLE' | 'DATA_NOT_AVAILABLE';
  dataReadiness: {
    isAvailable: boolean;
    totalRecords: number;
    verifiedEtmStreamConnected: boolean;
    apcSensorStreamConnected: boolean;
    diagnosticMessageEn: string;
    diagnosticMessageTa: string;
    missingPrerequisites: string[];
    governanceNotice: string;
  };
  summary?: {
    totalBoardings: number;
    totalAlightings: number;
    busiestStop?: {
      stopId: string;
      stopNameEn: string;
      stopNameTa: string;
      boardings: number;
    };
    peakHour?: {
      hour: number;
      label: string;
      boardings: number;
    };
  };
  hourlyPattern?: Array<{
    hour: number;
    label: string;
    boardings: number;
    alightings: number;
  }>;
  stopDemand?: Array<{
    stopId: string;
    stopNameEn: string;
    stopNameTa: string;
    boardings: number;
    alightings: number;
  }>;
  dataProvenance: DataProvenanceDto;
}

export interface FleetUtilizationDto {
  period: {
    from: string;
    to: string;
  };
  fleetSize: number;
  scheduledTripsCount: number;
  assignedTripsCount: number;
  completedTripsCount: number;
  vehicleUtilizationRate: number;
  depotUtilization: Array<{
    depotId: string;
    depotName: string;
    totalFleet: number;
    inServiceCount: number;
    reserveCount: number;
    maintenanceCount: number;
    utilizationPercentage: number;
  }>;
  unassignedVehiclesCount: number;
  telemetryGapsCount: number;
  dataProvenance: DataProvenanceDto;
}

export type RecommendationCategory =
  | 'DEPOT_IMBALANCE'
  | 'ROUTE_DELAY'
  | 'INSUFFICIENT_COVERAGE'
  | 'ALLOCATION_IMPROVEMENT'
  | 'GPS_COVERAGE_GAP'
  | 'DATA_COLLECTION_GAP';

export type RecommendationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HumanReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEFERRED';
export type TargetEntityType = 'DEPOT' | 'ROUTE' | 'BUS' | 'STOP' | 'SYSTEM';

export interface OptimizationRecommendationDto {
  id: string;
  recommendationId: string;
  title: string;
  titleTa: string;
  category: RecommendationCategory;
  severity: RecommendationSeverity;
  targetEntityType: TargetEntityType;
  targetEntityId?: string;
  targetEntityCode?: string;
  targetEntityName?: string;
  description: string;
  descriptionTa: string;
  supportingObservations: string[];
  dataSource: string[];
  evidencePeriod: {
    from: string;
    to: string;
    sampleSize: number;
    unit: string;
  };
  confidenceScore: number;
  expectedBenefit: string;
  expectedBenefitTa: string;
  risksAndAssumptions: string;
  humanReviewStatus: HumanReviewStatus;
  reviewHistory: Array<{
    status: HumanReviewStatus;
    reviewedBy: string;
    reviewerRole: string;
    decisionNotes?: string;
    timestamp: string;
  }>;
  appliedAction?: {
    isApplied: boolean;
    appliedAt?: string;
    appliedBy?: string;
    appliedNotes?: string;
  };
  dataProvenance: DataProvenanceDto;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Phase 12 — Operations Command Centre Dashboard Types
// =============================================================================

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

