import { z } from 'zod';
import { objectIdSchema } from '../../common/validation';

export const routeDirectionParamsSchema = z.object({
  routeId: objectIdSchema,
  directionId: objectIdSchema
});

export type RouteDirectionParams = z.infer<typeof routeDirectionParamsSchema>;
