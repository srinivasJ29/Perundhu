import { z } from 'zod';
import { objectIdSchema } from '../../common/validation';

export const routePerformanceQuerySchema = z.object({
  routeId: objectIdSchema.optional(),
  directionId: objectIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const scheduleAdherenceQuerySchema = z.object({
  routeId: objectIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const demandQuerySchema = z.object({
  routeId: objectIdSchema.optional(),
  stopId: objectIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const fleetUtilizationQuerySchema = z.object({
  depotId: objectIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const recommendationsQuerySchema = z.object({
  category: z
    .enum([
      'DEPOT_IMBALANCE',
      'ROUTE_DELAY',
      'INSUFFICIENT_COVERAGE',
      'ALLOCATION_IMPROVEMENT',
      'GPS_COVERAGE_GAP',
      'DATA_COLLECTION_GAP'
    ])
    .optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});

export const reviewRecommendationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED'], {
    required_error: 'Status is required'
  }),
  decisionNotes: z.string().max(1000).optional()
});

export const reportExportQuerySchema = z.object({
  reportType: z.enum(
    [
      'FLEET_OVERVIEW',
      'ROUTE_PERFORMANCE',
      'SCHEDULE_ADHERENCE',
      'FLEET_UTILIZATION',
      'RECOMMENDATIONS'
    ],
    {
      required_error: 'reportType is required'
    }
  ),
  format: z.enum(['JSON', 'CSV']).default('JSON'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  routeId: objectIdSchema.optional(),
  depotId: objectIdSchema.optional()
});

export type RoutePerformanceQuery = z.infer<typeof routePerformanceQuerySchema>;
export type ScheduleAdherenceQuery = z.infer<typeof scheduleAdherenceQuerySchema>;
export type DemandQuery = z.infer<typeof demandQuerySchema>;
export type FleetUtilizationQuery = z.infer<typeof fleetUtilizationQuerySchema>;
export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
export type ReviewRecommendationBody = z.infer<typeof reviewRecommendationSchema>;
export type ReportExportQuery = z.infer<typeof reportExportQuerySchema>;

