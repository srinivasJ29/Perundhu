import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from '../../common/validation';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const listTripsQuerySchema = paginationQuerySchema.extend({
  routeId: objectIdSchema.optional(),
  routeDirectionId: objectIdSchema.optional(),
  busId: objectIdSchema.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional(),
  dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
  status: z.enum(['SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
});

export type ListTripsQuery = z.infer<typeof listTripsQuerySchema>;

export const tripIdParamSchema = z.object({
  tripId: objectIdSchema
});

export const activeTripsQuerySchema = paginationQuerySchema;
export type ActiveTripsQuery = z.infer<typeof activeTripsQuerySchema>;

export const stopTimeItemSchema = z.object({
  stopId: objectIdSchema,
  stopSequence: z.number().int().min(1, 'Stop sequence must be >= 1'),
  scheduledArrivalTime: z
    .string()
    .regex(TIME_REGEX, 'Scheduled arrival time must be in HH:mm 24-hour format'),
  scheduledDepartureTime: z
    .string()
    .regex(TIME_REGEX, 'Scheduled departure time must be in HH:mm 24-hour format')
});

export const createTripBodySchema = z.object({
  tripCode: z
    .string({ required_error: 'Trip code is required' })
    .trim()
    .min(3, 'Trip code must be at least 3 characters')
    .max(40, 'Trip code cannot exceed 40 characters')
    .transform((val) => val.toUpperCase()),
  routeDirectionId: objectIdSchema,
  busId: objectIdSchema.optional(),
  departureTime: z
    .string({ required_error: 'Departure time is required' })
    .regex(TIME_REGEX, 'Departure time must be in HH:mm 24-hour format'),
  arrivalTime: z
    .string({ required_error: 'Arrival time is required' })
    .regex(TIME_REGEX, 'Arrival time must be in HH:mm 24-hour format'),
  operationalDays: z
    .array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']))
    .min(1, 'At least one operational day must be specified')
    .default(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  status: z
    .enum(['SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'])
    .default('SCHEDULED'),
  stopTimes: z.array(stopTimeItemSchema).min(2, 'Trip must have at least 2 stop waypoints').optional()
});

export type CreateTripBody = z.infer<typeof createTripBodySchema>;

export const assignBusBodySchema = z.object({
  busId: z.union([objectIdSchema, z.null()], {
    required_error: 'busId is required (pass a valid ID or null to unassign)'
  })
});

export type AssignBusBody = z.infer<typeof assignBusBodySchema>;

export const updateTripStatusBodySchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'], {
    required_error: 'Status is required'
  })
});

export type UpdateTripStatusBody = z.infer<typeof updateTripStatusBodySchema>;

export const updateTripStopTimesBodySchema = z.object({
  stopTimes: z
    .array(stopTimeItemSchema)
    .min(2, 'At least 2 stop waypoints are required for route itinerary')
});

export type UpdateTripStopTimesBody = z.infer<typeof updateTripStopTimesBodySchema>;
