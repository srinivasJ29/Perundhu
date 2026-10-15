import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/v1/health', () => {
  it('should return 200 OK and health status without requiring MongoDB', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptimeSeconds');
    expect(typeof response.body.uptimeSeconds).toBe('number');
    expect(response.body).toHaveProperty('environment');
  });
});
