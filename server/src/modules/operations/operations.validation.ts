/**
 * PERUNDHU (பேருந்து) — Phase 12 Operations Validation Schemas
 */

import { z } from 'zod';

export const tripIdParamSchema = z.object({
  tripId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Trip ID format')
});

export const depotManagerQuerySchema = z.object({
  depotId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Depot ID format').optional()
});

export const dispatcherQuerySchema = z.object({
  depotId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Depot ID format').optional(),
  includeSimulated: z.string().optional().transform((val) => val === 'true')
});

export const assignTripBusBodySchema = z.object({
  tripId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Trip ID format'),
  busId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Bus ID format')
});

export const assignTripDriverBodySchema = z.object({
  tripId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Trip ID format'),
  driverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Driver ID format')
});

export const assignTripConductorBodySchema = z.object({
  tripId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Trip ID format'),
  conductorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Conductor ID format')
});

export const addTripRemarkBodySchema = z.object({
  remark: z.string().min(2, 'Remark must be at least 2 characters').max(500, 'Remark cannot exceed 500 characters')
});

export const exportReportQuerySchema = z.object({
  reportType: z.enum([
    'FLEET_STATUS',
    'TRIP_COMPLETION',
    'ROUTE_PERFORMANCE',
    'GPS_DEVICE_HEALTH',
    'STAFF_ASSIGNMENTS'
  ]),
  depotId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Depot ID format').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional()
});

export type AssignTripBusBody = z.infer<typeof assignTripBusBodySchema>;
export type AssignTripDriverBody = z.infer<typeof assignTripDriverBodySchema>;
export type AssignTripConductorBody = z.infer<typeof assignTripConductorBodySchema>;
export type AddTripRemarkBody = z.infer<typeof addTripRemarkBodySchema>;
export type ExportReportQuery = z.infer<typeof exportReportQuerySchema>;

