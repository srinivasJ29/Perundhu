import { Types } from 'mongoose';
import { LocationSource } from '../location/location.types';

export type HardwareProtocol = 'HTTP' | 'HTTPS' | 'TCP' | 'MQTT' | 'WEBHOOK';

export type GpsFixStatus = 'NO_FIX' | '2D' | '3D' | 'DGPS' | 'RTK' | 'UNKNOWN';

export interface DeviceAuthContext {
  authenticated: boolean;
  deviceId: string;
  deviceCategory?: 'ETM' | 'GPS_TRACKER';
  assignedBusId?: Types.ObjectId;
  assignedBusRegistration?: string;
  assignedFleetNumber?: string;
  depotId?: Types.ObjectId;
  authMethod: 'API_KEY' | 'HMAC_SHA256' | 'BEARER_TOKEN' | 'PRE_SHARED_SECRET';
  error?: string;
}

export interface NormalizedGpsPayload {
  deviceId: string;
  busId?: string; // If known by device or resolved from registry
  coordinates: [number, number]; // GeoJSON standard: [longitude, latitude]
  altitudeMeters?: number;
  speedKmph: number;
  heading: number; // 0 - 360 degrees
  accuracyMeters: number;
  timestamp: Date; // Hardware GNSS event timestamp
  satellitesCount?: number;
  fixStatus?: GpsFixStatus;
  batteryPercent?: number;
  ignition?: boolean;
  telemetrySource: LocationSource;
  rawChecksum?: string;
  isTest?: boolean;
  additionalData?: Record<string, any>;
}

export interface AdapterContext {
  headers?: Record<string, any>;
  auth?: DeviceAuthContext;
  rawBody?: Buffer | string;
  receiveTime: Date;
}

export interface IGpsHardwareAdapter {
  readonly adapterId: string;
  readonly adapterName: string;
  readonly supportedProtocol: HardwareProtocol;
  readonly defaultSource: LocationSource;
  readonly vendorDocumentationRef?: string;

  /**
   * Evaluates whether this adapter can parse the given raw payload/headers.
   */
  canHandle(payload: unknown, headers?: Record<string, any>): boolean;

  /**
   * Parses vendor-specific telemetry payload and normalizes into standard PERUNDHU GPS format.
   */
  parseAndNormalize(payload: unknown, context: AdapterContext): Promise<NormalizedGpsPayload>;
}

export interface HardwareIngestResult {
  success: boolean;
  deviceId: string;
  busId?: string;
  fleetNumber?: string;
  adapterUsed: string;
  normalizedCoordinates: [number, number]; // [lng, lat]
  recordedAt: string;
  receivedAt: string;
  pipelineAccepted: boolean;
  source: LocationSource;
  rejectionReason?: string;
  isDevTest?: boolean;
}

export interface BandwidthEstimate {
  adapterId: string;
  protocol: HardwareProtocol;
  averagePacketBytes: number;
  packetsPerHourAt10s: number;
  kbPerHour: number;
  kbPerShift8h: number;
  mbPerMonth26Days: number;
  recommendedSimDataPlan: string;
  offlineBufferCapacityPoints: number;
  notes: string;
}
