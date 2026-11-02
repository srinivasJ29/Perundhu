/**
 * PERUNDHU (பேருந்து) — Phase 4: Hardware Ingestion REST Routes (Integration)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { env } from '../../src/config/env';
import { DeviceRegistry, Bus } from '../../src/models';
import { clearHardwareNonceCacheForTesting } from '../../src/modules/hardware/hardware.middleware';
import { locationPipelineService } from '../../src/modules/location/locationPipeline.service';

describe('Phase 4 — Hardware Ingestion Routes (Integration)', () => {
  const testSecret = 'test-hardware-hmac-secret-32-bytes-long';

  beforeEach(() => {
    vi.restoreAllMocks();
    clearHardwareNonceCacheForTesting();
    (env as any).GPS_INGESTION_HMAC_SECRET = testSecret;

    // Default mock for DeviceRegistry queries so tests without MongoDB don't hang
    vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null)
    } as any);

    vi.spyOn(DeviceRegistry, 'findByIdAndUpdate').mockReturnValue({
      lean: vi.fn().mockResolvedValue({})
    } as any);

    vi.spyOn(Bus, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    } as any);
  });

  describe('Discovery & Planning Endpoints', () => {
    it('GET /api/v1/hardware/adapters returns list of all registered hardware adapters', async () => {
      const res = await request(app).get('/api/v1/hardware/adapters');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBe(5);

      const ids = res.body.data.map((a: any) => a.id);
      expect(ids).toContain('ais140');
      expect(ids).toContain('teltonika');
      expect(ids).toContain('generic');
      expect(ids).toContain('driver-app');
      expect(ids).toContain('etm');
    });

    it('GET /api/v1/hardware/bandwidth-estimates returns cellular data consumption calculations', async () => {
      const res = await request(app).get('/api/v1/hardware/bandwidth-estimates');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const ais140 = res.body.data.find((e: any) => e.adapterId === 'ais140');
      expect(ais140).toBeDefined();
      expect(ais140.averagePacketBytes).toBe(185);
      expect(ais140.recommendedSimDataPlan).toContain('50 MB');
    });
  });

  describe('Testing & Sandbox Validation Endpoint', () => {
    it('POST /api/v1/hardware/test/validate-payload validates payload without affecting live tracking', async () => {
      const samplePayload = {
        deviceId: 'GPS-TEST-01',
        latitude: 9.9252,
        longitude: 78.1198,
        speedKmph: 40,
        heading: 90
      };

      const res = await request(app)
        .post('/api/v1/hardware/test/validate-payload')
        .send({
          adapterId: 'generic',
          payload: samplePayload
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isDevTest).toBe(true);
      expect(res.body.data.normalizedCoordinates).toEqual([78.1198, 9.9252]);
    });
  });

  describe('Hardware Telemetry Ingestion & Security', () => {
    it('should reject unauthenticated hardware ingest requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/hardware/gps/ais140')
        .send('$AIS140,V1.0,NR,0,L,864201029384756,TN-58-N-1234,1,15102026,083045,0955.3200,N,07807.1200,E,42.5,185.0,12,130.5*4A');

      expect(res.status).toBe(401);
    });

    it('should authenticate hardware packet via HMAC-SHA256 signature and process ingestion', async () => {
      const busId = new Types.ObjectId();
      const deviceId = '864201029384756';

      const rawCsv = '$AIS140,PERUNDHU,1.0,NR,0,L,864201029384756,TN-58-N-1234,1,15102026,083045,0955.3200,N,07807.1200,E,42.5,185.0,12,130.5,1.2,0.9,Airtel,1,1,12.6,0*4A';
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(8).toString('hex');

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(Buffer.from(rawCsv))
        .digest('hex');

      // Mock DeviceRegistry and Bus lookup
      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          deviceId,
          status: 'ACTIVE',
          currentAssignedBusId: busId
        })
      } as any);

      vi.spyOn(DeviceRegistry, 'findByIdAndUpdate').mockReturnValue({
        lean: vi.fn().mockResolvedValue({})
      } as any);

      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: busId,
          fleetNumber: 'MDU-EXP-101',
          registrationNumber: 'TN-58-N-1234'
        })
      } as any);

      vi.spyOn(locationPipelineService, 'processObservation').mockResolvedValue({
        accepted: true,
        persistedLatest: true,
        persistedHistory: true
      } as any);

      const res = await request(app)
        .post('/api/v1/hardware/gps/ais140')
        .set('x-device-id', deviceId)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('x-signature-sha256', signature)
        .set('Content-Type', 'text/plain')
        .send(rawCsv);

      expect(res.status).toBe(202);
      expect(res.body.data.pipelineAccepted).toBe(true);
      expect(res.body.data.deviceId).toBe(deviceId);
      expect(res.body.data.busId).toBe(busId.toString());
      expect(res.body.data.adapterUsed).toBe('ais140');
    });

    it('should reject replayed nonce within active window with 409 Conflict', async () => {
      const deviceId = '864201029384756';
      const rawBody = JSON.stringify({ deviceId, latitude: 9.9252, longitude: 78.1198 });
      const timestamp = Date.now().toString();
      const nonce = 'reused-nonce-123';

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(Buffer.from(rawBody))
        .digest('hex');

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          deviceId,
          status: 'ACTIVE'
        })
      } as any);

      // First request - succeeds auth
      await request(app)
        .post('/api/v1/hardware/gps/generic')
        .set('x-device-id', deviceId)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('x-signature-sha256', signature)
        .set('Content-Type', 'application/json')
        .send(rawBody);

      // Second request with SAME nonce - rejected with 409
      const secondRes = await request(app)
        .post('/api/v1/hardware/gps/generic')
        .set('x-device-id', deviceId)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('x-signature-sha256', signature)
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.error.code).toBe('CONFLICT');
    });

    it('should reject stale timestamp beyond 5 minutes with 401 Unauthorized', async () => {
      const deviceId = '864201029384756';
      const rawBody = JSON.stringify({ test: 1 });
      const staleTimestamp = (Date.now() - 10 * 60 * 1000).toString(); // 10 minutes ago
      const nonce = 'fresh-nonce-456';

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(Buffer.from(rawBody))
        .digest('hex');

      const res = await request(app)
        .post('/api/v1/hardware/gps/generic')
        .set('x-device-id', deviceId)
        .set('x-timestamp', staleTimestamp)
        .set('x-nonce', nonce)
        .set('x-signature-sha256', signature)
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(401);
    });

    it('should reject telemetry from a DECOMMISSIONED device with 403 Forbidden', async () => {
      const deviceId = 'GPS-DECOMM-01';
      const payload = { deviceId, latitude: 9.9252, longitude: 78.1198 };
      const rawBody = JSON.stringify(payload);
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(8).toString('hex');

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(Buffer.from(rawBody))
        .digest('hex');

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          deviceId,
          status: 'DECOMMISSIONED'
        })
      } as any);

      const res = await request(app)
        .post('/api/v1/hardware/gps/generic')
        .set('x-device-id', deviceId)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('x-signature-sha256', signature)
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('DECOMMISSIONED');
    });

    it('should record telemetry health for unassigned device without updating bus position', async () => {
      const deviceId = 'GPS-STANDBY-01';
      const payload = {
        deviceId,
        latitude: 9.9252,
        longitude: 78.1198,
        speedKmph: 0,
        heading: 0
      };
      const rawBody = JSON.stringify(payload);
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(8).toString('hex');

      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(Buffer.from(rawBody))
        .digest('hex');

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          deviceId,
          status: 'STANDBY',
          currentAssignedBusId: undefined // Unassigned
        })
      } as any);

      const healthUpdateSpy = vi.spyOn(DeviceRegistry, 'findByIdAndUpdate').mockReturnValue({
        lean: vi.fn().mockResolvedValue({})
      } as any);
      const pipelineSpy = vi.spyOn(locationPipelineService, 'processObservation');

      const res = await request(app)
        .post('/api/v1/hardware/gps/generic')
        .set('x-device-id', deviceId)
        .set('x-timestamp', timestamp)
        .set('x-nonce', nonce)
        .set('x-signature-sha256', signature)
        .set('Content-Type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.data.pipelineAccepted).toBe(false);
      expect(res.body.data.rejectionReason).toContain('not currently assigned');
      expect(healthUpdateSpy).toHaveBeenCalled();
      expect(pipelineSpy).not.toHaveBeenCalled();
    });
  });
});
