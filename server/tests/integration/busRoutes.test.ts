import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { Bus, ScheduledTrip } from '../../src/models';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Bus Fleet Endpoints (Integration)', () => {
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
  });

  // ---------------------------------------------------------------------------
  // 1. GET /api/v1/buses
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/buses', () => {
    it('should return 200 with paginated active buses', async () => {
      const mockBus = {
        _id: new Types.ObjectId('650000000000000000000010'),
        registrationNumber: 'TN-58-N-2144',
        fleetNumber: 'MDU-MGR-084',
        depotName: 'Madurai Central Depot',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'IN_SERVICE',
        currentAssignedTripId: undefined,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      };

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockBus])
      };

      vi.spyOn(Bus, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(Bus, 'find').mockReturnValue(mockQuery as any);

      const res = await request(app)
        .get('/api/v1/buses?page=1&limit=10')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].registrationNumber).toBe('TN-58-N-2144');
      expect(res.body.data[0].fleetNumber).toBe('MDU-MGR-084');
      expect(res.body.pagination.total).toBe(1);
    });

    it('should allow filtering buses by status and vehicleType', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };

      const findSpy = vi.spyOn(Bus, 'find').mockReturnValue(mockQuery as any);
      vi.spyOn(Bus, 'countDocuments').mockResolvedValue(0 as any);

      await request(app)
        .get('/api/v1/buses?status=MAINTENANCE&vehicleType=DELUXE')
        .expect(200);

      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'MAINTENANCE',
          vehicleType: 'DELUXE',
          isActive: true
        })
      );
    });

    it('should reject invalid status filter with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/v1/buses?status=UNKNOWN_STATUS')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. GET /api/v1/buses/:busId
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/buses/:busId', () => {
    it('should return 400 for invalid busId format', async () => {
      const res = await request(app)
        .get('/api/v1/buses/invalid-id')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if bus does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      vi.spyOn(Bus, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const res = await request(app)
        .get(`/api/v1/buses/${nonExistentId}`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 with bus details when found', async () => {
      const busId = new Types.ObjectId();
      const mockBus = {
        _id: busId,
        registrationNumber: 'TN-58-N-2144',
        fleetNumber: 'MDU-MGR-084',
        depotName: 'Madurai Central',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'IN_SERVICE',
        currentAssignedTripId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(Bus, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockBus)
      } as any);

      const res = await request(app)
        .get(`/api/v1/buses/${busId.toString()}`)
        .expect(200);

      expect(res.body.data.id).toBe(busId.toString());
      expect(res.body.data.registrationNumber).toBe('TN-58-N-2144');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GET /api/v1/buses/:busId/trips
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/buses/:busId/trips', () => {
    it('should return 404 if bus is not found or inactive', async () => {
      const busId = new Types.ObjectId().toString();
      vi.spyOn(Bus, 'exists').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/buses/${busId}/trips`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 with trips for bus', async () => {
      const busId = new Types.ObjectId();
      vi.spyOn(Bus, 'exists').mockResolvedValue({ _id: busId } as any);

      const mockTrip = {
        _id: new Types.ObjectId(),
        tripCode: 'TRIP-70-OUT-0800',
        routeDirectionId: new Types.ObjectId(),
        busId,
        departureTime: '08:00',
        arrivalTime: '08:50',
        operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        status: 'SCHEDULED',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(ScheduledTrip, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(ScheduledTrip, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockTrip])
      } as any);

      const res = await request(app)
        .get(`/api/v1/buses/${busId.toString()}/trips?dayOfWeek=MON`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].tripCode).toBe('TRIP-70-OUT-0800');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Protected Admin Operations
  // ---------------------------------------------------------------------------
  describe('Admin Bus Management', () => {
    it('should reject unauthenticated request with 401 UNAUTHORIZED on POST /api/v1/admin/buses', async () => {
      const res = await request(app)
        .post('/api/v1/admin/buses')
        .send({
          registrationNumber: 'TN-58-N-9999',
          fleetNumber: 'MDU-TEST-01',
          depotName: 'Test Depot'
        })
        .expect(401);

      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-admin (PASSENGER) user with 403 FORBIDDEN on POST /api/v1/admin/buses', async () => {
      const res = await request(app)
        .post('/api/v1/admin/buses')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          registrationNumber: 'TN-58-N-9999',
          fleetNumber: 'MDU-TEST-01',
          depotName: 'Test Depot'
        })
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow ADMIN to successfully create a new bus with 201 Created', async () => {
      vi.spyOn(Bus, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const newBusId = new Types.ObjectId();
      vi.spyOn(Bus, 'create').mockResolvedValue({
        _id: newBusId,
        registrationNumber: 'TN-58-N-9999',
        fleetNumber: 'MDU-TEST-01',
        depotName: 'Central Depot',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'IN_SERVICE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/buses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          registrationNumber: 'TN-58-N-9999',
          fleetNumber: 'MDU-TEST-01',
          depotName: 'Central Depot'
        })
        .expect(201);

      expect(res.body.data.registrationNumber).toBe('TN-58-N-9999');
      expect(res.body.data.id).toBe(newBusId.toString());
    });

    it('should allow ADMIN to update bus status with 200 OK', async () => {
      const busId = new Types.ObjectId();
      const mockBus = {
        _id: busId,
        registrationNumber: 'TN-58-N-2144',
        fleetNumber: 'MDU-MGR-084',
        depotName: 'Madurai Central',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'IN_SERVICE',
        currentAssignedTripId: new Types.ObjectId(),
        isActive: true,
        save: vi.fn().mockResolvedValue(true),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus as any);

      const res = await request(app)
        .patch(`/api/v1/admin/buses/${busId.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'MAINTENANCE' })
        .expect(200);

      expect(res.body.data.status).toBe('MAINTENANCE');
      expect(mockBus.currentAssignedTripId).toBeUndefined();
    });
  });
});
