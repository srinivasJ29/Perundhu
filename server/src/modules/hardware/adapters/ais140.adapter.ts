import {
  IGpsHardwareAdapter,
  NormalizedGpsPayload,
  AdapterContext,
  HardwareProtocol
} from '../hardware.types';
import { ValidationError } from '../../../common/errors';

export class Ais140HttpAdapter implements IGpsHardwareAdapter {
  public readonly adapterId = 'ais140';
  public readonly adapterName = 'AIS-140 Indian MoRTH Telematics Standard';
  public readonly supportedProtocol: HardwareProtocol = 'HTTP';
  public readonly defaultSource = 'VEHICLE_HARDWARE_GPS' as const;
  public readonly vendorDocumentationRef = 'AIS-140: Intelligent Transportation Systems (MoRTH/ARAI standard)';

  public canHandle(payload: unknown, headers?: Record<string, any>): boolean {
    if (typeof payload === 'string' && payload.startsWith('$AIS140')) {
      return true;
    }
    if (payload && typeof payload === 'object') {
      const p = payload as any;
      if (p.protocol === 'AIS140' || p.standard === 'AIS-140' || (p.imei && p.gpsFix !== undefined)) {
        return true;
      }
    }
    if (headers && headers['x-adapter-id'] === 'ais140') {
      return true;
    }
    return false;
  }

  public async parseAndNormalize(payload: unknown, context: AdapterContext): Promise<NormalizedGpsPayload> {
    if (typeof payload === 'string') {
      return this.parseCsvAis140(payload, context);
    }
    if (payload && typeof payload === 'object') {
      return this.parseJsonAis140(payload as Record<string, any>, context);
    }
    throw new ValidationError('AIS-140 adapter received unsupported payload format (expected CSV string or JSON)');
  }

  /**
   * Parses standard AIS-140 ASCII CSV packet:
   * $AIS140,Vendor,FW,Type,AlertId,LiveHistory,IMEI,RegNo,GPSFix,Date(DDMMYYYY),Time(HHMMSS),Lat(DDMM.MMMM),N/S,Lon(DDDMM.MMMM),E/W,Speed,Heading,Satellites,Altitude,...*Checksum
   */
  private parseCsvAis140(rawString: string, context: AdapterContext): NormalizedGpsPayload {
    const clean = rawString.trim().replace(/^\$/, '').replace(/\*[0-9a-fA-F]{2}$/, '');
    const parts = clean.split(',');

    if (parts.length < 17) {
      throw new ValidationError(`Malformed AIS-140 CSV packet: expected at least 17 fields, got ${parts.length}`);
    }

    const imei = parts[6]?.trim() || context.auth?.deviceId || 'UNKNOWN_IMEI';
    const gpsFixRaw = parseInt(parts[8], 10);
    const dateStr = parts[9]?.trim(); // DDMMYYYY
    const timeStr = parts[10]?.trim(); // HHMMSS
    const latRaw = parts[11]?.trim();
    const latDir = parts[12]?.trim().toUpperCase();
    const lonRaw = parts[13]?.trim();
    const lonDir = parts[14]?.trim().toUpperCase();
    const speed = parseFloat(parts[15]) || 0;
    const heading = parseFloat(parts[16]) || 0;
    const satellites = parts.length > 17 ? parseInt(parts[17], 10) : undefined;
    const altitude = parts.length > 18 ? parseFloat(parts[18]) : undefined;
    const ignition = parts.length > 22 ? parts[22] === '1' : (parts.length > 21 ? parts[21] === '1' : undefined);

    // Convert NMEA lat/lon (DDMM.MMMM -> decimal degrees)
    const latitude = this.convertNmeaToDecimal(latRaw, latDir);
    const longitude = this.convertNmeaToDecimal(lonRaw, lonDir);

    // Parse DDMMYYYY + HHMMSS into Date
    const timestamp = this.parseAis140Timestamp(dateStr, timeStr, context.receiveTime);

    return {
      deviceId: imei,
      coordinates: [longitude, latitude], // GeoJSON [lon, lat]
      speedKmph: Math.max(0, Math.min(200, speed)),
      heading: (heading >= 0 && heading <= 360) ? heading : 0,
      accuracyMeters: gpsFixRaw === 1 ? 5 : 25,
      altitudeMeters: altitude,
      satellitesCount: satellites,
      fixStatus: gpsFixRaw === 1 ? '3D' : 'NO_FIX',
      ignition,
      timestamp,
      telemetrySource: this.defaultSource,
      additionalData: {
        rawProtocol: 'AIS140-CSV',
        vehicleRegNo: parts[7] || undefined,
        packetType: parts[3] || 'NR'
      }
    };
  }

  /**
   * Parses JSON formatted AIS-140 telemetry:
   */
  private parseJsonAis140(json: Record<string, any>, context: AdapterContext): NormalizedGpsPayload {
    const imei = String(json.imei || json.deviceId || context.auth?.deviceId || '').trim();
    if (!imei) {
      throw new ValidationError('AIS-140 JSON packet missing IMEI or deviceId');
    }

    let lat = Number(json.latitude ?? json.lat);
    let lon = Number(json.longitude ?? json.lon ?? json.lng);

    if (isNaN(lat) || isNaN(lon)) {
      throw new ValidationError('AIS-140 JSON packet contains invalid latitude or longitude');
    }

    // Check if coordinates were supplied as NMEA string
    if (typeof json.latitude === 'string' && json.latitude.includes('.') && json.latDirection) {
      lat = this.convertNmeaToDecimal(json.latitude, json.latDirection);
    }
    if (typeof json.longitude === 'string' && json.longitude.includes('.') && json.lonDirection) {
      lon = this.convertNmeaToDecimal(json.longitude, json.lonDirection);
    }

    const timestamp = json.timestamp || json.recordedAt
      ? new Date(json.timestamp || json.recordedAt)
      : context.receiveTime;

    if (isNaN(timestamp.getTime())) {
      throw new ValidationError('AIS-140 JSON packet contains invalid timestamp');
    }

    return {
      deviceId: imei,
      coordinates: [lon, lat], // GeoJSON: [lon, lat]
      speedKmph: Math.max(0, Math.min(200, Number(json.speedKmph ?? json.speed ?? 0))),
      heading: Math.max(0, Math.min(360, Number(json.heading ?? json.bearing ?? 0))),
      accuracyMeters: Math.max(1, Math.min(500, Number(json.accuracyMeters ?? (json.gpsFix === 1 ? 5 : 20)))),
      altitudeMeters: json.altitude !== undefined ? Number(json.altitude) : undefined,
      satellitesCount: json.satellites !== undefined ? Number(json.satellites) : undefined,
      fixStatus: json.gpsFix === 1 ? '3D' : (json.gpsFix === 0 ? 'NO_FIX' : 'UNKNOWN'),
      ignition: json.ignition !== undefined ? Boolean(json.ignition) : undefined,
      batteryPercent: json.batteryPercent !== undefined ? Number(json.batteryPercent) : undefined,
      timestamp,
      telemetrySource: this.defaultSource,
      additionalData: {
        rawProtocol: 'AIS140-JSON',
        alertId: json.alertId,
        emergencyStatus: json.emergencyStatus
      }
    };
  }

  /**
   * Helper: converts NMEA coordinate DDMM.MMMM to decimal degrees
   */
  private convertNmeaToDecimal(nmeaStr: string, direction?: string): number {
    if (!nmeaStr) return 0;
    const val = parseFloat(nmeaStr);
    if (isNaN(val)) return 0;

    // DDMM.MMMM: degree is integer part / 100
    const degrees = Math.floor(val / 100);
    const minutes = val - degrees * 100;
    let decimal = degrees + minutes / 60;

    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    return Number(decimal.toFixed(6));
  }

  /**
   * Helper: parses AIS-140 Date (DDMMYYYY) and Time (HHMMSS)
   */
  private parseAis140Timestamp(dateStr?: string, timeStr?: string, fallback: Date = new Date()): Date {
    if (!dateStr || dateStr.length !== 8 || !timeStr || timeStr.length < 6) {
      return fallback;
    }

    const day = parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10) - 1;
    const year = parseInt(dateStr.substring(4, 8), 10);

    const hour = parseInt(timeStr.substring(0, 2), 10);
    const min = parseInt(timeStr.substring(2, 4), 10);
    const sec = parseInt(timeStr.substring(4, 6), 10);

    const d = new Date(Date.UTC(year, month, day, hour, min, sec));
    return isNaN(d.getTime()) ? fallback : d;
  }
}

export const ais140HttpAdapter = new Ais140HttpAdapter();
