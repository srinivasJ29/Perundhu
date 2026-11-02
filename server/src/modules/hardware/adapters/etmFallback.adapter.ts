import {
  IGpsHardwareAdapter,
  NormalizedGpsPayload,
  AdapterContext,
  HardwareProtocol
} from '../hardware.types';
import { ValidationError, ForbiddenError } from '../../../common/errors';
import { DeviceRegistry } from '../../../models';

export class EtmFallbackAdapter implements IGpsHardwareAdapter {
  public readonly adapterId = 'etm';
  public readonly adapterName = 'Conductor Electronic Ticketing Machine (ETM) Strict Gateway';
  public readonly supportedProtocol: HardwareProtocol = 'HTTPS';
  public readonly defaultSource = 'VEHICLE_HARDWARE_GPS' as const;
  public readonly vendorDocumentationRef = 'Tamil Nadu STU AFCS Smart POS Interface';

  public canHandle(payload: unknown, headers?: Record<string, any>): boolean {
    if (headers && headers['x-adapter-id'] === 'etm') {
      return true;
    }
    if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (p.deviceCategory === 'ETM' || p.etmId || (p.deviceId && String(p.deviceId).startsWith('ETM-'))) {
        return true;
      }
    }
    return false;
  }

  public async parseAndNormalize(payload: unknown, context: AdapterContext): Promise<NormalizedGpsPayload> {
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('ETM adapter requires a valid JSON object payload');
    }

    const p = payload as Record<string, any>;
    const deviceId = String(p.deviceId || p.etmId || context.auth?.deviceId || '').trim();

    if (!deviceId) {
      throw new ValidationError('ETM payload missing deviceId');
    }

    // STRICT VERIFICATION CHECK:
    // Look up the physical ETM device in the DeviceRegistry.
    // Telemetry is REJECTED if gpsAvailabilityStatus is 'UNKNOWN' or 'VERIFIED_UNAVAILABLE'.
    const deviceRecord = await DeviceRegistry.findOne({ deviceId: deviceId.toUpperCase() }).lean();

    if (!deviceRecord) {
      throw new ValidationError(`ETM terminal '${deviceId}' is not registered in DeviceRegistry`);
    }

    if (deviceRecord.gpsAvailabilityStatus === 'UNKNOWN') {
      throw new ForbiddenError(
        `ETM '${deviceId}' GPS capability is UNKNOWN / UNCONFIRMED. Telemetry streaming is blocked until physical operator verification.`
      );
    }

    if (deviceRecord.gpsAvailabilityStatus === 'VERIFIED_UNAVAILABLE') {
      throw new ForbiddenError(
        `ETM '${deviceId}' is verified to lack GNSS hardware. Cannot ingest location telemetry.`
      );
    }

    // Only reached if gpsAvailabilityStatus === 'VERIFIED_AVAILABLE'
    const lat = Number(p.latitude ?? p.lat);
    const lon = Number(p.longitude ?? p.lon ?? p.lng);

    if (isNaN(lat) || isNaN(lon)) {
      throw new ValidationError('Verified ETM payload contains invalid geographic coordinates');
    }

    const timestamp = p.recordedAt || p.timestamp
      ? new Date(p.recordedAt || p.timestamp)
      : context.receiveTime;

    return {
      deviceId,
      coordinates: [lon, lat], // GeoJSON [lon, lat]
      speedKmph: Math.max(0, Math.min(160, Number(p.speedKmph ?? p.speed ?? 0))),
      heading: Math.max(0, Math.min(360, Number(p.heading ?? p.bearing ?? 0))),
      accuracyMeters: Math.max(1, Math.min(200, Number(p.accuracyMeters ?? 15))),
      batteryPercent: p.batteryPercent !== undefined ? Number(p.batteryPercent) : undefined,
      timestamp: isNaN(timestamp.getTime()) ? context.receiveTime : timestamp,
      telemetrySource: this.defaultSource,
      additionalData: {
        rawProtocol: 'Verified-Smart-ETM',
        conductorId: p.conductorId,
        ticketIssueEvent: Boolean(p.isTicketIssued)
      }
    };
  }
}

export const etmFallbackAdapter = new EtmFallbackAdapter();

