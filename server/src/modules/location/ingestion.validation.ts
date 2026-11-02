import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const ingestLocationBodySchema = z.object({
  busId: z
    .string()
    .regex(objectIdRegex, { message: 'busId must be a valid 24-character hexadecimal ObjectId' }),
  latitude: z
    .number()
    .min(-90, { message: 'Latitude must be between -90 and 90' })
    .max(90, { message: 'Latitude must be between -90 and 90' }),
  longitude: z
    .number()
    .min(-180, { message: 'Longitude must be between -180 and 180' })
    .max(180, { message: 'Longitude must be between -180 and 180' }),
  speedKmph: z
    .number()
    .min(0, { message: 'speedKmph must be non-negative' })
    .max(200, { message: 'speedKmph cannot exceed 200 km/h' })
    .default(0),
  heading: z
    .number()
    .min(0, { message: 'heading must be between 0 and 360' })
    .max(360, { message: 'heading must be between 0 and 360' })
    .default(0),
  accuracyMeters: z
    .number()
    .min(0, { message: 'accuracyMeters must be non-negative' })
    .max(500, { message: 'accuracyMeters cannot exceed 500 meters' })
    .default(5),
  recordedAt: z
    .string()
    .datetime({ message: 'recordedAt must be a valid ISO 8601 UTC timestamp' }),
  source: z
    .enum([
      'VEHICLE_HARDWARE_GPS',
      'AUTHORIZED_MOBILE_GPS',
      'OFFICIAL_FLEET_FEED',
      'ETM_GPS',
      'MANUAL_DISPATCH',
      'SIMULATOR'
    ])
    .default('VEHICLE_HARDWARE_GPS'),
  tripId: z
    .string()
    .regex(objectIdRegex, { message: 'tripId must be a valid 24-character hexadecimal ObjectId' })
    .optional(),
  routeId: z
    .string()
    .regex(objectIdRegex, { message: 'routeId must be a valid 24-character hexadecimal ObjectId' })
    .optional(),
  directionId: z
    .string()
    .regex(objectIdRegex, { message: 'directionId must be a valid 24-character hexadecimal ObjectId' })
    .optional(),
  satellitesCount: z
    .number()
    .int()
    .min(0, { message: 'satellitesCount must be non-negative' })
    .max(50, { message: 'satellitesCount cannot exceed 50' })
    .optional(),
  altitudeMeters: z
    .number()
    .optional(),
  gpsFixStatus: z
    .enum(['NO_FIX', '2D', '3D', 'DGPS', 'UNKNOWN'])
    .optional(),
  batteryPercent: z
    .number()
    .min(0, { message: 'batteryPercent cannot be below 0' })
    .max(100, { message: 'batteryPercent cannot exceed 100' })
    .optional(),
  networkSignalDbm: z
    .number()
    .optional()
});

export const ingestBatchLocationBodySchema = z.object({
  batchId: z
    .string()
    .trim()
    .min(1, { message: 'batchId must not be empty' })
    .max(100, { message: 'batchId cannot exceed 100 characters' })
    .optional(),
  records: z
    .array(ingestLocationBodySchema)
    .min(1, { message: 'Batch must contain at least 1 record' })
    .max(100, { message: 'Batch size exceeds maximum limit of 100 records' })
});

export type IngestLocationBody = z.infer<typeof ingestLocationBodySchema>;
export type IngestBatchLocationBody = z.infer<typeof ingestBatchLocationBodySchema>;
