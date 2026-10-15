import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setConfiguredStatus, setMockReadyState } from '../../src/infrastructure/database';

describe('GET /api/v1/ready', () => {
  beforeEach(() => {
    setMockReadyState(null);
  });

  it('should return 200 OK when database is intentionally unconfigured', async () => {
    setConfiguredStatus(false);

    const response = await request(app)
      .get('/api/v1/ready')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ready');
    expect(response.body.dependencies).toEqual({ database: 'unconfigured' });
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 503 Service Unavailable when database is configured but disconnected', async () => {
    setConfiguredStatus(true);
    setMockReadyState(0); // 0 = disconnected

    const response = await request(app)
      .get('/api/v1/ready')
      .expect('Content-Type', /json/)
      .expect(503);

    expect(response.body).toHaveProperty('status', 'not_ready');
    expect(response.body.dependencies).toEqual({ database: 'disconnected' });
  });

  it('should return 200 OK when database is configured and connected', async () => {
    setConfiguredStatus(true);
    setMockReadyState(1); // 1 = connected

    const response = await request(app)
      .get('/api/v1/ready')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ready');
    expect(response.body.dependencies).toEqual({ database: 'connected' });
  });
});
