import { LocationSource, TrackingStatus } from '../../models/LatestBusPosition';
import { StopEventType } from '../../models/StopEvent';

export type StopArrivalStatus = StopEventType;

export type EtaPredictionSource =
  | 'ML_PREDICTION'
  | 'BASELINE_ESTIMATE'
  | 'OFFICIAL_SCHEDULE'
  | 'ETA_UNAVAILABLE'
  | 'LIVE_MOVEMENT'
  | 'SCHEDULE_FALLBACK'
  | 'SIMULATED_MOVEMENT'
  | 'UNAVAILABLE';

export type EtaFallbackReason =
  | 'GPS_STALE'
  | 'BUS_OFF_ROUTE'
  | 'MODEL_UNAVAILABLE'
  | 'UNASSIGNED_TRIP'
  | 'TERMINAL_REACHED'
  | 'OUT_OF_DISTRIBUTION'
  | 'INSUFFICIENT_HISTORY';

export interface EnrichedStopItem {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  sequence: number;
  location: [number, number]; // [lng, lat]
  distanceFromOriginMeters: number;
  scheduledArrival?: string;   // HH:mm
  scheduledDeparture?: string; // HH:mm
}

export interface NextStopDetectionResult {
  tripId: string;
  tripCode: string;
  busId?: string;
  status: StopArrivalStatus;
  currentStop?: EnrichedStopItem;
  nextStop?: EnrichedStopItem;
  remainingDistanceMeters: number;
  distanceAlongRouteMeters: number;
  totalRouteDistanceMeters: number;
  progressRatio: number;
  trackingStatus: TrackingStatus;
  source: LocationSource;
  isTerminalReached: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  confidence: number;
}

export interface StopEtaPrediction {
  stopId: string;
  stopCode: string;
  stopNameEn: string;
  stopNameTa: string;
  stopSequence: number;
  location: [number, number];
  estimatedArrivalAt?: string; // ISO 8601
  etaSeconds: number;
  etaMinutes: number;
  remainingDistanceMeters: number;
  effectiveSpeedKmph: number;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  predictionSource: EtaPredictionSource;
  isRealTimePrediction: boolean;
  confidence: number;
  confidenceIntervalSeconds?: [number, number];
  fallbackReason?: EtaFallbackReason | string;
}

export interface TripEtaResponseDto {
  tripId: string;
  tripCode: string;
  busId?: string;
  routeNumber?: string;
  directionCode?: 'OUTBOUND' | 'INBOUND';
  trackingStatus: TrackingStatus;
  source: LocationSource;
  isRealTimePrediction: boolean;
  predictionSource: EtaPredictionSource;
  confidence?: number;
  modelVersion?: string;
  generatedAt: string;
  nextStop?: StopEtaPrediction;
  downstreamStops: StopEtaPrediction[];
}

export interface MlPredictionRequestDto {
  bus_id: string;
  route_id?: string;
  route_number?: string;
  target_stop_code?: string;
  distance_to_stop_meters: number;
  distance_along_route_meters: number;
  current_speed_kmph: number;
  rolling_speed_kmph?: number;
  heading?: number;
  stops_remaining?: number;
  segment_index?: number;
  scheduled_duration_seconds?: number;
  recorded_at?: string;
  is_deviated?: boolean;
  tracking_status?: string;
}

export interface MlPredictionResponseDto {
  bus_id: string;
  target_stop_code?: string;
  prediction_source: EtaPredictionSource;
  predicted_seconds: number;
  predicted_minutes: number;
  confidence: number;
  confidence_lower_seconds: number;
  confidence_upper_seconds: number;
  model_version: string;
  prediction_timestamp: string;
  fallback_reason?: EtaFallbackReason | string;
  inference_latency_ms: number;
}
