import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { Bus } from '../../src/models';
import { env } from '../../src/config/env';
import { locationRepository } from '../../src/modules/location/location.repository';
import { clearNonceCacheForTesting } from '../../src/modules/location/ingestion.middleware';

describe('Phase 10 — External GPS Ingestion Endpoint & HMAC Integrity (Integration)', () => {
  const testSecret = 'dev-gps-ingestion-hmac-secret-min-32-chars-long';
  const busId = new Types.ObjectId().toString();
  const deviceId = 'GPS-TNSTC-MDU-045';

  beforeEach(() => {
    vi.restoreAllMocks();
    clearNonceCacheForTesting();
    (env as any).GPS_INGESTION_HMAC_SECRET = testSecret;

    // Mock Bus lookup
    vi.spyOn(Bus, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: new Types.ObjectId(busId),
        fleetNumber: 'MDU-PRY-045',
        registrationNumber: 'TN-58-N-1980',
        isActive: true
      })
    } as any);

    // Mock repository persistence
    vi.spyOn(locationRepository, 'getLatestPositionByBusId').mockResolvedValue(null);
    vi.spyOn(locationRepository, 'saveLatestPosition').mockResolvedValue(true);
    vi.spyOn(locationRepository, 'appendLocationHistory').mockResolvedValue(true);
  });

  function signPayload(bodyString: string, secret = testSecret): string {
    return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
  }

  it('should return 503 Service Unavailable when GPS_INGESTION_HMAC_SECRET is not configured', async () => {
    (env as any).GPS_INGESTION_HMAC_SECRET = undefined;
    const res = await request(app)
      .post('/api/v1/location/ingest')
      .send({ busId });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(res.body.error.message).toContain('GPS_INGESTION_HMAC_SECRET is not configured');
  });

  it('should reject request when GPS authentication headers are missing (401)', async () => {
    const res = await request(app)
      .post('/api/v1/location/ingest')
      .send({ busId, latitude: 9.9252, longitude: 78.1198 });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toContain('Missing required GPS authentication headers');
  });

  it('should reject request when timestamp exceeds replay window of 5 minutes (401)', async () => {
    const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
    const body = {
      busId,
      latitude: 9.9252,
      longitude: 78.1198,
      speedKmph: 40,
      heading: 90,
      recordedAt: oldTimestamp
    };
    const bodyStr = JSON.stringify(body);
    const signature = signPayload(bodyStr);

    const res = await request(app)
      .post('/api/v1/location/ingest')
      .set('Content-Type', 'application/json')
      .set('X-Device-Id', deviceId)
      .set('X-Timestamp', oldTimestamp)
      .set('X-Nonce', crypto.randomUUID())
      .set('X-Signature-SHA256', signature)
      .send(bodyStr);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('replay window');
  });

  it('should reject request when HMAC signature is invalid (401)', async () => {
    const timestamp = new Date().toISOString();
    const body = {
      busId,
      latitude: 9.9252,
      longitude: 78.1198,
      speedKmph: 40,
      heading: 90,
      recordedAt: timestamp
    };
    const bodyStr = JSON.stringify(body);
    const wrongSignature = signPayload(bodyStr, 'wrong-secret-key-that-does-not-match-min32');

    const res = await request(app)
      .post('/api/v1/location/ingest')
      .set('Content-Type', 'application/json')
      .set('X-Device-Id', deviceId)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', crypto.randomUUID())
      .set('X-Signature-SHA256', wrongSignature)
      .send(bodyStr);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Invalid GPS authentication signature');
  });

  it('should accept valid HMAC-signed GPS observation and return 202 Accepted', async () => {
    const timestamp = new Date().toISOString();
    const body = {
      busId,
      latitude: 9.9252,
      longitude: 78.1198,
      speedKmph: 35,
      heading: 90,
      accuracyMeters: 4,
      recordedAt: timestamp,
      source: 'VEHICLE_HARDWARE_GPS'
    };
    const bodyStr = JSON.stringify(body);
    const signature = signPayload(bodyStr);

    const res = await request(app)
      .post('/api/v1/location/ingest')
      .set('Content-Type', 'application/json')
      .set('X-Device-Id', deviceId)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', crypto.randomUUID())
      .set('X-Signature-SHA256', signature)
      .send(bodyStr);

    expect(res.status).toBe(202);
    expect(res.body.message).toContain('accepted and processed');
    expect(res.body.data.busId).toBe(busId);
    expect(res.body.data.source).toBe('VEHICLE_HARDWARE_GPS');
    expect(res.body.data.trackingStatus).toBe('LIVE');
    expect(res.body.data.coordinates).toEqual([78.1198, 9.9252]);
  });

  it('should reject replayed requests with the same nonce within 5 minutes (409 Conflict)', async () => {
    const timestamp = new Date().toISOString();
    const nonce = crypto.randomUUID();
    const body = {
      busId,
      latitude: 9.9252,
      longitude: 78.1198,
      speedKmph: 35,
      heading: 90,
      recordedAt: timestamp,
      source: 'VEHICLE_HARDWARE_GPS'
    };
    const bodyStr = JSON.stringify(body);
    const signature = signPayload(bodyStr);

    // First request should succeed
    const firstRes = await request(app)
      .post('/api/v1/location/ingest')
      .set('Content-Type', 'application/json')
      .set('X-Device-Id', deviceId)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', nonce)
      .set('X-Signature-SHA256', signature)
      .send(bodyStr);

    expect(firstRes.status).toBe(202);

    // Second request with identical deviceId and nonce must be rejected
    const replayRes = await request(app)
      .post('/api/v1/location/ingest')
      .set('Content-Type', 'application/json')
      .set('X-Device-Id', deviceId)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', nonce)
      .set('X-Signature-SHA256', signature)
      .send(bodyStr);

    expect(replayRes.status).toBe(409);
    expect(replayRes.body.error.code).toBe('CONFLICT');
    expect(replayRes.body.error.message).toContain('Replay attack detected');
  });

  it('should return 404 when referenced Bus does not exist', async () => {
    vi.spyOn(Bus, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    } as any);

    const nonExistentBusId = new Types.ObjectId().toString();
    const timestamp = new Date().toISOString();
    const body = {
      busId: nonExistentBusId,
      latitude: 9.9252,
      longitude: 78.1198,
      speedKmph: 35,
      heading: 90,
      recordedAt: timestamp
    };
    const bodyStr = JSON.stringify(body);
    const signature = signPayload(bodyStr);

    const res = await request(app)
      .post('/api/v1/location/ingest')
      .set('Content-Type', 'application/json')
      .set('X-Device-Id', deviceId)
      .set('X-Timestamp', timestamp)
      .set('X-Nonce', crypto.randomUUID())
      .set('X-Signature-SHA256', signature)
      .send(bodyStr);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
