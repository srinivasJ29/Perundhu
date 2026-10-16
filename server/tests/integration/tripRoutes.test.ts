import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import {
  ScheduledTrip,
  TripStopTime,
  Route,
  RouteDirection,
  RouteStopSequence,
  Bus,
  Stop
} from '../../src/models';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Scheduled Trips & Timetables (Integration)', () => {
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
  // 1. GET /api/v1/trips
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/trips', () => {
    it('should return 200 with paginated scheduled trips', async () => {
      const mockTrip = {
        _id: new Types.ObjectId('650000000000000000000030'),
        tripCode: 'TRIP-70-OUT-0800',
        routeDirectionId: {
          _id: new Types.ObjectId('650000000000000000000031'),
          directionCode: 'OUTBOUND',
          originStopId: new Types.ObjectId(),
          destinationStopId: new Types.ObjectId(),
          totalDistanceKm: 15.2,
          estimatedDurationMins: 45,
          routeId: {
            _id: new Types.ObjectId('650000000000000000000032'),
            routeNumber: '70',
            displayTitleEn: 'Periyar to Mattuthavani',
            displayTitleTa: 'பெரியார் - மாட்டுத்தாவணி',
            serviceCategory: 'TOWN_SERVICE'
          }
        },
        busId: {
          _id: new Types.ObjectId('650000000000000000000033'),
          registrationNumber: 'TN-58-N-2144',
          fleetNumber: 'MDU-MGR-084',
          depotName: 'Madurai Central',
          vehicleType: 'ORDINARY_NON_AC',
          status: 'IN_SERVICE'
        },
        departureTime: '08:00',
        arrivalTime: '08:45',
        operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        status: 'SCHEDULED',
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      };

      vi.spyOn(ScheduledTrip, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(ScheduledTrip, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockTrip])
      } as any);

      const res = await request(app)
        .get('/api/v1/trips?page=1&limit=10')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].tripCode).toBe('TRIP-70-OUT-0800');
      expect(res.body.data[0].route.routeNumber).toBe('70');
      expect(res.body.data[0].bus.registrationNumber).toBe('TN-58-N-2144');
    });

    it('should reject invalid query parameters with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/v1/trips?routeId=invalid-id')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. GET /api/v1/trips/:tripId
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/trips/:tripId', () => {
    it('should return 404 if trip does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();

      vi.spyOn(ScheduledTrip, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const res = await request(app)
        .get(`/api/v1/trips/${nonExistentId}`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 with complete itinerary and ordered stop times', async () => {
      const tripId = new Types.ObjectId();
      const mockTrip = {
        _id: tripId,
        tripCode: 'TRIP-70-OUT-0800',
        routeDirectionId: {
          _id: new Types.ObjectId(),
          directionCode: 'OUTBOUND',
          originStopId: new Types.ObjectId(),
          destinationStopId: new Types.ObjectId(),
          totalDistanceKm: 12.0,
          estimatedDurationMins: 35,
          routeId: {
            _id: new Types.ObjectId(),
            routeNumber: '70',
            displayTitleEn: 'Periyar to Mattuthavani',
            displayTitleTa: 'பெரியார் - மாட்டுத்தாவணி',
            serviceCategory: 'TOWN_SERVICE'
          }
        },
        busId: null,
        departureTime: '08:00',
        arrivalTime: '08:35',
        operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        status: 'SCHEDULED',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(ScheduledTrip, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockTrip)
      } as any);

      const mockStopTime = {
        _id: new Types.ObjectId(),
        tripId,
        stopSequence: 1,
        scheduledArrivalTime: '08:00',
        scheduledDepartureTime: '08:02',
        stopId: {
          _id: new Types.ObjectId(),
          code: 'PERIYAR-01',
          nameEn: 'Periyar Bus Stand',
          nameTa: 'பெரியார் பேருந்து நிலையம்',
          location: { type: 'Point', coordinates: [78.1158, 9.9178] },
          landmark: 'Madurai Junction'
        }
      };

      vi.spyOn(TripStopTime, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockStopTime])
      } as any);

      const res = await request(app)
        .get(`/api/v1/trips/${tripId.toString()}`)
        .expect(200);

      expect(res.body.data.id).toBe(tripId.toString());
      expect(res.body.data.stopTimes).toHaveLength(1);
      expect(res.body.data.stopTimes[0].stop.nameEn).toBe('Periyar Bus Stand');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GET /api/v1/trips/active
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/trips/active', () => {
    it('should return 200 with persisted active trips', async () => {
      vi.spyOn(Bus, 'find').mockReturnValue({
        distinct: vi.fn().mockResolvedValue([])
      } as any);

      const activeTrip = {
        _id: new Types.ObjectId(),
        tripCode: 'TRIP-ACTIVE-01',
        routeDirectionId: {
          _id: new Types.ObjectId(),
          directionCode: 'OUTBOUND',
          originStopId: new Types.ObjectId(),
          destinationStopId: new Types.ObjectId(),
          totalDistanceKm: 10,
          estimatedDurationMins: 30,
          routeId: null
        },
        busId: null,
        departureTime: '09:00',
        arrivalTime: '09:30',
        operationalDays: ['MON'],
        status: 'IN_TRANSIT',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(ScheduledTrip, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(ScheduledTrip, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([activeTrip])
      } as any);

      const res = await request(app)
        .get('/api/v1/trips/active')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('IN_TRANSIT');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GET /api/v1/routes/:routeId/timetable
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/routes/:routeId/timetable', () => {
    it('should return 404 if route not found', async () => {
      const routeId = new Types.ObjectId().toString();
      vi.spyOn(Route, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const res = await request(app)
        .get(`/api/v1/routes/${routeId}/timetable`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 with planned timetable organized by direction and marked as non-real-time', async () => {
      const routeId = new Types.ObjectId();
      const originStopId = new Types.ObjectId();
      const destinationStopId = new Types.ObjectId();

      vi.spyOn(Route, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: routeId,
          routeNumber: '70',
          displayTitleEn: 'Periyar to Mattuthavani',
          displayTitleTa: 'பெரியார் - மாட்டுத்தாவணி',
          serviceCategory: 'TOWN_SERVICE'
        })
      } as any);

      const mockDirection = {
        _id: new Types.ObjectId(),
        directionCode: 'OUTBOUND',
        totalDistanceKm: 12.5,
        estimatedDurationMins: 40,
        originStopId: {
          _id: originStopId,
          code: 'PERIYAR',
          nameEn: 'Periyar',
          nameTa: 'பெரியார்'
        },
        destinationStopId: {
          _id: destinationStopId,
          code: 'MATTUTHAVANI',
          nameEn: 'Mattuthavani',
          nameTa: 'மாட்டுத்தாவணி'
        }
      };

      vi.spyOn(RouteDirection, 'find').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockDirection])
      } as any);

      const mockTrip = {
        _id: new Types.ObjectId(),
        tripCode: 'TRIP-70-0800',
        departureTime: '08:00',
        arrivalTime: '08:40',
        status: 'SCHEDULED',
        operationalDays: ['THU'],
        busId: null
      };

      vi.spyOn(ScheduledTrip, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockTrip])
      } as any);

      const res = await request(app)
        .get(`/api/v1/routes/${routeId.toString()}/timetable?dayOfWeek=THU`)
        .expect(200);

      expect(res.body.isRealTimePrediction).toBe(false);
      expect(res.body.timezone).toContain('Asia/Kolkata');
      expect(res.body.directions).toHaveLength(1);
      expect(res.body.directions[0].departures).toHaveLength(1);
      expect(res.body.directions[0].departures[0].tripCode).toBe('TRIP-70-0800');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. GET /api/v1/stops/:stopId/departures
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/stops/:stopId/departures', () => {
    it('should return 404 if stop does not exist', async () => {
      const stopId = new Types.ObjectId().toString();
      vi.spyOn(Stop, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const res = await request(app)
        .get(`/api/v1/stops/${stopId}/departures`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 with empty departures when no buses operate in time window', async () => {
      const stopId = new Types.ObjectId();
      vi.spyOn(Stop, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: stopId,
          code: 'PERIYAR',
          nameEn: 'Periyar',
          nameTa: 'பெரியார்',
          location: { type: 'Point', coordinates: [78.11, 9.91] }
        })
      } as any);

      vi.spyOn(TripStopTime, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      } as any);

      const res = await request(app)
        .get(`/api/v1/stops/${stopId.toString()}/departures?fromTime=01:00&toTime=03:00`)
        .expect(200);

      expect(res.body.departures).toEqual([]);
      expect(res.body.isRealTimePrediction).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Admin Operations & Role Guards
  // ---------------------------------------------------------------------------
  describe('Admin Trip Operations & RBAC', () => {
    it('should reject unauthenticated request on POST /api/v1/admin/trips with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/v1/admin/trips')
        .send({
          tripCode: 'TRIP-NEW',
          routeDirectionId: new Types.ObjectId().toString(),
          departureTime: '08:00',
          arrivalTime: '08:30'
        })
        .expect(401);

      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-admin (PASSENGER) on POST /api/v1/admin/trips with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/v1/admin/trips')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          tripCode: 'TRIP-NEW',
          routeDirectionId: new Types.ObjectId().toString(),
          departureTime: '08:00',
          arrivalTime: '08:30'
        })
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow ADMIN to successfully create a new scheduled trip with 201 Created', async () => {
      const directionId = new Types.ObjectId();
      vi.spyOn(ScheduledTrip, 'exists').mockResolvedValue(null);
      vi.spyOn(RouteDirection, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: directionId, isActive: true })
      } as any);

      const createdTripId = new Types.ObjectId();
      vi.spyOn(ScheduledTrip, 'create').mockResolvedValue({
        _id: createdTripId,
        tripCode: 'TRIP-ADMIN-100',
        routeDirectionId: directionId,
        departureTime: '08:00',
        arrivalTime: '08:40',
        operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
        status: 'SCHEDULED',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tripCode: 'TRIP-ADMIN-100',
          routeDirectionId: directionId.toString(),
          departureTime: '08:00',
          arrivalTime: '08:40'
        })
        .expect(201);

      expect(res.body.data.tripCode).toBe('TRIP-ADMIN-100');
      expect(res.body.data.id).toBe(createdTripId.toString());
    });

    it('should reject trip creation if assigned bus is in MAINTENANCE with 400 VALIDATION_ERROR', async () => {
      const directionId = new Types.ObjectId();
      const busId = new Types.ObjectId();

      vi.spyOn(ScheduledTrip, 'exists').mockResolvedValue(null);
      vi.spyOn(RouteDirection, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: directionId, isActive: true })
      } as any);

      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: busId,
          registrationNumber: 'TN-58-N-2144',
          status: 'MAINTENANCE',
          isActive: true
        })
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tripCode: 'TRIP-MAINT-BUS',
          routeDirectionId: directionId.toString(),
          busId: busId.toString(),
          departureTime: '08:00',
          arrivalTime: '08:40'
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('MAINTENANCE');
    });

    it('should allow ADMIN to update trip status with 200 OK', async () => {
      const tripId = new Types.ObjectId();
      const mockTrip = {
        _id: tripId,
        status: 'SCHEDULED',
        busId: null,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(ScheduledTrip, 'findById').mockResolvedValue(mockTrip as any);

      // Also mock findById for getTripById returned after update
      const detailedTrip = {
        _id: tripId,
        tripCode: 'TRIP-UPDATE-STATUS',
        routeDirectionId: {
          _id: new Types.ObjectId(),
          directionCode: 'OUTBOUND',
          originStopId: new Types.ObjectId(),
          destinationStopId: new Types.ObjectId(),
          totalDistanceKm: 10,
          estimatedDurationMins: 30,
          routeId: null
        },
        busId: null,
        departureTime: '08:00',
        arrivalTime: '08:30',
        operationalDays: ['MON'],
        status: 'IN_TRANSIT',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(ScheduledTrip, 'findById').mockReturnValueOnce(mockTrip as any).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(detailedTrip)
      } as any);

      vi.spyOn(TripStopTime, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      } as any);

      const res = await request(app)
        .patch(`/api/v1/admin/trips/${tripId.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_TRANSIT' })
        .expect(200);

      expect(res.body.data.status).toBe('IN_TRANSIT');
    });

    it('should allow ADMIN to assign a bus to a trip with 200 OK', async () => {
      const tripId = new Types.ObjectId();
      const busId = new Types.ObjectId();

      const mockTrip = {
        _id: tripId,
        busId: null,
        status: 'SCHEDULED',
        save: vi.fn().mockResolvedValue(true)
      };

      const mockBus = {
        _id: busId,
        registrationNumber: 'TN-58-N-2144',
        status: 'IN_SERVICE',
        isActive: true,
        currentAssignedTripId: null,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(ScheduledTrip, 'findById').mockReturnValueOnce(mockTrip as any).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          _id: tripId,
          tripCode: 'TRIP-ASSIGN',
          routeDirectionId: {
            _id: new Types.ObjectId(),
            directionCode: 'OUTBOUND',
            originStopId: new Types.ObjectId(),
            destinationStopId: new Types.ObjectId(),
            totalDistanceKm: 10,
            estimatedDurationMins: 30,
            routeId: null
          },
          busId: mockBus,
          departureTime: '08:00',
          arrivalTime: '08:30',
          operationalDays: ['MON'],
          status: 'SCHEDULED',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      } as any);

      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus as any);
      vi.spyOn(TripStopTime, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      } as any);

      const res = await request(app)
        .patch(`/api/v1/admin/trips/${tripId.toString()}/bus`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ busId: busId.toString() })
        .expect(200);

      expect(res.body.data.bus.registrationNumber).toBe('TN-58-N-2144');
    });

    it('should reject bus assignment with 409 CONFLICT if bus is already assigned to another active trip', async () => {
      const tripId = new Types.ObjectId();
      const busId = new Types.ObjectId();
      const anotherTripId = new Types.ObjectId();

      const mockTrip = {
        _id: tripId,
        busId: null,
        status: 'SCHEDULED'
      };

      const mockBus = {
        _id: busId,
        registrationNumber: 'TN-58-N-2144',
        status: 'IN_SERVICE',
        isActive: true,
        currentAssignedTripId: anotherTripId
      };

      vi.spyOn(ScheduledTrip, 'findById').mockResolvedValue(mockTrip as any);
      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus as any);

      const res = await request(app)
        .patch(`/api/v1/admin/trips/${tripId.toString()}/bus`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ busId: busId.toString() })
        .expect(409);

      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already actively assigned');
    });
  });
});
