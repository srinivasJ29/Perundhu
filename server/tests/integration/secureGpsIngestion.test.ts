/**
 * PERUNDHU (பேருந்து) — Phase 5: Secure GPS Ingestion & Telemetry Processing Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { Bus, DeviceRegistry } from '../../src/models';
import { env } from '../../src/config/env';
import { locationRepository } from '../../src/modules/location/location.repository';
import { clearNonceCacheForTesting } from '../../src/modules/location/ingestion.middleware';
import { telemetryMetricsService } from '../../src/modules/location/telemetryMetrics.service';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Phase 5 — Secure GPS Ingestion & Telemetry Processing (Integration)', () => {
  const testSecret = 'dev-gps-ingestion-hmac-secret-min-32-chars-long';
  const busId = new Types.ObjectId().toString();
  const deviceId = 'GPS-MDU-SECURE-01';

  const adminToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'admin@perundhu.tn.gov.in',
    role: 'ADMIN',
    sessionId: new Types.ObjectId().toString()
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    clearNonceCacheForTesting();
    telemetryMetricsService.reset();
    (env as any).GPS_INGESTION_HMAC_SECRET = testSecret;

    // Default mock for Bus lookup
    vi.spyOn(Bus, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(busId),
        fleetNumber: 'MDU-EXP-101',
        registrationNumber: 'TN-58-N-1234',
        isActive: true
      })
    } as any);

    // Default mock for DeviceRegistry
    vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        deviceId,
        status: 'ACTIVE',
        currentAssignedBusId: new Types.ObjectId(busId)
      })
    } as any);

    vi.spyOn(DeviceRegistry, 'findOneAndUpdate').mockResolvedValue({} as any);
    vi.spyOn(DeviceRegistry, 'updateOne').mockResolvedValue({} as any);

    // Default mock for LocationRepository
    vi.spyOn(locationRepository, 'getLatestPositionByBusId').mockResolvedValue(null);
    vi.spyOn(locationRepository, 'saveLatestPosition').mockResolvedValue(true);
    vi.spyOn(locationRepository, 'appendLocationHistory').mockResolvedValue(true);
  });

  function signPayload(bodyString: string, secret = testSecret): string {
    return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
  }

  describe('Device Revocation & Integrity Protection', () => {
    it('should accept valid HMAC-signed GPS observation and return 202 Accepted', async () => {
      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID();
      const payload = {
        busId,
        latitude: 9.9252,
        longitude: 78.1198,
        speedKmph: 45,
        heading: 180,
        accuracyMeters: 5,
        satellitesCount: 12,
        gpsFixStatus: '3D',
        batteryPercent: 95,
        recordedAt: timestamp,
        source: 'VEHICLE_HARDWARE_GPS'
      };

      const bodyString = JSON.stringify(payload);
      const signature = signPayload(bodyString);

      const res = await request(app)
        .post('/api/v1/location/ingest')
        .set('x-device-id', deviceId)
        .set('x-signature-sha256', signature)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(202);
      expect(res.body.data.busId).toBe(busId);
      expect(res.body.data.source).toBe('VEHICLE_HARDWARE_GPS');
      expect(res.body.data.persistedLatest).toBe(true);
    });

    it('should reject observation from a DECOMMISSIONED device with 403 Forbidden', async () => {
      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          deviceId,
          status: 'DECOMMISSIONED'
        })
      } as any);

      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID();
      const payload = {
        busId,
        latitude: 9.9252,
        longitude: 78.1198,
        recordedAt: timestamp,
        source: 'VEHICLE_HARDWARE_GPS'
      };

      const bodyString = JSON.stringify(payload);
      const signature = signPayload(bodyString);

      const res = await request(app)
        .post('/api/v1/location/ingest')
        .set('x-device-id', deviceId)
        .set('x-signature-sha256', signature)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('DECOMMISSIONED');
    });

    it('should reject observation from a FAULTY device with 403 Forbidden', async () => {
      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          deviceId,
          status: 'FAULTY'
        })
      } as any);

      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID();
      const payload = {
        busId,
        latitude: 9.9252,
        longitude: 78.1198,
        recordedAt: timestamp,
        source: 'VEHICLE_HARDWARE_GPS'
      };

      const bodyString = JSON.stringify(payload);
      const signature = signPayload(bodyString);

      const res = await request(app)
        .post('/api/v1/location/ingest')
        .set('x-device-id', deviceId)
        .set('x-signature-sha256', signature)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('FAULTY');
    });

    it('should reject conflicting device-to-bus assignment with 409 Conflict', async () => {
      const differentBusId = new Types.ObjectId();

      // Device is actually assigned to 'busId', but request claims 'differentBusId'
      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          deviceId,
          status: 'ACTIVE',
          currentAssignedBusId: new Types.ObjectId(busId) // assigned to busId
        })
      } as any);

      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: differentBusId,
          fleetNumber: 'MDU-DIFFERENT-999',
          registrationNumber: 'TN-58-N-9999'
        })
      } as any);

      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID();
      const payload = {
        busId: differentBusId.toString(),
        latitude: 9.9252,
        longitude: 78.1198,
        recordedAt: timestamp,
        source: 'VEHICLE_HARDWARE_GPS'
      };

      const bodyString = JSON.stringify(payload);
      const signature = signPayload(bodyString);

      const res = await request(app)
        .post('/api/v1/location/ingest')
        .set('x-device-id', deviceId)
        .set('x-signature-sha256', signature)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('Conflicting device assignment');
    });
  });

  describe('Task 7 — Offline Queue and Batch Recovery', () => {
    it('should ingest an ordered batch of offline observations and persist all to history', async () => {
      const timestamp1 = new Date(Date.now() - 30000).toISOString(); // 30s ago
      const timestamp2 = new Date(Date.now() - 10000).toISOString(); // 10s ago

      const batchPayload = {
        batchId: 'BATCH-OFFLINE-RECOVER-01',
        records: [
          {
            busId,
            latitude: 9.9250,
            longitude: 78.1190,
            speedKmph: 30,
            heading: 90,
            recordedAt: timestamp1,
            source: 'VEHICLE_HARDWARE_GPS'
          },
          {
            busId,
            latitude: 9.9260,
            longitude: 78.1200,
            speedKmph: 42,
            heading: 95,
            recordedAt: timestamp2,
            source: 'VEHICLE_HARDWARE_GPS'
          }
        ]
      };

      const bodyString = JSON.stringify(batchPayload);
      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID();
      const signature = signPayload(bodyString);

      const res = await request(app)
        .post('/api/v1/location/ingest/batch')
        .set('x-device-id', deviceId)
        .set('x-signature-sha256', signature)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('Content-Type', 'application/json')
        .send(batchPayload);

      expect(res.status).toBe(202);
      expect(res.body.data.batchId).toBe('BATCH-OFFLINE-RECOVER-01');
      expect(res.body.data.totalReceived).toBe(2);
      expect(res.body.data.persistedHistoryCount).toBe(2);
      expect(res.body.data.latestPositionUpdated).toBe(true);
    });

    it('should reject duplicate batch delivery with 409 Conflict', async () => {
      const batchPayload = {
        batchId: 'BATCH-DUPLICATE-CHECK-01',
        records: [
          {
            busId,
            latitude: 9.9250,
            longitude: 78.1190,
            recordedAt: new Date().toISOString(),
            source: 'VEHICLE_HARDWARE_GPS'
          }
        ]
      };

      const bodyString = JSON.stringify(batchPayload);
      const timestamp = new Date().toISOString();
      const nonce1 = crypto.randomUUID();
      const signature = signPayload(bodyString);

      // First batch submission
      await request(app)
        .post('/api/v1/location/ingest/batch')
        .set('x-device-id', deviceId)
        .set('x-signature-sha256', signature)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce1)
        .set('Content-Type', 'application/json')
        .send(batchPayload);

      // Second duplicate batch submission with fresh nonce
      const nonce2 = crypto.randomUUID();
      const res = await request(app)
        .post('/api/v1/location/ingest/batch')
        .set('x-device-id', deviceId)
        .set('x-signature-sha256', signature)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce2)
        .set('Content-Type', 'application/json')
        .send(batchPayload);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('already been processed');
    });
  });

  describe('Task 2 — Credential Rotation Strategy', () => {
    it('should rotate device credentials and return a new 32-byte hexadecimal key once', async () => {
      const deviceObjId = new Types.ObjectId();
      const mockDeviceDoc = {
        _id: deviceObjId,
        deviceId: 'GPS-MDU-SECURE-01',
        status: 'ACTIVE',
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(DeviceRegistry, 'findOne').mockResolvedValue(mockDeviceDoc as any);

      const res = await request(app)
        .post(`/api/v1/admin/devices/${deviceObjId.toString()}/rotate-credentials`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deviceId).toBe('GPS-MDU-SECURE-01');
      expect(typeof res.body.data.apiKey).toBe('string');
      expect(res.body.data.apiKey).toHaveLength(64); // 32 bytes hex = 64 characters
      expect(mockDeviceDoc.save).toHaveBeenCalled();
    });
  });

  describe('Task 10 — Observability & Telemetry Metrics', () => {
    it('GET /api/v1/location/metrics returns telemetry metrics summary', async () => {
      const res = await request(app).get('/api/v1/location/metrics');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.totalReceived).toBe('number');
      expect(typeof res.body.data.acceptedCount).toBe('number');
      expect(typeof res.body.data.averageProcessingLatencyMs).toBe('number');
      expect(res.body.data.sourceDistribution).toBeDefined();
      expect(res.body.data.rejectionReasons).toBeDefined();
    });
  });
});
