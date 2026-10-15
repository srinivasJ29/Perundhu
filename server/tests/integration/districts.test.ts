import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { District, BusStand } from '../../src/models';

describe('District Read Endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/districts', () => {
    it('should return 200 with paginated active districts', async () => {
      const mockDoc = {
        _id: new Types.ObjectId('650000000000000000000001'),
        code: 'MDU',
        nameEn: 'Madurai',
        nameTa: 'மதுரை',
        headquarters: 'Madurai',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      };

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockDoc])
      };

      vi.spyOn(District, 'find').mockReturnValue(mockQuery as any);
      vi.spyOn(District, 'countDocuments').mockResolvedValue(1 as any);

      const response = await request(app)
        .get('/api/v1/districts?page=1&limit=10')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual({
        id: '650000000000000000000001',
        code: 'MDU',
        nameEn: 'Madurai',
        nameTa: 'மதுரை',
        headquarters: 'Madurai',
        createdAt: mockDoc.createdAt.toISOString(),
        updatedAt: mockDoc.updatedAt.toISOString()
      });
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    });

    it('should filter districts using search query q', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };

      const findSpy = vi.spyOn(District, 'find').mockReturnValue(mockQuery as any);
      vi.spyOn(District, 'countDocuments').mockResolvedValue(0 as any);

      const response = await request(app)
        .get('/api/v1/districts?q=Chennai')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          $or: expect.any(Array)
        })
      );
    });

    it('should reject invalid pagination parameters with 400 VALIDATION_ERROR', async () => {
      const response = await request(app)
        .get('/api/v1/districts?page=-1&limit=500')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'page' }),
          expect.objectContaining({ path: 'limit' })
        ])
      );
    });
  });

  describe('GET /api/v1/districts/:districtId/bus-stands', () => {
    it('should return 400 if districtId is not a valid 24-char ObjectId', async () => {
      const response = await request(app)
        .get('/api/v1/districts/not-an-id/bus-stands')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details[0].path).toBe('districtId');
    });

    it('should return 404 NOT_FOUND if district does not exist or is inactive', async () => {
      const validId = new Types.ObjectId().toString();

      vi.spyOn(District, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const response = await request(app)
        .get(`/api/v1/districts/${validId}/bus-stands`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('not found or inactive');
    });

    it('should return 200 with bus stands when district exists', async () => {
      const districtId = new Types.ObjectId();
      const standId = new Types.ObjectId();

      vi.spyOn(District, 'findOne').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({ _id: districtId })
      } as any);

      const mockStand = {
        _id: standId,
        districtId,
        code: 'MDU-MGR',
        nameEn: 'Mattuthavani',
        nameTa: 'மாட்டுத்தாவணி',
        location: { type: 'Point', coordinates: [78.1633, 9.9472] },
        standType: 'INTERCITY_TERMINAL',
        totalPlatforms: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(BusStand, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(BusStand, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockStand])
      } as any);

      const response = await request(app)
        .get(`/api/v1/districts/${districtId}/bus-stands`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].code).toBe('MDU-MGR');
      expect(response.body.data[0].id).toBe(standId.toString());
      expect(response.body.pagination.total).toBe(1);
    });
  });
});
