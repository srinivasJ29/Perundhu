import {
  IGpsHardwareAdapter,
  NormalizedGpsPayload,
  AdapterContext,
  HardwareProtocol
} from '../hardware.types';
import { ValidationError } from '../../../common/errors';

export class TeltonikaJsonAdapter implements IGpsHardwareAdapter {
  public readonly adapterId = 'teltonika';
  public readonly adapterName = 'Teltonika Vehicle Telematics (FMB/FMC Series)';
  public readonly supportedProtocol: HardwareProtocol = 'HTTP';
  public readonly defaultSource = 'VEHICLE_HARDWARE_GPS' as const;
  public readonly vendorDocumentationRef = 'Teltonika Telematics Protocol & JSON Webhook Specification';

  public canHandle(payload: unknown, headers?: Record<string, any>): boolean {
    if (headers && headers['x-adapter-id'] === 'teltonika') {
      return true;
    }
    if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (p.vendor === 'teltonika' || (p.imei && (p.data || (p.gps && p.gps.latitude !== undefined)))) {
        return true;
      }
    }
    return false;
  }

  public async parseAndNormalize(payload: unknown, context: AdapterContext): Promise<NormalizedGpsPayload> {
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Teltonika adapter requires a valid JSON object payload');
    }

    const json = payload as Record<string, any>;
    const imei = String(json.imei || json.deviceId || context.auth?.deviceId || '').trim();
    if (!imei) {
      throw new ValidationError('Teltonika payload missing IMEI or deviceId');
    }

    // Handle AVL array or direct GPS object
    let gpsRecord: any = null;
    let ioRecord: any = null;
    let recordTimestamp: Date = context.receiveTime;

    if (Array.isArray(json.data) && json.data.length > 0) {
      // Pick most recent record from batch
      const latestItem = json.data[json.data.length - 1];
      gpsRecord = latestItem.gps || latestItem;
      ioRecord = latestItem.io || {};
      if (latestItem.timestamp) {
        recordTimestamp = typeof latestItem.timestamp === 'number'
          ? new Date(latestItem.timestamp)
          : new Date(latestItem.timestamp);
      }
    } else if (json.gps) {
      gpsRecord = json.gps;
      ioRecord = json.io || {};
      if (json.timestamp) {
        recordTimestamp = new Date(json.timestamp);
      }
    } else {
      gpsRecord = json;
      ioRecord = json.io || {};
      if (json.timestamp || json.recordedAt) {
        recordTimestamp = new Date(json.timestamp || json.recordedAt);
      }
    }

    if (!gpsRecord) {
      throw new ValidationError('Teltonika payload does not contain GPS location data');
    }

    const lat = Number(gpsRecord.latitude ?? gpsRecord.lat);
    const lon = Number(gpsRecord.longitude ?? gpsRecord.lng ?? gpsRecord.lon);

    if (isNaN(lat) || isNaN(lon)) {
      throw new ValidationError('Teltonika GPS record contains invalid latitude or longitude');
    }

    const speed = Math.max(0, Math.min(200, Number(gpsRecord.speed ?? 0)));
    const angle = Math.max(0, Math.min(360, Number(gpsRecord.angle ?? gpsRecord.heading ?? 0)));
    const satellites = gpsRecord.satellites !== undefined ? Number(gpsRecord.satellites) : undefined;
    const altitude = gpsRecord.altitude !== undefined ? Number(gpsRecord.altitude) : undefined;

    const ignition = ioRecord.ignition !== undefined
      ? Boolean(ioRecord.ignition)
      : (json.ignition !== undefined ? Boolean(json.ignition) : undefined);

    const batteryPercent = ioRecord.batteryPercent !== undefined
      ? Number(ioRecord.batteryPercent)
      : (json.batteryPercent !== undefined ? Number(json.batteryPercent) : undefined);

    return {
      deviceId: imei,
      coordinates: [lon, lat], // GeoJSON [lon, lat]
      speedKmph: speed,
      heading: angle,
      accuracyMeters: satellites && satellites >= 8 ? 5 : 15,
      altitudeMeters: altitude,
      satellitesCount: satellites,
      fixStatus: satellites && satellites > 3 ? '3D' : (satellites && satellites > 0 ? '2D' : 'UNKNOWN'),
      ignition,
      batteryPercent,
      timestamp: isNaN(recordTimestamp.getTime()) ? context.receiveTime : recordTimestamp,
      telemetrySource: this.defaultSource,
      additionalData: {
        rawProtocol: 'Teltonika-JSON',
        priority: json.priority
      }
    };
  }
}

export const teltonikaJsonAdapter = new TeltonikaJsonAdapter();

