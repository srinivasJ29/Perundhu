import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('404 Not Found Middleware', () => {
  it('should return 404 with standardized error JSON on non-existent endpoints', async () => {
    const response = await request(app)
      .get('/api/v1/non-existent-route')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error.message).toContain('Resource not found: GET /api/v1/non-existent-route');
    expect(response.body.error).toHaveProperty('timestamp');
  });

  it('should return 404 on undefined root path', async () => {
    const response = await request(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
