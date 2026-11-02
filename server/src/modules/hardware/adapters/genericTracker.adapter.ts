import {
  IGpsHardwareAdapter,
  NormalizedGpsPayload,
  AdapterContext,
  HardwareProtocol
} from '../hardware.types';
import { ValidationError } from '../../../common/errors';

export class GenericTrackerAdapter implements IGpsHardwareAdapter {
  public readonly adapterId = 'generic';
  public readonly adapterName = 'Generic IoT GNSS Hardware Tracker';
  public readonly supportedProtocol: HardwareProtocol = 'HTTP';
  public readonly defaultSource = 'VEHICLE_HARDWARE_GPS' as const;
  public readonly vendorDocumentationRef = 'Standardized IoT REST Telematics Specification';

  public canHandle(payload: unknown, headers?: Record<string, any>): boolean {
    if (headers && headers['x-adapter-id'] === 'generic') {
      return true;
    }
    if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (
        (p.deviceId || p.trackerId || p.imei) &&
        (p.latitude !== undefined || p.lat !== undefined) &&
        (p.longitude !== undefined || p.lon !== undefined || p.lng !== undefined)
      ) {
        return true;
      }
    }
    return false;
  }

  public async parseAndNormalize(payload: unknown, context: AdapterContext): Promise<NormalizedGpsPayload> {
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Generic tracker adapter requires a valid JSON object payload');
    }

    const p = payload as Record<string, any>;
    const deviceId = String(p.deviceId || p.trackerId || p.imei || context.auth?.deviceId || '').trim();
    if (!deviceId) {
      throw new ValidationError('Generic tracker payload missing device identifier (deviceId or imei)');
    }

    const lat = Number(p.latitude ?? p.lat);
    const lon = Number(p.longitude ?? p.lon ?? p.lng);

    if (isNaN(lat) || isNaN(lon)) {
      throw new ValidationError('Generic tracker payload contains invalid coordinates');
    }

    const timestamp = p.recordedAt || p.timestamp
      ? new Date(p.recordedAt || p.timestamp)
      : context.receiveTime;

    if (isNaN(timestamp.getTime())) {
      throw new ValidationError('Generic tracker payload contains invalid timestamp');
    }

    return {
      deviceId,
      coordinates: [lon, lat], // GeoJSON [lon, lat]
      speedKmph: Math.max(0, Math.min(200, Number(p.speedKmph ?? p.speed ?? 0))),
      heading: Math.max(0, Math.min(360, Number(p.heading ?? p.bearing ?? 0))),
      accuracyMeters: Math.max(1, Math.min(500, Number(p.accuracyMeters ?? p.accuracy ?? 10))),
      altitudeMeters: p.altitude !== undefined ? Number(p.altitude) : undefined,
      satellitesCount: p.satellites !== undefined ? Number(p.satellites) : undefined,
      batteryPercent: p.batteryPercent !== undefined ? Number(p.batteryPercent) : undefined,
      ignition: p.ignition !== undefined ? Boolean(p.ignition) : undefined,
      timestamp,
      telemetrySource: this.defaultSource,
      additionalData: {
        rawProtocol: 'Generic-JSON'
      }
    };
  }
}

export const genericTrackerAdapter = new GenericTrackerAdapter();

