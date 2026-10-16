import { LocationSource, TrackingStatus } from '../../models/LatestBusPosition';
import { StopEventType } from '../../models/StopEvent';

export type StopArrivalStatus = StopEventType;

export type EtaPredictionSource =
  | 'LIVE_MOVEMENT'
  | 'SCHEDULE_FALLBACK'
  | 'SIMULATED_MOVEMENT'
  | 'UNAVAILABLE';

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
  generatedAt: string;
  nextStop?: StopEtaPrediction;
  downstreamStops: StopEtaPrediction[];
}
