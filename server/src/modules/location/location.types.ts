import { Types } from 'mongoose';
import { GeoJsonPoint } from '../../models/geojson';
import {
  LocationSource,
  TrackingStatus,
  PositionValidationStatus
} from '../../models/LatestBusPosition';

export {
  LocationSource,
  TrackingStatus,
  PositionValidationStatus
};

export interface LocationObservation {
  busId: Types.ObjectId;
  tripId?: Types.ObjectId;
  routeId?: Types.ObjectId;
  directionId?: Types.ObjectId;
  location: GeoJsonPoint;
  snappedLocation?: GeoJsonPoint;
  crossTrackDistanceMeters?: number;
  heading: number; // 0 - 360 degrees
  speedKmph: number;
  accuracyMeters: number;
  source: LocationSource;
  sourceDeviceId?: string;
  trackingStatus: TrackingStatus;
  validationStatus?: PositionValidationStatus;
  validationErrors?: string[];
  recordedAt: Date;
  receivedAt: Date;
  progressRatio?: number; // 0.0 to 1.0
  distanceAlongRouteMeters?: number;
  totalRouteDistanceMeters?: number;
}

export type FreshnessClassification =
  | 'FRESH'
  | 'DELAYED'
  | 'STALE'
  | 'FUTURE_REJECTED';

export type ValidationOutcomeStatus =
  | 'VALID'
  | 'MALFORMED'
  | 'STALE'
  | 'SUSPICIOUS'
  | 'REJECTED';

export interface PositionValidationResult {
  status: ValidationOutcomeStatus;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  errorCode?: string;
}

export interface RouteSnappingResult {
  snappedCoordinates: [number, number]; // [lng, lat]
  crossTrackDistanceMeters: number;
  segmentIndex: number;
  alongRouteDistanceMeters: number;
  totalRouteDistanceMeters: number;
  progressRatio: number; // 0.0 to 1.0
  progressPercent: number; // 0.0 to 100.0
  isOffRoute: boolean;
  isAmbiguous: boolean;
}

export interface MovementProgressResult {
  isValidMovement: boolean;
  distanceTraveledMeters: number;
  elapsedSeconds: number;
  effectiveSpeedKmph: number;
  progressRatio: number;
  anomaly?: 'IMPLAUSIBLE_JUMP' | 'BACKWARD_MOVEMENT' | 'OUT_OF_ORDER_TIMESTAMP';
  warning?: string;
}

export interface PipelineProcessingResult {
  accepted: boolean;
  observation: LocationObservation;
  validationResult: PositionValidationResult;
  freshness: {
    classification: FreshnessClassification;
    ageMs: number;
  };
  snappingResult?: RouteSnappingResult;
  progressResult?: MovementProgressResult;
  persistedLatest: boolean;
  persistedHistory: boolean;
  rejectionReason?: string;
}

export type LocationObservationListener = (
  observation: LocationObservation
) => Promise<void> | void;

/**
 * Universal contract for location ingestion providers (Simulator, Authorized Mobile GPS, Vehicle Hardware).
 */
export interface ILocationProvider {
  readonly name: string;
  readonly source: LocationSource;

  start(): Promise<unknown>;
  stop(): Promise<unknown>;
  isRunning(): boolean;

  onObservation(listener: LocationObservationListener): () => void;
  getCurrentObservation(busId: string | Types.ObjectId): Promise<LocationObservation | null>;
}
