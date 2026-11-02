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

export const listBusStandsQuerySchema = paginationQuerySchema.extend({
  districtId: objectIdSchema.optional(),
  standType: z.enum(['INTERCITY_TERMINAL', 'MOFUSSIL', 'TOWN_STAND']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  q: z.string().trim().min(1).optional()
});

export const createBusStandBodySchema = z.object({
  districtId: objectIdSchema,
  divisionId: objectIdSchema.optional(),
  depotIds: z.array(objectIdSchema).optional(),
  code: z
    .string({ required_error: 'Bus stand code is required' })
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code cannot exceed 20 characters')
    .transform((val) => val.toUpperCase()),
  nameEn: z
    .string({ required_error: 'English bus stand name is required' })
    .trim()
    .min(2, 'English name must be at least 2 characters')
    .max(100),
  nameTa: z
    .string({ required_error: 'Tamil bus stand name is required' })
    .trim()
    .min(2, 'Tamil name must be at least 2 characters')
    .max(100),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90)
    ])
  }),
  standType: z
    .enum(['INTERCITY_TERMINAL', 'MOFUSSIL', 'TOWN_STAND'])
    .default('TOWN_STAND'),
  totalPlatforms: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true).optional()
});

export const updateBusStandBodySchema = createBusStandBodySchema.partial();

export type NearbyBusStandsQuery = z.infer<typeof nearbyBusStandsQuerySchema>;
export type StandIdParam = z.infer<typeof standIdParamSchema>;
export type ListBusStandsQuery = z.infer<typeof listBusStandsQuerySchema>;
export type CreateBusStandBody = z.infer<typeof createBusStandBodySchema>;
export type UpdateBusStandBody = z.infer<typeof updateBusStandBodySchema>;
