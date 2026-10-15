import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from '../../common/validation';

export const nearbyBusStandsQuerySchema = paginationQuerySchema.extend({
  lat: z.coerce
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, { message: 'Latitude must be >= -90' })
    .max(90, { message: 'Latitude must be <= 90' }),
  lng: z.coerce
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, { message: 'Longitude must be >= -180' })
    .max(180, { message: 'Longitude must be <= 180' }),
  radiusMeters: z.coerce
    .number({ invalid_type_error: 'Radius must be a number' })
    .min(100, { message: 'Radius must be at least 100 meters' })
    .max(50000, { message: 'Radius cannot exceed 50,000 meters (50km)' })
    .default(5000)
});

export const standIdParamSchema = z.object({
  standId: objectIdSchema
});

export const standRoutesQuerySchema = paginationQuerySchema;

export type NearbyBusStandsQuery = z.infer<typeof nearbyBusStandsQuerySchema>;
export type StandIdParam = z.infer<typeof standIdParamSchema>;
