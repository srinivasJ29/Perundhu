import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { Bus, ScheduledTrip, LatestBusPosition, LocationHistory } from '../../src/models';
import { nextStopService } from '../../src/modules/eta/nextStop.service';
import { etaService } from '../../src/modules/eta/eta.service';

describe('Passenger Next-Stop & Dynamic ETA Endpoints (Integration)', () => {
  const tripId = new Types.ObjectId().toString();
  const busId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. GET /api/v1/trips/:tripId/next-stop
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/trips/:tripId/next-stop', () => {
    it('should return 400 VALIDATION_ERROR if tripId is not a valid ObjectId', async () => {
      const res = await request(app)
        .get('/api/v1/trips/invalid-trip-id/next-stop')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 NOT_FOUND if scheduled trip does not exist', async () => {
      vi.spyOn(ScheduledTrip, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/next-stop`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toContain('was not found');
    });

    it('should return 200 with next-stop detection for valid trip without requiring authentication', async () => {
      vi.spyOn(ScheduledTrip, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(tripId),
          tripCode: 'TRIP-70-01',
          busId: new Types.ObjectId(busId),
          status: 'IN_TRANSIT',
          isActive: true
        })
      } as any);

      vi.spyOn(nextStopService, 'detectNextStopForTrip').mockResolvedValue({
        tripId,
        tripCode: 'TRIP-70-01',
        busId,
        status: 'APPROACHING',
        currentStop: {
          id: new Types.ObjectId().toString(),
          code: 'STOP-01',
          nameEn: 'Periyar Bus Stand',
          nameTa: 'பெரியார் பேருந்து நிலையம்',
          sequence: 1,
          location: [78.1145, 9.9175],
          distanceFromOriginMeters: 0
        },
        nextStop: {
          id: new Types.ObjectId().toString(),
          code: 'STOP-02',
          nameEn: 'Simmakkal',
          nameTa: 'சிம்மக்கல்',
          sequence: 2,
          location: [78.1189, 9.9252],
          distanceFromOriginMeters: 1200
        },
        remainingDistanceMeters: 1200,
        distanceAlongRouteMeters: 0,
        totalRouteDistanceMeters: 5000,
        progressRatio: 0,
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR',
        isTerminalReached: false,
        isCompleted: false,
        isCancelled: false,
        confidence: 0.85
      });

      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/next-stop`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.tripId).toBe(tripId);
      expect(res.body.data.status).toBe('APPROACHING');
      expect(res.body.data.nextStop.nameEn).toBe('Simmakkal');
      expect(res.body.data.trackingStatus).toBe('SIMULATED');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. GET /api/v1/trips/:tripId/eta
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/trips/:tripId/eta', () => {
    it('should return 400 VALIDATION_ERROR if tripId is not a valid ObjectId', async () => {
      const res = await request(app)
        .get('/api/v1/trips/not-an-objectid/eta')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 NOT_FOUND if trip does not exist', async () => {
      vi.spyOn(etaService, 'calculateTripEta').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/eta`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 200 with dynamic ETA predictions and simulated truthfulness', async () => {
      vi.spyOn(etaService, 'calculateTripEta').mockResolvedValue({
        tripId,
        tripCode: 'TRIP-70-01',
        busId,
        routeNumber: '70',
        directionCode: 'OUTBOUND',
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR',
        isRealTimePrediction: false,
        predictionSource: 'SIMULATED_MOVEMENT',
        confidence: 0.75,
        generatedAt: new Date().toISOString(),
        nextStop: {
          stopId: new Types.ObjectId().toString(),
          stopCode: 'STOP-02',
          stopNameEn: 'Simmakkal',
          stopNameTa: 'சிம்மக்கல்',
          stopSequence: 2,
          location: [78.1189, 9.9252],
          estimatedArrivalAt: new Date(Date.now() + 180000).toISOString(),
          etaSeconds: 180,
          etaMinutes: 3,
          remainingDistanceMeters: 1200,
          effectiveSpeedKmph: 24,
          predictionSource: 'SIMULATED_MOVEMENT',
          isRealTimePrediction: false,
          confidence: 0.75
        },
        downstreamStops: []
      });

      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/eta`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.tripId).toBe(tripId);
      expect(res.body.data.isRealTimePrediction).toBe(false);
      expect(res.body.data.predictionSource).toBe('SIMULATED_MOVEMENT');
      expect(res.body.data.nextStop.etaMinutes).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GET /api/v1/buses/:busId/eta
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/buses/:busId/eta', () => {
    it('should return 400 VALIDATION_ERROR if busId is not a valid ObjectId', async () => {
      const res = await request(app)
        .get('/api/v1/buses/bad-bus-id/eta')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 NOT_FOUND if bus does not exist', async () => {
      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const res = await request(app)
        .get(`/api/v1/buses/${busId}/eta`)
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toContain('was not found');
    });

    it('should return 200 with null activeTrip when bus exists but has no active trip', async () => {
      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(busId),
          registrationNumber: 'TN-58-N-1234',
          isActive: true
        })
      } as any);

      vi.spyOn(etaService, 'calculateBusEta').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/buses/${busId}/eta`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.busId).toBe(busId);
      expect(res.body.data.activeTrip).toBeNull();
      expect(res.body.data.message).toBe('Vehicle currently has no active scheduled trip');
    });

    it('should return 200 with active trip ETA when bus is in transit', async () => {
      vi.spyOn(Bus, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(busId),
          registrationNumber: 'TN-58-N-1234',
          isActive: true
        })
      } as any);

      vi.spyOn(etaService, 'calculateBusEta').mockResolvedValue({
        tripId,
        tripCode: 'TRIP-70-01',
        busId,
        routeNumber: '70',
        directionCode: 'OUTBOUND',
        trackingStatus: 'SIMULATED',
        source: 'SIMULATOR',
        isRealTimePrediction: false,
        predictionSource: 'SIMULATED_MOVEMENT',
        confidence: 0.8,
        generatedAt: new Date().toISOString(),
        downstreamStops: []
      });

      const res = await request(app)
        .get(`/api/v1/buses/${busId}/eta`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.busId).toBe(busId);
      expect(res.body.data.tripId).toBe(tripId);
      expect(res.body.data.routeNumber).toBe('70');
    });
  });
});
