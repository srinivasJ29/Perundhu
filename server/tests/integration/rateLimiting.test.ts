import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import express from 'express';

describe('Phase 10 — Route-Specific Rate Limiting (Integration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 429 TOO_MANY_REQUESTS when limit is exceeded', async () => {
    const testApp = express();

    const strictLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      statusCode: 429,
      handler: (req, res, _next, options) => {
        res.status(options.statusCode).json({
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded. Please retry later.',
            timestamp: new Date().toISOString()
          }
        });
      }
    });

    testApp.use('/api/v1/limited', strictLimiter, (_req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // Request 1: OK
    const res1 = await request(testApp).get('/api/v1/limited');
    expect(res1.status).toBe(200);

    // Request 2: OK
    const res2 = await request(testApp).get('/api/v1/limited');
    expect(res2.status).toBe(200);

    // Request 3: Exceeded -> 429
    const res3 = await request(testApp).get('/api/v1/limited');
    expect(res3.status).toBe(429);
    expect(res3.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(res3.body.error.message).toContain('Rate limit exceeded');
    expect(res3.headers['retry-after']).toBeDefined();
  });
});
