import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../src/common/middleware';
import { AppError, ValidationError } from '../../src/common/errors';

describe('Centralized Error Handling Middleware', () => {
  it('should capture operational AppError and return corresponding status and error payload', async () => {
    const testApp = express();
    testApp.get('/test-operational-error', () => {
      throw new ValidationError('Sample validation failure', [
        { field: 'email', issue: 'Invalid format' }
      ]);
    });
    testApp.use(errorHandler);

    const response = await request(testApp)
      .get('/test-operational-error')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('Sample validation failure');
    expect(response.body.error.details).toEqual([
      { field: 'email', issue: 'Invalid format' }
    ]);
    expect(response.body.error).toHaveProperty('timestamp');
  });

  it('should capture generic unhandled exceptions and return 500 INTERNAL_SERVER_ERROR', async () => {
    const testApp = express();
    testApp.get('/test-unhandled-exception', () => {
      throw new Error('Unexpected catastrophic crash');
    });
    testApp.use(errorHandler);

    const response = await request(testApp)
      .get('/test-unhandled-exception')
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(response.body.error).toHaveProperty('timestamp');
  });

  it('should handle custom AppError with specified status code and non-operational flag', async () => {
    const testApp = express();
    testApp.get('/test-custom-app-error', () => {
      throw new AppError('Custom database lock failure', 503, 'LOCK_TIMEOUT', false);
    });
    testApp.use(errorHandler);

    const response = await request(testApp)
      .get('/test-custom-app-error')
      .expect(503);

    expect(response.body.error.code).toBe('LOCK_TIMEOUT');
    expect(response.body.error.message).toBe('Custom database lock failure');
  });
});
