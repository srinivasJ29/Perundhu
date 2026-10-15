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
    .optional()
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and loads environment configuration.
 * @param overrides Optional environment variables to override process.env (useful for testing)
 */
export function loadEnv(overrides?: Record<string, string | undefined>): EnvConfig {
  const source = overrides ? { ...process.env, ...overrides } : process.env;
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
