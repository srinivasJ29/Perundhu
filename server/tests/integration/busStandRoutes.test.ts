import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { BusStand, Stop, RouteStopSequence, RouteDirection } from '../../src/models';

describe('GET /api/v1/bus-stands/:standId/routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 if standId is not a valid ObjectId', async () => {
    const response = await request(app)
      .get('/api/v1/bus-stands/invalid-id/routes')
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if bus stand does not exist or is inactive', async () => {
    const validId = new Types.ObjectId().toString();

    vi.spyOn(BusStand, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null)
    } as any);

    const response = await request(app)
      .get(`/api/v1/bus-stands/${validId}/routes`)
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toContain('not found or inactive');
  });

  it('should discover routes serving the stand and deduplicate multiple matches', async () => {
    const standId = new Types.ObjectId();
    const stopId1 = new Types.ObjectId();
    const stopId2 = new Types.ObjectId();
    const routeId = new Types.ObjectId();
    const dirIdOutbound = new Types.ObjectId();
    const dirIdInbound = new Types.ObjectId();

    // 1. BusStand exists
    vi.spyOn(BusStand, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ _id: standId, code: 'MDU-MGR', nameEn: 'Mattuthavani' })
    } as any);

    // 2. Stops associated with this stand
    vi.spyOn(Stop, 'find').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: stopId1 }, { _id: stopId2 }])
    } as any);

    // 3. Stop sequences linking stop to directions
    vi.spyOn(RouteStopSequence, 'find').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { directionId: dirIdOutbound, stopId: stopId1, sequenceOrder: 1 },
        { directionId: dirIdInbound, stopId: stopId2, sequenceOrder: 14 }
      ])
    } as any);

    // 4. Route Directions matching
    const mockRoute = {
      _id: routeId,
      routeNumber: '77',
      displayTitleEn: 'Mattuthavani to Thirumangalam',
      displayTitleTa: 'மாட்டுத்தாவணி - திருமங்கலம்',
      serviceCategory: 'TOWN_SERVICE',
      isActive: true
    };

    const mockDirections = [
      {
        _id: dirIdOutbound,
        directionCode: 'OUTBOUND',
        totalDistanceKm: 22.8,
        estimatedDurationMins: 55,
        originStopId: stopId1,
        destinationStopId: new Types.ObjectId(),
        routeId: mockRoute
      },
      {
        _id: dirIdInbound,
        directionCode: 'INBOUND',
        totalDistanceKm: 22.8,
        estimatedDurationMins: 55,
        originStopId: new Types.ObjectId(),
        destinationStopId: stopId2,
        routeId: mockRoute
      }
    ];

    vi.spyOn(RouteDirection, 'find').mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockDirections)
    } as any);

    const response = await request(app)
      .get(`/api/v1/bus-stands/${standId}/routes`)
      .expect(200);

    // Route 77 must be present exactly once, with both OUTBOUND and INBOUND directions
    expect(response.body.data).toHaveLength(1);
    const routeItem = response.body.data[0];
    expect(routeItem.routeNumber).toBe('77');
    expect(routeItem.directions).toHaveLength(2);
    expect(routeItem.directions[0].directionCode).toBe('OUTBOUND');
    expect(routeItem.directions[0].stopSequenceAtStand).toBe(1);
    expect(routeItem.directions[1].directionCode).toBe('INBOUND');
    expect(routeItem.directions[1].stopSequenceAtStand).toBe(14);
    expect(response.body.pagination.total).toBe(1);
  });
});
