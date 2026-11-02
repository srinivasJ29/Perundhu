import {
  IGpsHardwareAdapter,
  NormalizedGpsPayload,
  AdapterContext,
  HardwareProtocol
} from '../hardware.types';
import { ValidationError } from '../../../common/errors';

export class DriverAppMobileAdapter implements IGpsHardwareAdapter {
  public readonly adapterId = 'driver-app';
  public readonly adapterName = 'Approved Driver Mobile Application GPS';
  public readonly supportedProtocol: HardwareProtocol = 'HTTPS';
  public readonly defaultSource = 'AUTHORIZED_MOBILE_GPS' as const;
  public readonly vendorDocumentationRef = 'PERUNDHU Driver In-Cab Application Telemetry Specification';

  public canHandle(payload: unknown, headers?: Record<string, any>): boolean {
    if (headers && headers['x-adapter-id'] === 'driver-app') {
      return true;
    }
    if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (p.source === 'AUTHORIZED_MOBILE_GPS' || (p.driverId && (p.latitude !== undefined || p.coords))) {
        return true;
      }
    }
    return false;
  }

  public async parseAndNormalize(payload: unknown, context: AdapterContext): Promise<NormalizedGpsPayload> {
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Driver app adapter requires a valid JSON object payload');
    }

    const p = payload as Record<string, any>;
    const deviceId = String(p.deviceId || context.auth?.deviceId || `DRV-APP-${p.driverId || 'UNKNOWN'}`).trim();

    let lat: number;
    let lon: number;

    if (p.coords && typeof p.coords === 'object') {
      lat = Number(p.coords.latitude ?? p.coords.lat);
      lon = Number(p.coords.longitude ?? p.coords.lng ?? p.coords.lon);
    } else {
      lat = Number(p.latitude ?? p.lat);
      lon = Number(p.longitude ?? p.lon ?? p.lng);
    }

    if (isNaN(lat) || isNaN(lon)) {
      throw new ValidationError('Driver app payload contains invalid geographic coordinates');
    }

    const timestamp = p.recordedAt || p.timestamp
      ? new Date(p.recordedAt || p.timestamp)
      : context.receiveTime;

    if (isNaN(timestamp.getTime())) {
      throw new ValidationError('Driver app payload contains invalid recordedAt timestamp');
    }

    return {
      deviceId,
      busId: p.busId ? String(p.busId) : undefined,
      coordinates: [lon, lat], // GeoJSON [lon, lat]
      speedKmph: Math.max(0, Math.min(160, Number(p.speedKmph ?? p.speed ?? 0))),
      heading: Math.max(0, Math.min(360, Number(p.heading ?? p.bearing ?? 0))),
      accuracyMeters: Math.max(1, Math.min(100, Number(p.accuracyMeters ?? p.accuracy ?? 10))),
      altitudeMeters: p.altitude !== undefined ? Number(p.altitude) : undefined,
      batteryPercent: p.batteryPercent !== undefined ? Number(p.batteryPercent) : undefined,
      timestamp,
      telemetrySource: this.defaultSource,
      additionalData: {
        rawProtocol: 'Driver-Mobile-HTTPS',
        driverId: p.driverId,
        appVersion: p.appVersion || 'v1.0'
      }
    };
  }
}

export const driverAppMobileAdapter = new DriverAppMobileAdapter();

