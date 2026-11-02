/**
 * PERUNDHU (பேருந்து) — Service Alert Validation Schemas
 */

import { z } from 'zod';

export const listAlertsQuerySchema = z.object({
  districtCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional(),
  routeNumber: z
    .string()
    .trim()
    .optional(),
  severity: z
    .enum(['INFO', 'WARNING', 'CRITICAL'])
    .optional(),
  alertType: z
    .enum([
      'ADVISORY',
      'DISRUPTION',
      'ROUTE_DIVERSION',
      'FESTIVAL_SPECIAL',
      'WEATHER_NOTICE'
    ])
    .optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val !== undefined ? val === 'true' : undefined))
});

export const alertIdParamSchema = z.object({
  alertId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid alert ID format')
});

