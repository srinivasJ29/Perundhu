import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(1).max(65535).default(5000)),
  API_PREFIX: z
    .string()
    .regex(/^\/[a-zA-Z0-9_\-/]*$/, {
      message: 'API_PREFIX must start with / and be a valid URL path'
    })
    .default('/api/v1'),
  CLIENT_ORIGIN: z
    .string()
    .default('http://localhost:5173'),
  TRUST_PROXY: z
    .string()
    .optional(),
  GPS_INGESTION_HMAC_SECRET: z
    .string()
    .min(32, { message: 'GPS_INGESTION_HMAC_SECRET must be at least 32 characters long' })
    .optional(),
  MONGODB_URI: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters long' })
    .default('dev-jwt-access-secret-minimum-32-chars-long-key'),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(1).max(365).default(7)),
  JWT_ISSUER: z
    .string()
    .default('perundhu-auth'),
  JWT_AUDIENCE: z
    .string()
    .default('perundhu-api'),
  ADMIN_BOOTSTRAP_SECRET: z
    .string()
    .optional(),

  // Deterministic GPS Simulation Configuration
  SIMULATOR_ENABLED: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true' || val === '1';
      }
      return val;
    }, z.boolean().default(true)),
  SIMULATOR_TICK_INTERVAL_MS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(200).max(60000).default(3000)),
  SIMULATOR_DEFAULT_SPEED_KMPH: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(5).max(100).default(30)),
  SIMULATOR_SPEED_MULTIPLIER: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(0.1).max(50).default(1)),
  SIMULATOR_WRITE_HISTORY: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true' || val === '1';
      }
      return val;
    }, z.boolean().default(false)),
  SIMULATOR_HISTORY_INTERVAL_TICKS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(1).max(100).default(5)),
  SIMULATOR_ROUTE_END_POLICY: z
    .enum(['LOOP', 'COMPLETE'])
    .default('LOOP'),
  SIMULATOR_MAX_BUSES: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(1).max(200).default(40)),

  // Phase 7: Position Validation, Freshness & Route Matching Configuration
  LOCATION_MAX_FUTURE_SKEW_MS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(0).max(60000).default(5000)),
  LOCATION_FRESHNESS_THRESHOLD_MS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(1000).max(300000).default(30000)),
  LOCATION_STALE_THRESHOLD_MS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(5000).max(600000).default(120000)),
  LOCATION_MAX_SPEED_KMPH: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(10).max(200).default(120)),
  LOCATION_MAX_CROSS_TRACK_METERS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(10).max(1000).default(100)),
  LOCATION_MAX_PROGRESS_JUMP_METERS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(50).max(5000).default(500)),
  LOCATION_MAX_BACKWARD_METERS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(0).max(500).default(30)),

  // Phase 8: Next-Stop Detection, Stop Events & ETA Configuration
  ETA_MAX_POSITION_AGE_MS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(10000).max(600000).default(120000)),
  ETA_MIN_EFFECTIVE_SPEED_KMPH: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(1).max(40).default(10)),
  ETA_MAX_EFFECTIVE_SPEED_KMPH: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(40).max(140).default(80)),
  ETA_DEFAULT_SPEED_KMPH: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(5).max(80).default(25)),
  ETA_DEFAULT_DWELL_SECONDS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(0).max(300).default(30)),
  STOP_ARRIVAL_RADIUS_METERS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(10).max(300).default(50)),
  STOP_DEPARTURE_RADIUS_METERS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().min(30).max(500).default(100)),
  STOP_ARRIVAL_CONFIRMATION_COUNT: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(1).max(10).default(2)),

  // Phase 9: AI/ML Bus Arrival Time Prediction (ETA) Configuration
  ML_ETA_ENABLED: z
    .preprocess((val) => {
      if (typeof val === 'string') return val === 'true' || val === '1';
      return val;
    }, z.boolean().default(true)),
  ML_ETA_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  ML_ETA_SERVICE_TIMEOUT_MS: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(500).max(10000).default(2500)),
  ML_ETA_API_KEY: z.string().default('perundhu-ml-internal-secret-2026'),
  ML_ETA_FALLBACK_TO_BASELINE: z
    .preprocess((val) => {
      if (typeof val === 'string') return val === 'true' || val === '1';
      return val;
    }, z.boolean().default(true))
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.MONGODB_URI || data.MONGODB_URI.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGODB_URI'],
        message: 'MONGODB_URI is required in production environment'
      });
    }
    if (data.JWT_ACCESS_SECRET === 'dev-jwt-access-secret-minimum-32-chars-long-key') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: 'JWT_ACCESS_SECRET must not use the default insecure key in production'
      });
    }
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Parses and returns an array of allowed client origins.
 */
export function getAllowedOrigins(clientOrigin: string = env?.CLIENT_ORIGIN ?? 'http://localhost:5173'): string[] {
  return clientOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Validates and loads environment configuration.
 * @param overrides Optional environment variables to override process.env (useful for testing)
 */
export function loadEnv(overrides?: Record<string, string | undefined>): EnvConfig {
  const base = overrides ? { ...process.env, ...overrides } : process.env;
  // In production, default SIMULATOR_ENABLED to false unless explicitly overridden
  const defaultSimulator = base.NODE_ENV === 'production' ? 'false' : 'true';
  const source = {
    ...base,
    SIMULATOR_ENABLED: base.SIMULATOR_ENABLED ?? defaultSimulator
  };

  const result = envSchema.safeParse(source);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${errorDetails}`);
  }

  return result.data;
}

// Global parsed and validated configuration instance
export const env = loadEnv();
