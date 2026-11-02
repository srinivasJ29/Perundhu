/**
 * PERUNDHU (பேருந்து) — Phase 4: Hardware Adapters & Normalization Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { ais140HttpAdapter } from '../../src/modules/hardware/adapters/ais140.adapter';
import { teltonikaJsonAdapter } from '../../src/modules/hardware/adapters/teltonika.adapter';
import { genericTrackerAdapter } from '../../src/modules/hardware/adapters/genericTracker.adapter';
import { driverAppMobileAdapter } from '../../src/modules/hardware/adapters/driverApp.adapter';
import { etmFallbackAdapter } from '../../src/modules/hardware/adapters/etmFallback.adapter';
import { gpsAdapterRegistry } from '../../src/modules/hardware/hardware.registry';
import { DeviceRegistry } from '../../src/models';
import { ValidationError, ForbiddenError } from '../../src/common/errors';

describe('Phase 4 — Hardware Adapters & Normalization Unit Tests', () => {
  const dummyContext = {
    headers: {},
    receiveTime: new Date('2026-10-15T08:30:00.000Z')
  };

  describe('AIS-140 Hardware Adapter (MoRTH Standard)', () => {
    it('should detect and parse a standard AIS-140 ASCII CSV payload', async () => {
      // Sample standard AIS-140 packet
      // $AIS140,Vendor,FW,Type,AlertId,LiveHistory,IMEI,RegNo,GPSFix,Date(DDMMYYYY),Time(HHMMSS),Lat(DDMM.MMMM),N/S,Lon(DDDMM.MMMM),E/W,Speed,Heading,Satellites,Altitude,...*Checksum
      const sampleCsv = '$AIS140,PERUNDHU,1.0,NR,0,L,864201029384756,TN-58-N-1234,1,15102026,083045,0955.3200,N,07807.1200,E,42.5,185.0,12,130.5,1.2,0.9,Airtel,1,1,12.6,0*4A';

      expect(ais140HttpAdapter.canHandle(sampleCsv)).toBe(true);

      const normalized = await ais140HttpAdapter.parseAndNormalize(sampleCsv, dummyContext);

      expect(normalized.deviceId).toBe('864201029384756');
      // 0955.3200 N = 9 + 55.32/60 = 9.922000
      // 07807.1200 E = 78 + 7.12/60 = 78.118667
      expect(normalized.coordinates[0]).toBeCloseTo(78.118667, 4); // Longitude first (GeoJSON)
      expect(normalized.coordinates[1]).toBeCloseTo(9.922, 3); // Latitude second
      expect(normalized.speedKmph).toBe(42.5);
      expect(normalized.heading).toBe(185.0);
      expect(normalized.satellitesCount).toBe(12);
      expect(normalized.fixStatus).toBe('3D');
      expect(normalized.ignition).toBe(true);
      expect(normalized.telemetrySource).toBe('VEHICLE_HARDWARE_GPS');
    });

    it('should parse an AIS-140 JSON formatted telemetry payload', async () => {
      const sampleJson = {
        protocol: 'AIS140',
        imei: '864201029384756',
        latitude: 9.9252,
        longitude: 78.1198,
        speedKmph: 48.0,
        heading: 270,
        gpsFix: 1,
        satellites: 14,
        ignition: true,
        timestamp: '2026-10-15T08:30:45.000Z'
      };

      expect(ais140HttpAdapter.canHandle(sampleJson)).toBe(true);

      const normalized = await ais140HttpAdapter.parseAndNormalize(sampleJson, dummyContext);

      expect(normalized.deviceId).toBe('864201029384756');
      expect(normalized.coordinates).toEqual([78.1198, 9.9252]);
      expect(normalized.speedKmph).toBe(48.0);
      expect(normalized.satellitesCount).toBe(14);
      expect(normalized.fixStatus).toBe('3D');
    });

    it('should reject malformed AIS-140 CSV with insufficient fields', async () => {
      const truncated = '$AIS140,Vendor,1.0,NR';
      await expect(ais140HttpAdapter.parseAndNormalize(truncated, dummyContext)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('Teltonika Hardware Adapter (FMB/FMC Series)', () => {
    it('should parse a Teltonika JSON payload with AVL data array', async () => {
      const sampleTeltonika = {
        vendor: 'teltonika',
        imei: '358240051234567',
        data: [
          {
            timestamp: 1729000000000,
            gps: {
              latitude: 9.9252,
              longitude: 78.1198,
              altitude: 145,
              angle: 90,
              speed: 36,
              satellites: 16
            },
            io: {
              ignition: 1,
              batteryPercent: 98
            }
          }
        ]
      };

      expect(teltonikaJsonAdapter.canHandle(sampleTeltonika)).toBe(true);

      const normalized = await teltonikaJsonAdapter.parseAndNormalize(sampleTeltonika, dummyContext);

      expect(normalized.deviceId).toBe('358240051234567');
      expect(normalized.coordinates).toEqual([78.1198, 9.9252]);
      expect(normalized.speedKmph).toBe(36);
      expect(normalized.heading).toBe(90);
      expect(normalized.altitudeMeters).toBe(145);
      expect(normalized.satellitesCount).toBe(16);
      expect(normalized.ignition).toBe(true);
      expect(normalized.batteryPercent).toBe(98);
      expect(normalized.telemetrySource).toBe('VEHICLE_HARDWARE_GPS');
    });
  });

  describe('Generic IoT Tracker Adapter', () => {
    it('should parse a compact IoT tracker JSON packet', async () => {
      const sampleIot = {
        deviceId: 'GPS-TN-8001',
        lat: 9.9252,
        lng: 78.1198,
        speed: 55,
        heading: 180,
        accuracy: 4,
        recordedAt: '2026-10-15T08:35:00.000Z'
      };

      expect(genericTrackerAdapter.canHandle(sampleIot)).toBe(true);

      const normalized = await genericTrackerAdapter.parseAndNormalize(sampleIot, dummyContext);

      expect(normalized.deviceId).toBe('GPS-TN-8001');
      expect(normalized.coordinates).toEqual([78.1198, 9.9252]);
      expect(normalized.speedKmph).toBe(55);
      expect(normalized.heading).toBe(180);
      expect(normalized.accuracyMeters).toBe(4);
    });
  });

  describe('Driver Application Mobile GPS Adapter', () => {
    it('should normalize driver mobile app telemetry with AUTHORIZED_MOBILE_GPS source', async () => {
      const sampleDriver = {
        deviceId: 'MOB-DRV-1001',
        driverId: 'DRV-MDU-1001',
        coords: {
          latitude: 9.9252,
          longitude: 78.1198
        },
        speedKmph: 30,
        heading: 45,
        accuracyMeters: 6,
        recordedAt: '2026-10-15T08:35:00.000Z'
      };

      expect(driverAppMobileAdapter.canHandle(sampleDriver)).toBe(true);

      const normalized = await driverAppMobileAdapter.parseAndNormalize(sampleDriver, dummyContext);

      expect(normalized.deviceId).toBe('MOB-DRV-1001');
      expect(normalized.coordinates).toEqual([78.1198, 9.9252]);
      expect(normalized.telemetrySource).toBe('AUTHORIZED_MOBILE_GPS');
      expect(normalized.additionalData?.driverId).toBe('DRV-MDU-1001');
    });
  });

  describe('ETM Fallback Adapter & Zero-Assumption Policy', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should strictly reject ETM telemetry if device gpsAvailabilityStatus is UNKNOWN', async () => {
      const sampleEtm = {
        deviceId: 'ETM-MDU-01',
        latitude: 9.9252,
        longitude: 78.1198
      };

      // Mock DeviceRegistry finding device with default UNKNOWN GPS status
      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          deviceId: 'ETM-MDU-01',
          deviceCategory: 'ETM',
          gpsAvailabilityStatus: 'UNKNOWN'
        })
      } as any);

      await expect(etmFallbackAdapter.parseAndNormalize(sampleEtm, dummyContext)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('should strictly reject ETM telemetry if device gpsAvailabilityStatus is VERIFIED_UNAVAILABLE', async () => {
      const sampleEtm = {
        deviceId: 'ETM-MDU-02',
        latitude: 9.9252,
        longitude: 78.1198
      };

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          deviceId: 'ETM-MDU-02',
          deviceCategory: 'ETM',
          gpsAvailabilityStatus: 'VERIFIED_UNAVAILABLE'
        })
      } as any);

      await expect(etmFallbackAdapter.parseAndNormalize(sampleEtm, dummyContext)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('should allow ETM telemetry only when physical device has been VERIFIED_AVAILABLE', async () => {
      const sampleEtm = {
        deviceId: 'ETM-MDU-99',
        latitude: 9.9252,
        longitude: 78.1198,
        speedKmph: 25,
        heading: 90
      };

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          deviceId: 'ETM-MDU-99',
          deviceCategory: 'ETM',
          gpsAvailabilityStatus: 'VERIFIED_AVAILABLE'
        })
      } as any);

      const normalized = await etmFallbackAdapter.parseAndNormalize(sampleEtm, dummyContext);

      expect(normalized.deviceId).toBe('ETM-MDU-99');
      expect(normalized.coordinates).toEqual([78.1198, 9.9252]);
      expect(normalized.speedKmph).toBe(25);
    });
  });

  describe('GPS Adapter Registry', () => {
    it('should contain all 5 core adapters', () => {
      const adapters = gpsAdapterRegistry.listAdapters();
      expect(adapters.length).toBe(5);
      const ids = adapters.map(a => a.id);
      expect(ids).toContain('ais140');
      expect(ids).toContain('teltonika');
      expect(ids).toContain('generic');
      expect(ids).toContain('driver-app');
      expect(ids).toContain('etm');
    });

    it('should provide calculated bandwidth estimates for cellular data planning', () => {
      const estimates = gpsAdapterRegistry.getBandwidthEstimates();
      expect(estimates.length).toBe(5);

      const ais140Est = estimates.find(e => e.adapterId === 'ais140');
      expect(ais140Est).toBeDefined();
      expect(ais140Est!.averagePacketBytes).toBe(185);
      expect(ais140Est!.mbPerMonth26Days).toBeCloseTo(13.5, 1);
    });
  });
});

