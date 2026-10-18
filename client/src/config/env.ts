import { z } from 'zod';

/**
 * Public Client Environment Schema
 * Note: ONLY public variables prefixed with VITE_ can be accessed in browser code.
 */
const clientEnvSchema = z.object({
  /**
   * Public REST API base URL.
   * In local development, defaults to '/api/v1' (or http://localhost:5000/api/v1)
   */
  VITE_API_BASE_URL: z
    .string()
    .default('http://localhost:5000/api/v1'),

  /**
   * Real-time WebSocket / Socket.IO host URL.
   * Defaults to http://localhost:5000 in development.
   */
  VITE_SOCKET_URL: z
    .string()
    .default('http://localhost:5000'),

  /**
   * Client environment mode.
   */
  VITE_APP_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  /**
   * Optional map tile provider URL template (Provisional for Step 7).
   */
  VITE_MAP_TILE_URL: z
    .string()
    .optional(),

  /**
   * Optional map attribution (Provisional for Step 7).
   */
  VITE_MAP_ATTRIBUTION: z
    .string()
    .optional()
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validates and extracts public browser environment configuration.
 */
function loadClientConfig(): ClientEnv {
  // Access import.meta.env safely
  const rawEnv = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV || (import.meta.env.DEV ? 'development' : 'production'),
    VITE_MAP_TILE_URL: import.meta.env.VITE_MAP_TILE_URL,
    VITE_MAP_ATTRIBUTION: import.meta.env.VITE_MAP_ATTRIBUTION
  };

  const parsed = clientEnvSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.warn(
      `[PERUNDHU Config] Environment configuration warning, falling back to safe defaults:\n${errorMessages}`
    );
    // Return safe fallback
    return {
      VITE_API_BASE_URL: 'http://localhost:5000/api/v1',
      VITE_SOCKET_URL: 'http://localhost:5000',
      VITE_APP_ENV: 'development'
    };
  }

  return parsed.data;
}

export const env = loadClientConfig();

/**
 * Validates whether the API Base URL is configured.
 */
export function assertApiConfigured(): void {
  if (!env.VITE_API_BASE_URL) {
    throw new Error(
      'PERUNDHU API configuration error: VITE_API_BASE_URL is not set. Please configure client/.env file.'
    );
  }
}
