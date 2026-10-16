import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from '../../common/validation';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const routeTimetableParamsSchema = z.object({
  routeId: objectIdSchema
});

export const routeTimetableQuerySchema = z.object({
  directionCode: z.enum(['OUTBOUND', 'INBOUND']).optional(),
  dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional()
});

export type RouteTimetableQuery = z.infer<typeof routeTimetableQuerySchema>;

export const stopDeparturesParamsSchema = z.object({
  stopId: objectIdSchema
});

export const stopDeparturesQuerySchema = paginationQuerySchema.extend({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
  dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
  fromTime: z
    .string()
    .regex(TIME_REGEX, 'fromTime must be in HH:mm 24-hour format')
    .optional(),
  toTime: z
    .string()
    .regex(TIME_REGEX, 'toTime must be in HH:mm 24-hour format')
    .optional()
});

export type StopDeparturesQuery = z.infer<typeof stopDeparturesQuerySchema>;
