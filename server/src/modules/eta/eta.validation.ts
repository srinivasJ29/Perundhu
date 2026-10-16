import { z } from 'zod';
import { objectIdSchema } from '../../common/validation';

export const tripIdParamSchema = z.object({
  tripId: objectIdSchema
});

export const busIdParamSchema = z.object({
  busId: objectIdSchema
});
