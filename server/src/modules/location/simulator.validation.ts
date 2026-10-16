import { z } from 'zod';

export const startSimulatorBodySchema = z.object({
  tickIntervalMs: z
    .number()
    .int()
    .min(200, 'Tick interval must be at least 200ms')
    .max(60000, 'Tick interval cannot exceed 60000ms')
    .optional(),
  speedMultiplier: z
    .number()
    .min(0.1, 'Speed multiplier must be at least 0.1x')
    .max(50, 'Speed multiplier cannot exceed 50x')
    .optional(),
  defaultSpeedKmph: z
    .number()
    .min(5, 'Default speed must be at least 5 km/h')
    .max(100, 'Default speed cannot exceed 100 km/h')
    .optional(),
  writeHistory: z.boolean().optional(),
  historyIntervalTicks: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional(),
  routeEndPolicy: z.enum(['LOOP', 'COMPLETE']).optional()
});

export type StartSimulatorBody = z.infer<typeof startSimulatorBodySchema>;
