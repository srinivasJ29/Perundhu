import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import {
  Bus,
  LatestBusPosition
} from '../../src/models';
import { routeService } from '../../src/modules/routes/route.service';
import { etaService } from '../../src/modules/eta/eta.service';

describe('Live Fleet Tracking & Monitoring APIs (Integration)', () => {
  const dummyBusId = new Types.ObjectId();
  const dummyDepotId = new Types.ObjectId();
  const dummyRouteId = new Types.ObjectId();
  const dummyDirectionId = new Types.ObjectId();

  const mockBusDoc = {
    _id: dummyBusId,
    registrationNumber: 'TN-58-N-2211',
    fleetNumber: 'MDU-EXP-101',
    vehicleType: 'ORDINARY_NON_AC',
    manufacturer: 'Ashok Leyland',
    vehicleModel: 'Viking BS6',
    fuelType: 'DIESEL',
    seatingCapacity: 45,
    status: 'IN_SERVICE',
    isReserveFleet: false,
    depotId: {
      _id: dummyDepotId,
      name: 'Madurai Central Depot',
      code: 'MDU-DEP-01'
    },
    currentAssignedTripId: null,
    assignedGpsTrackerId: null,
    assignedEtmDeviceId: null
  };

  const mockPositionDoc = {
    _id: new Types.ObjectId(),
    busId: mockBusDoc,
    routeId: {
      _id: dummyRouteId,
      routeNumber: '70',
      displayTitleEn: 'Periyar to Mattuthavani',
      displayTitleTa: 'பெரியார் முதல் மாட்டுத்தாவணி வரை'
    },
    directionId: {
      _id: dummyDirectionId,
      directionCode: 'OUTBOUND',
      totalDistanceKm: 12.5,
      estimatedDurationMins: 35
    },
    location: {
      type: 'Point',
      coordinates: [78.1198, 9.9252] // [longitude, latitude]
    },
    snappedLocation: {
      type: 'Point',
      coordinates: [78.11985, 9.92525]
    },
    heading: 85,
    speedKmph: 36.5,
    trackingStatus: 'LIVE',
    source: 'VEHICLE_HARDWARE_GPS',
    satellitesCount: 8,
    gpsFixStatus: 'FIX_3D',
    batteryPercent: 92,
    recordedAt: new Date(),
    receivedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(etaService, 'calculateBusEta').mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/fleet/positions & GET /api/v1/buses/live', () => {
    it('should retrieve buses with valid latest accepted positions with pagination', async () => {
      vi.spyOn(LatestBusPosition, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockPositionDoc])
      } as any);

      const res = await request(app)
        .get('/api/v1/fleet/positions')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(1);

      const busItem = res.body.data[0];
      expect(busItem.busId).toBe(dummyBusId.toString());
      expect(busItem.registrationNumber).toBe('TN-58-N-2211');
      expect(busItem.location.coordinates).toEqual([78.1198, 9.9252]);
      expect(busItem.source).toBe('VEHICLE_HARDWARE_GPS');
      expect(busItem.isSimulated).toBe(false);
      expect(busItem.freshness).toBe('HEALTHY');
    });

    it('should support bounding box viewport queries', async () => {
      const countSpy = vi.spyOn(LatestBusPosition, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockPositionDoc])
      } as any);

      const res = await request(app)
        .get('/api/v1/fleet/positions')
        .query({ bbox: '78.10,9.90,78.20,9.95' });

      expect(res.status).toBe(200);
      expect(countSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          location: {
            $geoWithin: {
              $box: [
                [78.10, 9.90],
                [78.20, 9.95]
              ]
            }
          }
        })
      );
    });

    it('should support filtering by simulated sources', async () => {
      const countSpy = vi.spyOn(LatestBusPosition, 'countDocuments').mockResolvedValue(0 as any);
      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      } as any);

      const res = await request(app)
        .get('/api/v1/buses/live')
        .query({ isSimulated: 'true' });

      expect(res.status).toBe(200);
      expect(countSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'SIMULATOR'
        })
      );
    });
  });

  describe('GET /api/v1/fleet/buses/:busId/live & GET /api/v1/buses/:busId/live', () => {
    it('should return 404 for a non-existent bus', async () => {
      vi.spyOn(Bus, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const res = await request(app).get(`/api/v1/fleet/buses/${dummyBusId}/live`);
      expect(res.status).toBe(404);
      expect(res.body.error.message.toLowerCase()).toContain('not found');
    });

    it('should return full live details for a selected bus with route and health', async () => {
      vi.spyOn(Bus, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockBusDoc)
      } as any);

      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          ...mockPositionDoc,
          busId: dummyBusId
        })
      } as any);

      vi.spyOn(routeService, 'getRouteDirectionDetails').mockResolvedValue({
        route: {
          id: dummyRouteId.toString(),
          routeNumber: '70',
          displayTitleEn: 'Periyar to Mattuthavani',
          displayTitleTa: 'பெரியார் முதல் மாட்டுத்தாவணி வரை',
          serviceCategory: 'CITY_ORDINARY'
        },
        direction: {
          id: dummyDirectionId.toString(),
          directionCode: 'OUTBOUND',
          totalDistanceKm: 12.5,
          estimatedDurationMins: 35,
          originStand: null,
          destinationStand: null,
          originStopId: new Types.ObjectId().toString(),
          destinationStopId: new Types.ObjectId().toString(),
          routePolyline: null,
          stopsCount: 0,
          stops: []
        }
      });

      const res = await request(app).get(`/api/v1/buses/${dummyBusId}/live`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bus.registrationNumber).toBe('TN-58-N-2211');
      expect(res.body.data.latestPosition.coordinates).toEqual([78.1198, 9.9252]);
      expect(res.body.data.latestPosition.isSimulated).toBe(false);
      expect(res.body.data.latestPosition.gpsFixStatus).toBe('FIX_3D');
      expect(res.body.data.deviceHealth).toBeDefined();
      expect(res.body.data.deviceHealth.gpsSignalStatus).toBe('ACQUIRED_3D');
      expect(res.body.data.routeDetails).toBeDefined();
    });

    it('should sanitize credentials and never expose HMAC secrets or staff tokens', async () => {
      vi.spyOn(Bus, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockBusDoc)
      } as any);

      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({
          ...mockPositionDoc,
          busId: dummyBusId
        })
      } as any);

      vi.spyOn(routeService, 'getRouteDirectionDetails').mockResolvedValue(null as any);

      const res = await request(app).get(`/api/v1/fleet/buses/${dummyBusId}/live`);
      expect(res.status).toBe(200);

      const jsonStr = JSON.stringify(res.body);
      expect(jsonStr).not.toContain('deviceSecret');
      expect(jsonStr).not.toContain('hmac');
      expect(jsonStr).not.toContain('accessToken');
      expect(jsonStr).not.toContain('refreshToken');
    });
  });
});
