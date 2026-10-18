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

export type UserRole = 'PASSENGER' | 'ADMIN';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status?: 'ACTIVE' | 'DISABLED';
  isActive?: boolean;
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

export interface RouteDirectionDetailDto {
  route: RouteSummaryDto;
  direction: {
    id: string;
    directionCode: 'OUTBOUND' | 'INBOUND';
    totalDistanceKm: number;
    estimatedDurationMins: number;
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
  | 'DRIVER_MOBILE_APP'
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
  effectiveSpeedKmph: number;
}

export interface DynamicTripEtaDto {
  tripId: string;
  busId: string;
  routeId: string;
  trackingStatus: TrackingTelemetryStatus;
  source: LocationTelemetrySource;
  isRealTimePrediction: boolean;
  predictionSource: string;
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
  predictionSource: string;
  message?: string;
  downstreamStops: DownstreamStopEtaDto[];
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
