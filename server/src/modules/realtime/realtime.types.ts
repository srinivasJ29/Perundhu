import { Types } from 'mongoose';
import {
  LocationSource,
  TrackingStatus,
  PositionValidationStatus
} from '../location/location.types';
import { StopArrivalStatus } from '../eta/eta.types';
import { StopEventType } from '../../models/StopEvent';

// =============================================================================
// Room Names & Helpers
// =============================================================================
export const BUS_ROOM_PREFIX = 'bus:';
export const ROUTE_ROOM_PREFIX = 'route:';
export const FLEET_ROOM = 'fleet:all';
export const FLEET_DEPOT_PREFIX = 'fleet:depot:';

export function getBusRoom(busId: string | Types.ObjectId): string {
  return `${BUS_ROOM_PREFIX}${busId.toString()}`;
}

export function getRouteRoom(routeId: string | Types.ObjectId): string {
  return `${ROUTE_ROOM_PREFIX}${routeId.toString()}`;
}

export function getFleetDepotRoom(depotId: string | Types.ObjectId): string {
  return `${FLEET_DEPOT_PREFIX}${depotId.toString()}`;
}

// =============================================================================
// Real-Time Socket Event Names
// =============================================================================
export const RealtimeEvents = {
  // Client -> Server
  SUBSCRIBE_BUS: 'subscribe:bus',
  UNSUBSCRIBE_BUS: 'unsubscribe:bus',
  SUBSCRIBE_ROUTE: 'subscribe:route',
  UNSUBSCRIBE_ROUTE: 'unsubscribe:route',
  SUBSCRIBE_FLEET: 'subscribe:fleet',
  UNSUBSCRIBE_FLEET: 'unsubscribe:fleet',

  // Server -> Client
  SUBSCRIPTION_ACK: 'subscription:ack',
  SUBSCRIPTION_ERROR: 'subscription:error',
  UNSUBSCRIPTION_ACK: 'unsubscription:ack',
  BUS_POSITION: 'bus:position',
  BUS_STATUS: 'bus:status',
  BUS_NEXT_STOP: 'bus:next-stop',
  BUS_ETA: 'bus:eta',
  BUS_STOP_EVENT: 'bus:stop-event'
} as const;

export type RealtimeEventName = typeof RealtimeEvents[keyof typeof RealtimeEvents];

// =============================================================================
// Client Request Payloads
// =============================================================================
export interface SubscribeBusPayload {
  busId: string;
}

export interface UnsubscribeBusPayload {
  busId: string;
}

export interface SubscribeRoutePayload {
  routeId: string;
}

export interface UnsubscribeRoutePayload {
  routeId: string;
}

export interface SubscribeFleetPayload {
  depotId?: string;
  includeRestricted?: boolean;
}

export interface UnsubscribeFleetPayload {
  depotId?: string;
}

// =============================================================================
// Server Outbound Payloads
// =============================================================================
export interface SubscriptionAckPayload<T = unknown> {
  channel: string;
  status: 'SUBSCRIBED';
  timestamp: string;
  snapshot?: T | null;
}

export interface UnsubscriptionAckPayload {
  channel: string;
  status: 'UNSUBSCRIBED';
  timestamp: string;
}

export type SubscriptionErrorCode =
  | 'INVALID_ID'
  | 'RESOURCE_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'MALFORMED_PAYLOAD'
  | 'MAX_SUBSCRIPTIONS_EXCEEDED'
  | 'INTERNAL_ERROR';

export interface SubscriptionErrorPayload {
  channel?: string;
  error: string;
  code: SubscriptionErrorCode;
  timestamp: string;
}

export interface BusPositionBroadcastPayload {
  busId: string;
  tripId?: string;
  routeId?: string;
  directionId?: string;
  coordinates: [number, number]; // [longitude, latitude]
  snappedCoordinates?: [number, number];
  heading: number;
  speedKmph: number;
  progressRatio?: number;
  distanceAlongRouteMeters?: number;
  totalRouteDistanceMeters?: number;
  trackingStatus: TrackingStatus;
  source: LocationSource;
  validationStatus: PositionValidationStatus;
  recordedAt: string; // ISO 8601
  receivedAt: string; // ISO 8601
}

export interface BusStatusBroadcastPayload {
  busId: string;
  tripId?: string;
  routeId?: string;
  previousStatus?: TrackingStatus;
  currentStatus: TrackingStatus;
  reason?: string;
  timestamp: string;
}

export interface BusNextStopBroadcastPayload {
  busId: string;
  tripId: string;
  routeId?: string;
  nextStop: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
    sequence: number;
    distanceToStopMeters: number;
    status: StopArrivalStatus;
  };
  timestamp: string;
}

export interface BusEtaBroadcastPayload {
  busId: string;
  tripId: string;
  routeId: string;
  predictionSource: string;
  isRealTimePrediction: boolean; // Must remain false for simulated predictions
  predictions: Array<{
    stopId: string;
    stopCode: string;
    stopNameEn: string;
    stopNameTa: string;
    sequence: number;
    estimatedArrivalIso: string;
    estimatedArrivalMinutes: number;
    distanceToStopMeters: number;
  }>;
  effectiveSpeedKmph: number;
  calculatedAt: string;
}

export interface BusStopEventBroadcastPayload {
  busId: string;
  tripId: string;
  routeId?: string;
  stopId: string;
  stopNameEn: string;
  sequence: number;
  eventType: StopEventType;
  recordedAt: string;
  source: string;
}

export interface BusTrackingSnapshot extends BusPositionBroadcastPayload {
  fleetNumber?: string;
  registrationNumber?: string;
}

export interface RouteTrackingSnapshot {
  routeId: string;
  activeBusesCount: number;
  buses: BusPositionBroadcastPayload[];
  timestamp: string;
}

export interface FleetTrackingSnapshot {
  totalBusesCount: number;
  buses: BusPositionBroadcastPayload[];
  timestamp: string;
}
