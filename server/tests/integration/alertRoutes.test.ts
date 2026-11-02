/**
 * PERUNDHU (பேருந்து) — Service Alert Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { ServiceAlert } from '../../src/models';

describe('Service Alert Endpoints (GET /api/v1/alerts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockAlert = {
    _id: new Types.ObjectId(),
    titleEn: 'Chithirai Festival Transit Operations Advisory',
    titleTa: 'சித்திரைத் திருவிழா சிறப்புப் பேருந்து இயக்கம் அறிவிப்பு',
    descriptionEn: 'High frequency corridor operations.',
    descriptionTa: 'அதிக அதிர்வெண் கொண்ட பேருந்து இயக்கம்.',
    alertType: 'FESTIVAL_SPECIAL',
    severity: 'INFO',
    districtCode: 'MDU',
    affectedRouteNumbers: ['70', '77'],
    affectedStandCodes: ['MDU-MGR'],
    effectiveFrom: new Date('2026-01-01T00:00:00Z'),
    effectiveUntil: new Date('2028-12-31T23:59:59Z'),
    isActive: true,
    sourceOrganization: 'TNSTC (Madurai) Limited',
    sourceUrl: 'https://www.tnstc.in',
    verifiedAt: new Date('2026-01-01T00:00:00Z')
  };

  it('GET /api/v1/alerts should return 200 with list of verified active alerts', async () => {
    vi.spyOn(ServiceAlert, 'find').mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([mockAlert])
    } as any);

    const response = await request(app)
      .get('/api/v1/alerts?districtCode=MDU')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].titleEn).toBe(mockAlert.titleEn);
    expect(response.body.data[0].districtCode).toBe('MDU');
    expect(response.body.count).toBe(1);
  });

  it('GET /api/v1/alerts should return empty list when no alerts match filter', async () => {
    vi.spyOn(ServiceAlert, 'find').mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    } as any);

    const response = await request(app)
      .get('/api/v1/alerts?districtCode=CBE')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.count).toBe(0);
  });

  it('GET /api/v1/alerts/:alertId should return 200 with alert details', async () => {
    const alertId = mockAlert._id.toString();

    vi.spyOn(ServiceAlert, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockAlert)
    } as any);

    const response = await request(app)
      .get(`/api/v1/alerts/${alertId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(alertId);
    expect(response.body.data.titleEn).toBe(mockAlert.titleEn);
  });

  it('GET /api/v1/alerts/:alertId should return 400 for invalid ObjectId format', async () => {
    const response = await request(app)
      .get('/api/v1/alerts/invalid-alert-id')
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/alerts/:alertId should return 404 when alert does not exist', async () => {
    const nonExistentId = new Types.ObjectId().toString();

    vi.spyOn(ServiceAlert, 'findById').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    } as any);

    const response = await request(app)
      .get(`/api/v1/alerts/${nonExistentId}`)
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

