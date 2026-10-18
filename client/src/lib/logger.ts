import { env } from '../config/env';

/**
 * PERUNDHU (பேருந்து) — Safe Diagnostic Logger
 * Redacts tokens, passwords, and sensitive information from console logs
 */

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'cookie'
]);

function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      sanitized[key] = sanitizeData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const logger = {
  debug(...args: unknown[]): void {
    if (env.VITE_APP_ENV === 'development') {
      console.debug('[PERUNDHU:DEBUG]', ...args.map(sanitizeData));
    }
  },

  info(...args: unknown[]): void {
    console.info('[PERUNDHU:INFO]', ...args.map(sanitizeData));
  },

  warn(...args: unknown[]): void {
    console.warn('[PERUNDHU:WARN]', ...args.map(sanitizeData));
  },

  error(...args: unknown[]): void {
    console.error('[PERUNDHU:ERROR]', ...args.map(sanitizeData));
  }
};
