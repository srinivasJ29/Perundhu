import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';

/**
 * Common handler generator for consistent rate limit JSON responses.
 */
function createRateLimitHandler(message: string, code = 'TOO_MANY_REQUESTS') {
  return (req: any, res: any, _next: any, options: any) => {
    res.status(options.statusCode).json({
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        ...(req.id && { requestId: req.id })
      }
    });
  };
}

/**
 * Rate limiter for sensitive authentication endpoints (register, login, refresh).
 * 25 attempts per 15 minutes per IP. Skipped in automated test environments.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10000 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  handler: createRateLimitHandler('Too many authentication attempts. Please try again later.'),
  skip: () => env.NODE_ENV === 'test'
});

/**
 * Rate limiter for administrative operations (e.g. simulator start/stop/reset).
 * 60 requests per 15 minutes per IP.
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  handler: createRateLimitHandler('Too many administrative requests. Please throttle your commands.'),
  skip: () => env.NODE_ENV === 'test'
});

/**
 * Rate limiter for heavy geospatial and search queries (e.g. nearby bus stands).
 * 60 requests per minute per IP.
 */
export const heavyApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  handler: createRateLimitHandler('Rate limit exceeded for geospatial search. Please throttle requests.'),
  skip: () => env.NODE_ENV === 'test'
});

/**
 * High-capacity rate limiter for public live tracking APIs (buses, routes, trips, ETA).
 * 300 requests per minute per IP to keep public tracking smooth while guarding against abusive DoS.
 */
export const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  handler: createRateLimitHandler('Rate limit exceeded for tracking API. Please slow down requests.'),
  skip: () => env.NODE_ENV === 'test'
});

/**
 * Rate limiter for external GPS hardware/device ingestion.
 * 120 requests per minute per device / IP.
 */
export const ingestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  handler: createRateLimitHandler('GPS ingestion rate limit exceeded. Please check device transmission interval.'),
  skip: () => env.NODE_ENV === 'test'
});
