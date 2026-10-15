import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { BusStand } from '../../src/models';

describe('GET /api/v1/bus-stands/nearby', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 if lat or lng is missing', async () => {
    const response = await request(app)
      .get('/api/v1/bus-stands/nearby?lat=9.925')
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.some((d: any) => d.path === 'lng')).toBe(true);
  });

  it('should return 400 if coordinates are out of valid geographic range', async () => {
    const response = await request(app)
      .get('/api/v1/bus-stands/nearby?lat=120.0&lng=78.1')
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.some((d: any) => d.path === 'lat')).toBe(true);
  });

  it('should return 400 if radiusMeters is outside allowable boundaries [100, 50000]', async () => {
    const tooSmall = await request(app)
      .get('/api/v1/bus-stands/nearby?lat=9.925&lng=78.119&radiusMeters=50')
      .expect(400);

    expect(tooSmall.body.error.details.some((d: any) => d.path === 'radiusMeters')).toBe(true);

    const tooLarge = await request(app)
      .get('/api/v1/bus-stands/nearby?lat=9.925&lng=78.119&radiusMeters=60000')
      .expect(400);

    expect(tooLarge.body.error.details.some((d: any) => d.path === 'radiusMeters')).toBe(true);
  });

  it('should execute $geoNear aggregation and return sorted bus stands with distance in meters', async () => {
    const standId = new Types.ObjectId();
    const districtId = new Types.ObjectId();

    const mockAggregateResult = [
      {
        data: [
          {
            _id: standId,
            districtId,
            code: 'MDU-MGR',
            nameEn: 'Mattuthavani',
            nameTa: 'மாட்டுத்தாவணி',
            location: { type: 'Point', coordinates: [78.1633, 9.9472] },
            standType: 'INTERCITY_TERMINAL',
            totalPlatforms: 8,
            distanceMeters: 450.5
          }
        ],
        totalCount: [{ count: 1 }]
      }
    ];

    const aggregateSpy = vi.spyOn(BusStand, 'aggregate').mockResolvedValue(mockAggregateResult as any);

    const response = await request(app)
      .get('/api/v1/bus-stands/nearby?lat=9.945&lng=78.160&radiusMeters=2000')
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual({
      id: standId.toString(),
      districtId: districtId.toString(),
      code: 'MDU-MGR',
      nameEn: 'Mattuthavani',
      nameTa: 'மாட்டுத்தாவணி',
      location: { type: 'Point', coordinates: [78.1633, 9.9472] },
      standType: 'INTERCITY_TERMINAL',
      totalPlatforms: 8,
      distanceMeters: 450.5
    });
    expect(response.body.pagination.total).toBe(1);

    // Verify $geoNear was invoked with spherical true and proper coords
    expect(aggregateSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $geoNear: expect.objectContaining({
            spherical: true,
            maxDistance: 2000,
            near: { type: 'Point', coordinates: [78.16, 9.945] }
          })
        })
      ])
    );
  });

  it('should return 200 with empty data array when no stands match within radius', async () => {
    vi.spyOn(BusStand, 'aggregate').mockResolvedValue([
      {
        data: [],
        totalCount: []
      }
    ] as any);

    const response = await request(app)
      .get('/api/v1/bus-stands/nearby?lat=9.0&lng=77.0&radiusMeters=1000')
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
    expect(response.body.pagination.hasNextPage).toBe(false);
  });
});
