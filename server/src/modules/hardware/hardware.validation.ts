import { z } from 'zod';

export const hardwareAdapterParamsSchema = z.object({
  adapterId: z.enum(['ais140', 'teltonika', 'generic', 'driver-app', 'etm'], {
    message: 'Invalid adapterId. Must be one of: ais140, teltonika, generic, driver-app, etm'
  })
});

export const validatePayloadBodySchema = z.object({
  adapterId: z.enum(['ais140', 'teltonika', 'generic', 'driver-app', 'etm']).optional(),
  payload: z.union([z.string(), z.record(z.any())], {
    message: 'payload must be a string (e.g. AIS-140 CSV) or JSON object'
  }),
  headers: z.record(z.any()).optional()
});

export type HardwareAdapterParams = z.infer<typeof hardwareAdapterParamsSchema>;
export type ValidatePayloadBody = z.infer<typeof validatePayloadBodySchema>;

