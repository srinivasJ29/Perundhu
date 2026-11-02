import { z } from 'zod';
import { objectIdSchema } from '../../common/validation';

export const tripIdParamSchema = z.object({
  tripId: objectIdSchema
});

export const busIdParamSchema = z.object({
  busId: objectIdSchema
});

export const predictEtaSchema = z.object({
  bus_id: z.string().min(1, 'Bus ID is required'),
  route_id: z.string().optional(),
  route_number: z.string().optional(),
  target_stop_code: z.string().optional(),
  distance_to_stop_meters: z.number().min(0, 'Distance must be non-negative'),
  distance_along_route_meters: z.number().min(0).default(0),
  current_speed_kmph: z.number().min(0).max(100).default(0),
  rolling_speed_kmph: z.number().min(0).max(100).optional(),
  heading: z.number().min(0).max(360).optional(),
  stops_remaining: z.number().min(0).default(1),
  segment_index: z.number().min(0).optional(),
  scheduled_duration_seconds: z.number().min(0).optional(),
  recorded_at: z.string().datetime().optional(),
  is_deviated: z.boolean().optional(),
  tracking_status: z.string().optional()
});
