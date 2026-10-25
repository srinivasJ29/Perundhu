import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { Route, RouteDirection, RouteStopSequence } from '../../src/models';

describe('GET /api/v1/routes/:routeId/directions/:directionId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 if routeId or directionId is not a valid ObjectId', async () => {
    const validId = new Types.ObjectId().toString();

    const res1 = await request(app)
      .get(`/api/v1/routes/bad-id/directions/${validId}`)
      .expect(400);
    expect(res1.body.error.code).toBe('VALIDATION_ERROR');

    const res2 = await request(app)
      .get(`/api/v1/routes/${validId}/directions/bad-id`)
      .expect(400);
    expect(res2.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if route does not exist or is inactive', async () => {
    const routeId = new Types.ObjectId();
    const directionId = new Types.ObjectId();

    vi.spyOn(Route, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null)
    } as any);

    const res = await request(app)
      .get(`/api/v1/routes/${routeId}/directions/${directionId}`)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Route with ID');
  });

  it('should return 404 if direction does not exist or does not belong to specified route', async () => {
    const routeId = new Types.ObjectId();
    const directionId = new Types.ObjectId();

    vi.spyOn(Route, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: routeId,
        routeNumber: '77',
        displayTitleEn: 'Mattuthavani to Thirumangalam',
        displayTitleTa: 'மாட்டுத்தாவணி - திருமங்கலம்',
        serviceCategory: 'TOWN_SERVICE'
      })
    } as any);

    vi.spyOn(RouteDirection, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null) // Not found for this routeId
    } as any);

    const res = await request(app)
      .get(`/api/v1/routes/${routeId}/directions/${directionId}`)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Route direction with ID');
  });

  it('should return 200 with ordered stop sequences and geometry', async () => {
    const routeId = new Types.ObjectId();
    const directionId = new Types.ObjectId();
    const stop1Id = new Types.ObjectId();
    const stop2Id = new Types.ObjectId();

    vi.spyOn(Route, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: routeId,
        routeNumber: '77',
        displayTitleEn: 'Mattuthavani to Thirumangalam',
        displayTitleTa: 'மாட்டுத்தாவணி - திருமங்கலம்',
        serviceCategory: 'TOWN_SERVICE'
      })
    } as any);

    vi.spyOn(RouteDirection, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: directionId,
        directionCode: 'OUTBOUND',
        totalDistanceKm: 22.8,
        estimatedDurationMins: 55,
        originStopId: stop1Id,
        destinationStopId: stop2Id,
        routePolyline: {
          type: 'LineString',
          coordinates: [
            [78.1633, 9.9472],
            [78.0011, 9.8244]
          ]
        }
      })
    } as any);

    const mockSequences = [
      {
        sequenceOrder: 1,
        distanceFromOriginKm: 0.0,
        cumulativeDurationMinutes: 0,
        isFareStage: true,
        stopId: {
          _id: stop1Id,
          code: 'STP-MDU-MGR',
          nameEn: 'Mattuthavani Terminal',
          nameTa: 'மாட்டுத்தாவணி முனையம்',
          location: { type: 'Point', coordinates: [78.1633, 9.9472] },
          landmark: 'Platform Bay 1',
          isActive: true
        }
      },
      {
        sequenceOrder: 2,
        distanceFromOriginKm: 22.8,
        cumulativeDurationMinutes: 55,
        isFareStage: true,
        stopId: {
          _id: stop2Id,
          code: 'STP-MDU-TMG',
          nameEn: 'Thirumangalam Bus Stand',
          nameTa: 'திருமங்கலம் பேருந்து நிலையம்',
          location: { type: 'Point', coordinates: [78.0011, 9.8244] },
          landmark: 'Terminus',
          isActive: true
        }
      }
    ];

    vi.spyOn(RouteStopSequence, 'find').mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockSequences)
    } as any);

    const res = await request(app)
      .get(`/api/v1/routes/${routeId}/directions/${directionId}`)
      .expect(200);

    expect(res.body).toHaveProperty('route');
    expect(res.body).toHaveProperty('direction');
    expect(res.body.route.routeNumber).toBe('77');
    expect(res.body.direction.directionCode).toBe('OUTBOUND');
    expect(res.body.direction.stopsCount).toBe(2);
    expect(res.body.direction.stops[0].sequenceOrder).toBe(1);
    expect(res.body.direction.stops[1].sequenceOrder).toBe(2);
    expect(res.body.direction.routePolyline).toEqual({
      type: 'LineString',
      coordinates: [
        [78.1633, 9.9472],
        [78.0011, 9.8244]
      ]
    });
  });

  it('should handle repeated visits to the same stop at distinct sequence positions', async () => {
    const routeId = new Types.ObjectId();
    const directionId = new Types.ObjectId();
    const centralHubStopId = new Types.ObjectId();
    const intermediateStopId = new Types.ObjectId();

    vi.spyOn(Route, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: routeId,
        routeNumber: '70-CIRCULAR',
        displayTitleEn: 'Circular Route',
        displayTitleTa: 'வட்டப் பாதை',
        serviceCategory: 'TOWN_SERVICE'
      })
    } as any);

    vi.spyOn(RouteDirection, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        _id: directionId,
        directionCode: 'OUTBOUND',
        totalDistanceKm: 15.0,
        estimatedDurationMins: 40,
        originStopId: centralHubStopId,
        destinationStopId: centralHubStopId,
        routePolyline: null // Missing geometry test
      })
    } as any);

    // Sequence 1: Central Hub, Sequence 2: Intermediate, Sequence 3: Central Hub again
    const mockSequences = [
      {
        sequenceOrder: 1,
        distanceFromOriginKm: 0.0,
        cumulativeDurationMinutes: 0,
        isFareStage: true,
        stopId: {
          _id: centralHubStopId,
          code: 'STP-MDU-PER',
          nameEn: 'Periyar Stand',
          nameTa: 'பெரியார்',
          location: { type: 'Point', coordinates: [78.1132, 9.9168] },
          isActive: true
        }
      },
      {
        sequenceOrder: 2,
        distanceFromOriginKm: 7.5,
        cumulativeDurationMinutes: 20,
        isFareStage: true,
        stopId: {
          _id: intermediateStopId,
          code: 'STP-MDU-GOR',
          nameEn: 'Goripalayam',
          nameTa: 'கோரிப்பாளையம்',
          location: { type: 'Point', coordinates: [78.1322, 9.9288] },
          isActive: true
        }
      },
      {
        sequenceOrder: 3,
        distanceFromOriginKm: 15.0,
        cumulativeDurationMinutes: 40,
        isFareStage: true,
        stopId: {
          _id: centralHubStopId,
          code: 'STP-MDU-PER',
          nameEn: 'Periyar Stand',
          nameTa: 'பெரியார்',
          location: { type: 'Point', coordinates: [78.1132, 9.9168] },
          isActive: true
        }
      }
    ];

    vi.spyOn(RouteStopSequence, 'find').mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockSequences)
    } as any);

    const res = await request(app)
      .get(`/api/v1/routes/${routeId}/directions/${directionId}`)
      .expect(200);

    expect(res.body.direction.stopsCount).toBe(3);
    expect(res.body.direction.stops[0].sequenceOrder).toBe(1);
    expect(res.body.direction.stops[0].stop.code).toBe('STP-MDU-PER');
    expect(res.body.direction.stops[2].sequenceOrder).toBe(3);
    expect(res.body.direction.stops[2].stop.code).toBe('STP-MDU-PER'); // Verified repeated stop preserved
    expect(res.body.direction.routePolyline).toBeNull(); // Verified missing geometry handled cleanly
  });
});
