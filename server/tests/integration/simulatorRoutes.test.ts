import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { routeSimulator } from '../../src/modules/location/simulator.service';
import { locationRepository } from '../../src/modules/location/location.repository';
import { Bus, ScheduledTrip, RouteDirection } from '../../src/models';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Admin Simulator Operations & RBAC (Integration)', () => {
  const adminToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'admin@tnstc.gov.in',
    role: 'ADMIN',
    sessionId: new Types.ObjectId().toString()
  });

  const passengerToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'passenger@example.com',
    role: 'PASSENGER',
    sessionId: new Types.ObjectId().toString()
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(locationRepository, 'saveLatestPosition').mockResolvedValue(true);
    vi.spyOn(locationRepository, 'appendLocationHistory').mockResolvedValue(true);
    routeSimulator.destroy();
  });

  afterEach(() => {
    routeSimulator.destroy();
  });

  // ---------------------------------------------------------------------------
  // 1. GET /api/v1/admin/simulator/status
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/admin/simulator/status', () => {
    it('should reject unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .get('/api/v1/admin/simulator/status')
        .expect(401);

      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-admin (PASSENGER) user with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/simulator/status')
        .set('Authorization', `Bearer ${passengerToken}`)
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow ADMIN to retrieve simulator status with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/simulator/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('isRunning');
      expect(res.body.data).toHaveProperty('activeBusesCount');
      expect(res.body.data).toHaveProperty('tickIntervalMs');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. POST /api/v1/admin/simulator/start
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/admin/simulator/start', () => {
    it('should reject unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/v1/admin/simulator/start')
        .send({})
        .expect(401);

      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-admin (PASSENGER) user with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/v1/admin/simulator/start')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({})
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject invalid simulation options with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/admin/simulator/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tickIntervalMs: 50 }) // Below 200ms minimum threshold
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('tickIntervalMs');
    });

    it('should allow ADMIN to successfully start simulation and discover eligible buses', async () => {
      const busId = new Types.ObjectId();
      const tripId = new Types.ObjectId();
      const directionId = new Types.ObjectId();
      const routeId = new Types.ObjectId();

      const mockBus = {
        _id: busId,
        registrationNumber: 'TN-58-N-2144',
        fleetNumber: 'MDU-MGR-084',
        status: 'IN_SERVICE',
        isActive: true,
        currentAssignedTripId: tripId
      };

      const mockTrip = {
        _id: tripId,
        tripCode: 'TRIP-70-0800',
        routeDirectionId: directionId,
        status: 'IN_TRANSIT',
        isActive: true
      };

      const mockDirection = {
        _id: directionId,
        routeId,
        directionCode: 'OUTBOUND',
        isActive: true,
        routePolyline: {
          type: 'LineString',
          coordinates: [
            [78.1633, 9.9472],
            [78.1158, 9.9178]
          ]
        }
      };

      vi.spyOn(Bus, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockBus])
      } as any);

      vi.spyOn(ScheduledTrip, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockTrip)
      } as any);

      vi.spyOn(RouteDirection, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDirection)
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/simulator/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          speedMultiplier: 2.0,
          tickIntervalMs: 2000
        })
        .expect(200);

      expect(res.body.data.isRunning).toBe(true);
      expect(res.body.data.speedMultiplier).toBe(2.0);
      expect(res.body.data.activeBusesCount).toBe(1);
      expect(res.body.data.buses[0].registrationNumber).toBe('TN-58-N-2144');
    });

    it('should exclude buses in MAINTENANCE or OFFLINE state from simulation', async () => {
      // Return empty because query filters status: 'IN_SERVICE'
      vi.spyOn(Bus, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/simulator/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(res.body.data.activeBusesCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. POST /api/v1/admin/simulator/stop & reset
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/admin/simulator/stop and /reset', () => {
    it('should allow ADMIN to stop active simulation with 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/admin/simulator/stop')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.isRunning).toBe(false);
    });

    it('should allow ADMIN to reset simulation to route origin with 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/admin/simulator/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toContain('reset');
      expect(res.body.data.isRunning).toBe(false);
    });
  });
});
