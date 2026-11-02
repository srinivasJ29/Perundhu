import { z } from 'zod';
import { objectIdSchema } from '../../common/validation';

export const listFleetPositionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  status: z
    .enum(['LIVE', 'SIMULATED', 'DELAYED', 'STALE', 'DEVIATED', 'OFFLINE', 'UNAVAILABLE'])
    .optional(),
  source: z
    .enum([
      'VEHICLE_HARDWARE_GPS',
      'OFFICIAL_FLEET_FEED',
      'AUTHORIZED_MOBILE_GPS',
      'ETM_GPS',
      'MANUAL_DISPATCH',
      'SIMULATOR'
    ])
    .optional(),
  routeId: objectIdSchema.optional(),
  depotId: objectIdSchema.optional(),
  isSimulated: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true' || val === '1';
    }),
  bbox: z
    .string()
    .regex(
      /^[-+]?\d*\.?\d+,[-+]?\d*\.?\d+,[-+]?\d*\.?\d+,[-+]?\d*\.?\d+$/,
      'Bounding box must be minLng,minLat,maxLng,maxLat'
    )
    .optional(),
  search: z.string().trim().max(50).optional()
});

export type ListFleetPositionsQuery = z.infer<typeof listFleetPositionsQuerySchema>;

export const fleetBusParamSchema = z.object({
  busId: objectIdSchema
});

export type FleetBusParam = z.infer<typeof fleetBusParamSchema>;

