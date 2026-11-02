/**
 * PERUNDHU (பேருந்து) — Real-Time WebSocket / Socket.IO Type Definitions
 * Strictly mirrors server/src/modules/realtime/realtime.types.ts
 */

import {
  StopArrivalStatus,
  TrackingTelemetryStatus,
  LocationTelemetrySource
} from './domain';

// =============================================================================
// Event Name Constants
// =============================================================================

export const SocketEvents = {
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

export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];

// =============================================================================
// Client Requests
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

export interface FleetTrackingSnapshot {
  totalBusesCount: number;
  buses: BusPositionPayload[];
  timestamp: string;
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

export interface BusPositionPayload {
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
  trackingStatus: TrackingTelemetryStatus;
  source: LocationTelemetrySource;
  validationStatus: string;
  recordedAt: string;
  receivedAt: string;
}

export interface BusStatusPayload {
  busId: string;
  tripId?: string;
  routeId?: string;
  previousStatus?: TrackingTelemetryStatus;
  currentStatus: TrackingTelemetryStatus;
  reason?: string;
  timestamp: string;
}

export interface BusNextStopPayload {
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

export interface BusEtaPayload {
  busId: string;
  tripId: string;
  routeId: string;
  predictionSource: string;
  isRealTimePrediction: boolean;
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

export interface BusStopEventPayload {
  busId: string;
  tripId: string;
  routeId?: string;
  stopId: string;
  stopNameEn: string;
  sequence: number;
  eventType: 'ARRIVED' | 'DEPARTED';
  recordedAt: string;
  source: string;
}

export type SocketConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR';
