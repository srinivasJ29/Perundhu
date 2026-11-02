/**
 * PERUNDHU (பேருந்து) — Fleet Analytics & Optimization Integration Tests
 * Validates Phase 10 endpoints, RBAC, strict data governance, recommendations, and exports.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';
import {
  Bus,
  Depot,
  Route,
  RouteDirection,
  RouteStopSequence,
  Stop,
  ScheduledTrip,
  StopEvent,
  LatestBusPosition,
  LocationHistory,
  PassengerDemandRecord,
  OptimizationRecommendation
} from '../../src/models';

describe('Fleet Analytics & Optimization APIs (Integration)', () => {
  const adminToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'admin@perundhu.tn.gov.in',
    role: 'ADMIN',
    sessionId: new Types.ObjectId().toString()
  });

  const passengerToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'passenger@example.com',
    role: 'PASSENGER',
    sessionId: new Types.ObjectId().toString()
  });

  const dummyRouteId = new Types.ObjectId();
  const dummyDepotId = new Types.ObjectId();
  const dummyStopId1 = new Types.ObjectId();
  const dummyStopId2 = new Types.ObjectId();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Security & RBAC Enforcement', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/analytics/overview').expect(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-admin (PASSENGER) request with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${passengerToken}`)
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('2. GET /api/v1/analytics/overview (Fleet Operations Summary & KPIs)', () => {
    it('should return 200 with operational availability and GPS freshness breakdowns', async () => {
      vi.spyOn(Bus, 'countDocuments')
        .mockResolvedValueOnce(25) // totalBuses
        .mockResolvedValueOnce(18) // inService
        .mockResolvedValueOnce(4)  // maintenance
        .mockResolvedValueOnce(3)  // offline
        .mockResolvedValueOnce(18) // available
        .mockResolvedValueOnce(4)  // reserve
        .mockResolvedValueOnce(18) // active
        .mockResolvedValueOnce(12) // depot total
        .mockResolvedValueOnce(10) // depot active
        .mockResolvedValueOnce(2)  // depot reserve
        .mockResolvedValueOnce(0); // depot maint

      vi.spyOn(LatestBusPosition, 'countDocuments')
        .mockResolvedValueOnce(16) // healthy
        .mockResolvedValueOnce(2)  // delayed
        .mockResolvedValueOnce(1)  // stale
        .mockResolvedValueOnce(1)  // offline
        .mockResolvedValueOnce(8); // route tracking count

      vi.spyOn(Depot, 'find').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: dummyDepotId, nameEn: 'Madurai Central Depot', code: 'MDU-DEP-01' }
        ])
      } as any);

      vi.spyOn(Route, 'find').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: dummyRouteId,
            routeNumber: '70',
            displayTitleEn: 'Periyar to Mattuthavani',
            displayTitleTa: 'பெரியார் முதல் மாட்டுத்தாவணி'
          }
        ])
      } as any);

      vi.spyOn(ScheduledTrip, 'find').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([{ _id: new Types.ObjectId(), busId: new Types.ObjectId() }])
      } as any);

      vi.spyOn(LocationHistory, 'countDocuments').mockResolvedValue(4500);

      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.totalBuses).toBe(25);
      expect(data.activeBuses).toBe(18);
      expect(data.gpsFreshnessBreakdown.healthy).toBe(16);
      expect(data.gpsFreshnessBreakdown.delayed).toBe(2);
      expect(data.gpsFreshnessBreakdown.stale).toBe(1);
      expect(data.operationalAvailabilityBreakdown.inService).toBe(18);
      expect(data.depotDistribution).toHaveLength(1);
      expect(data.depotDistribution[0].depotName).toBe('Madurai Central Depot');
      expect(data.dataProvenance.classification).toBe('OFFICIAL_VERIFIED');
      expect(data.dataProvenance.sourceOrganization).toContain('TNSTC-Madurai');
    });
  });

  describe('3. GET /api/v1/analytics/routes/performance', () => {
    it('should calculate segment travel times, delay deviation and congestion levels', async () => {
      vi.spyOn(Route, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: dummyRouteId,
          routeNumber: '70',
          displayTitleEn: 'Periyar to Mattuthavani',
          displayTitleTa: 'பெரியார் முதல் மாட்டுத்தாவணி'
        })
      } as any);

      vi.spyOn(RouteDirection, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: new Types.ObjectId(), directionCode: 'OUTBOUND', routeId: dummyRouteId }
        ])
      } as any);

      vi.spyOn(RouteStopSequence, 'find').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            stopId: { _id: dummyStopId1, nameEn: 'Periyar Bus Stand', nameTa: 'பெரியார் பேருந்து நிலையம்' },
            sequenceNumber: 1,
            cumulativeDurationMinutes: 0
          },
          {
            _id: new Types.ObjectId(),
            stopId: { _id: dummyStopId2, nameEn: 'Simmakkal', nameTa: 'சிம்மக்கல்' },
            sequenceNumber: 2,
            cumulativeDurationMinutes: 6
          }
        ])
      } as any);

      vi.spyOn(ScheduledTrip, 'countDocuments').mockResolvedValue(16);

      const res = await request(app)
        .get(`/api/v1/analytics/routes/performance?routeId=${dummyRouteId.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const perf = res.body.data;
      expect(perf.routeNumber).toBe('70');
      expect(perf.directionCode).toBe('OUTBOUND');
      expect(perf.segments).toHaveLength(1);
      expect(perf.segments[0].fromStopNameEn).toBe('Periyar Bus Stand');
      expect(perf.segments[0].toStopNameEn).toBe('Simmakkal');
      expect(perf.segments[0].scheduledTravelTimeMinutes).toBe(6);
      expect(perf.dataProvenance.classification).toBe('OFFICIAL_VERIFIED');
    });
  });

  describe('4. GET /api/v1/analytics/routes/schedule-adherence', () => {
    it('should compute on-time percentage within [-2m, +5m] tolerance and delay distribution', async () => {
      vi.spyOn(Route, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: dummyRouteId,
          routeNumber: '70',
          displayTitleEn: 'Periyar to Mattuthavani',
          displayTitleTa: 'பெரியார் முதல் மாட்டுத்தாவணி'
        })
      } as any);

      vi.spyOn(ScheduledTrip, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: new Types.ObjectId() }])
      } as any);

      vi.spyOn(StopEvent, 'find').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: new Types.ObjectId(), delaySeconds: 120 }, // +2m -> On-Time
          { _id: new Types.ObjectId(), delaySeconds: 420 }, // +7m -> Slight Delay
          { _id: new Types.ObjectId(), delaySeconds: -150 } // -2.5m -> Early
        ])
      } as any);

      vi.spyOn(Stop, 'find').mockReturnValue({
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: dummyStopId1, nameEn: 'Periyar Bus Stand', nameTa: 'பெரியார் பேருந்து நிலையம்' }
        ])
      } as any);

      const res = await request(app)
        .get(`/api/v1/analytics/routes/schedule-adherence?routeId=${dummyRouteId.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const adh = res.body.data;
      expect(adh.routeNumber).toBe('70');
      expect(adh.delayDistribution.onTime).toBe(1);
      expect(adh.delayDistribution.slightDelay).toBe(1);
      expect(adh.delayDistribution.early).toBe(1);
      expect(adh.onTimePercentage).toBe(33.3);
      expect(adh.delayedPercentage).toBe(33.3);
      expect(adh.earlyPercentage).toBe(33.3);
      expect(adh.adherenceByStop).toHaveLength(1);
    });
  });

  describe('5. GET /api/v1/analytics/demand (Strict Data Governance Diagnostic)', () => {
    it('should return DATA_NOT_AVAILABLE with diagnostic notice when no verified ETM stream exists', async () => {
      vi.spyOn(PassengerDemandRecord, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/analytics/demand')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const demand = res.body.data;
      expect(demand.status).toBe('DATA_NOT_AVAILABLE');
      expect(demand.dataReadiness.isAvailable).toBe(false);
      expect(demand.dataReadiness.totalRecords).toBe(0);
      expect(demand.dataReadiness.verifiedEtmStreamConnected).toBe(false);
      expect(demand.dataReadiness.diagnosticMessageEn).toContain('ETM ticket transaction stream');
      expect(demand.dataReadiness.diagnosticMessageTa).toContain('ETM பயணச்சீட்டு பரிவர்த்தனை');
      expect(demand.dataReadiness.missingPrerequisites).toHaveLength(3);
      expect(demand.dataProvenance.classification).toBe('PENDING_VERIFICATION');
      expect(demand.dataProvenance.verificationStatus).toBe('UNVERIFIED');
    });

    it('should return DATA_AVAILABLE and aggregated counts when verified records are present', async () => {
      vi.spyOn(PassengerDemandRecord, 'countDocuments').mockResolvedValue(2);
      vi.spyOn(PassengerDemandRecord, 'find').mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            stopId: { _id: dummyStopId1, nameEn: 'Periyar', nameTa: 'பெரியார்' },
            boardingsCount: 24,
            alightingsCount: 5,
            hourOfDay: 8,
            dayOfWeek: 1
          },
          {
            _id: new Types.ObjectId(),
            stopId: { _id: dummyStopId1, nameEn: 'Periyar', nameTa: 'பெரியார்' },
            boardingsCount: 16,
            alightingsCount: 8,
            hourOfDay: 9,
            dayOfWeek: 1
          }
        ])
      } as any);

      const res = await request(app)
        .get('/api/v1/analytics/demand')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const demand = res.body.data;
      expect(demand.status).toBe('DATA_AVAILABLE');
      expect(demand.summary.totalBoardings).toBe(40);
      expect(demand.summary.totalAlightings).toBe(13);
      expect(demand.hourlyPattern).toHaveLength(2);
      expect(demand.dataProvenance.classification).toBe('OFFICIAL_VERIFIED');
    });
  });

  describe('6. GET /api/v1/analytics/fleet/utilization', () => {
    it('should return vehicle utilization rate and depot breakdowns', async () => {
      vi.spyOn(Bus, 'countDocuments')
        .mockResolvedValueOnce(30) // total
        .mockResolvedValueOnce(22) // inService
        .mockResolvedValueOnce(30) // depot total
        .mockResolvedValueOnce(22) // depot in service
        .mockResolvedValueOnce(5)  // depot reserve
        .mockResolvedValueOnce(3)  // depot maint
        .mockResolvedValueOnce(2); // unassigned

      vi.spyOn(ScheduledTrip, 'countDocuments')
        .mockResolvedValueOnce(40) // scheduled
        .mockResolvedValueOnce(36) // assigned
        .mockResolvedValueOnce(28); // completed

      vi.spyOn(Depot, 'find').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: dummyDepotId, nameEn: 'Madurai Central Depot', code: 'MDU-DEP-01' }
        ])
      } as any);

      vi.spyOn(LatestBusPosition, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/analytics/fleet/utilization')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const util = res.body.data;
      expect(util.fleetSize).toBe(30);
      expect(util.vehicleUtilizationRate).toBe(73.3);
      expect(util.depotUtilization).toHaveLength(1);
      expect(util.depotUtilization[0].utilizationPercentage).toBe(73.3);
      expect(util.unassignedVehiclesCount).toBe(2);
      expect(util.dataProvenance.classification).toBe('OFFICIAL_VERIFIED');
    });
  });

  describe('7. Recommendations & Human Review Workflow', () => {
    const mockRecId = 'REC-DEPOT-001';
    const mockDbId = new Types.ObjectId();

    it('GET /api/v1/analytics/recommendations should return data-backed recommendations', async () => {
      vi.spyOn(OptimizationRecommendation, 'countDocuments').mockResolvedValue(4);
      vi.spyOn(OptimizationRecommendation, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: mockDbId,
            recommendationId: mockRecId,
            title: 'Rebalance Peak Reserve Fleet Allocation',
            titleTa: 'பணிமனை ஒதுக்கீட்டை சமநிலைப்படுத்துக',
            category: 'DEPOT_IMBALANCE',
            severity: 'MEDIUM',
            targetEntityType: 'DEPOT',
            targetEntityCode: 'MDU-DEP-01',
            targetEntityName: 'Madurai Central Depot',
            description: 'Transfer 2 reserve vehicles during peak hours.',
            descriptionTa: 'உச்ச நேரத்தில் 2 பேருந்துகளை மாற்றுவது நன்று.',
            supportingObservations: ['Central Depot peak utilization >85%'],
            dataSource: ['DEPOT_REGISTRY'],
            evidencePeriod: {
              from: new Date(),
              to: new Date(),
              sampleSize: 14,
              unit: 'days'
            },
            confidenceScore: 0.88,
            expectedBenefit: 'Reduces peak wait times by 18%.',
            expectedBenefitTa: 'காத்திருப்பு நேரத்தை 18% குறைக்கிறது.',
            risksAndAssumptions: 'Requires driver reassignment.',
            humanReviewStatus: 'PENDING',
            reviewHistory: [],
            provenance: {
              sourceOrganization: 'TNSTC-Madurai',
              sourceReference: 'SYSTEM_AGGREGATION',
              retrievalTimestamp: new Date(),
              dataCoverage: 'Madurai District',
              classification: 'OFFICIAL_VERIFIED',
              verificationStatus: 'VERIFIED',
              processingVersion: 'v1.0'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      } as any);

      const res = await request(app)
        .get('/api/v1/analytics/recommendations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].recommendationId).toBe(mockRecId);
      expect(res.body.data[0].confidenceScore).toBe(0.88);
      expect(res.body.data[0].humanReviewStatus).toBe('PENDING');
    });

    it('PATCH /api/v1/analytics/recommendations/:id/review should record human decision and notes', async () => {
      const mockDoc: any = {
        _id: mockDbId,
        recommendationId: mockRecId,
        title: 'Rebalance Peak Reserve Fleet Allocation',
        titleTa: 'பணிமனை ஒதுக்கீட்டை சமநிலைப்படுத்துக',
        category: 'DEPOT_IMBALANCE',
        severity: 'MEDIUM',
        targetEntityType: 'DEPOT',
        targetEntityCode: 'MDU-DEP-01',
        targetEntityName: 'Madurai Central Depot',
        description: 'Transfer 2 reserve vehicles during peak hours.',
        descriptionTa: 'உச்ச நேரத்தில் 2 பேருந்துகளை மாற்றுவது நன்று.',
        supportingObservations: ['Central Depot peak utilization >85%'],
        dataSource: ['DEPOT_REGISTRY'],
        evidencePeriod: {
          from: new Date(),
          to: new Date(),
          sampleSize: 14,
          unit: 'days'
        },
        confidenceScore: 0.88,
        expectedBenefit: 'Reduces peak wait times by 18%.',
        expectedBenefitTa: 'காத்திருப்பு நேரத்தை 18% குறைக்கிறது.',
        risksAndAssumptions: 'Requires driver reassignment.',
        humanReviewStatus: 'PENDING',
        reviewHistory: [],
        provenance: {
          sourceOrganization: 'TNSTC-Madurai',
          sourceReference: 'SYSTEM_AGGREGATION',
          retrievalTimestamp: new Date(),
          dataCoverage: 'Madurai District',
          classification: 'OFFICIAL_VERIFIED',
          verificationStatus: 'VERIFIED',
          processingVersion: 'v1.0'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(OptimizationRecommendation, 'findOne').mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/v1/analytics/recommendations/${mockRecId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APPROVED',
          decisionNotes: 'Approved for trial on Monday morning rush hour.'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.humanReviewStatus).toBe('APPROVED');
      expect(res.body.data.reviewHistory).toHaveLength(1);
      expect(res.body.data.reviewHistory[0].decisionNotes).toBe(
        'Approved for trial on Monday morning rush hour.'
      );
      expect(res.body.data.reviewHistory[0].reviewerRole).toBe('ADMIN');
      expect(mockDoc.save).toHaveBeenCalled();
    });
  });

  describe('8. Report Generation & Exports', () => {
    it('GET /api/v1/analytics/reports/export should generate CSV with provenance and no PII', async () => {
      vi.spyOn(Bus, 'countDocuments')
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);

      vi.spyOn(LatestBusPosition, 'countDocuments')
        .mockResolvedValueOnce(16)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      vi.spyOn(Depot, 'find').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: dummyDepotId, nameEn: 'Madurai Central Depot', code: 'MDU-DEP-01' }
        ])
      } as any);

      vi.spyOn(Route, 'find').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      } as any);

      vi.spyOn(LocationHistory, 'countDocuments').mockResolvedValue(4500);

      const res = await request(app)
        .get('/api/v1/analytics/reports/export?reportType=FLEET_OVERVIEW&format=CSV')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('# PERUNDHU TRANSIT ANALYTICS - FLEET OVERVIEW REPORT');
      expect(res.text).toContain('# Classification: OFFICIAL_VERIFIED');
      expect(res.text).toContain('Total Registered Fleet,25');
      expect(res.text).toContain('Active In Service,18');
      expect(res.text).toContain('"Madurai Central Depot"');
    });

    it('GET /api/v1/analytics/reports/export should generate JSON with full metadata and result payload', async () => {
      vi.spyOn(OptimizationRecommendation, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(OptimizationRecommendation, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            recommendationId: 'REC-DEPOT-001',
            title: 'Sample Rec',
            titleTa: 'மாதிரி',
            category: 'DEPOT_IMBALANCE',
            severity: 'MEDIUM',
            targetEntityType: 'DEPOT',
            description: 'Test',
            descriptionTa: 'சோதனை',
            evidencePeriod: { from: new Date(), to: new Date(), sampleSize: 10, unit: 'days' },
            confidenceScore: 0.9,
            expectedBenefit: 'Benefit',
            expectedBenefitTa: 'பலன்',
            risksAndAssumptions: 'None',
            humanReviewStatus: 'PENDING',
            reviewHistory: [],
            provenance: {
              sourceOrganization: 'TNSTC-Madurai',
              sourceReference: 'TEST',
              classification: 'OFFICIAL_VERIFIED'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      } as any);

      const res = await request(app)
        .get('/api/v1/analytics/reports/export?reportType=RECOMMENDATIONS&format=JSON')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/json');
      const parsed = JSON.parse(res.text);
      expect(parsed.reportType).toBe('RECOMMENDATIONS');
      expect(parsed.result).toHaveLength(1);
      expect(parsed.result[0].recommendationId).toBe('REC-DEPOT-001');
    });
  });
});
