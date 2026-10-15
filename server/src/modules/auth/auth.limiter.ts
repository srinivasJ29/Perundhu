import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';

/**
 * Rate limiter for sensitive authentication endpoints (register, login, refresh).
 * Throttles repeated brute force attempts. Skipped in automated test environments.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: env.NODE_ENV === 'test' ? 10000 : 25, // 25 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts. Please try again later.',
        timestamp: new Date().toISOString()
      }
    });
  },
  skip: () => env.NODE_ENV === 'test'
});
