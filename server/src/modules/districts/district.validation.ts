import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from '../../common/validation';

export const listDistrictsQuerySchema = paginationQuerySchema.extend({
  q: z
    .string()
    .trim()
    .max(100, { message: 'Search query cannot exceed 100 characters' })
    .optional()
});

export const districtIdParamSchema = z.object({
  districtId: objectIdSchema
});

export const districtBusStandsQuerySchema = paginationQuerySchema;

export type ListDistrictsQuery = z.infer<typeof listDistrictsQuerySchema>;
export type DistrictIdParam = z.infer<typeof districtIdParamSchema>;
