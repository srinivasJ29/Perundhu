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

  it('should capture body parser SyntaxError and return 400 MALFORMED_JSON', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.post('/test-json', (_req, res) => res.json({ ok: true }));
    testApp.use(errorHandler);

    const response = await request(testApp)
      .post('/test-json')
      .set('Content-Type', 'application/json')
      .send('{ malformed json }')
      .expect(400);

    expect(response.body.error.code).toBe('MALFORMED_JSON');
    expect(response.body.error.message).toBe('Invalid JSON payload in request body');
  });

  it('should capture payload too large error and return 413 PAYLOAD_TOO_LARGE', async () => {
    const testApp = express();
    testApp.get('/test-too-large', () => {
      const err: any = new Error('Payload too large');
      err.type = 'entity.too.large';
      err.status = 413;
      throw err;
    });
    testApp.use(errorHandler);

    const response = await request(testApp)
      .get('/test-too-large')
      .expect(413);

    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(response.body.error.message).toBe('Request payload exceeds allowable limit');
  });

  it('should capture Mongoose CastError and return 400 INVALID_IDENTIFIER', async () => {
    const testApp = express();
    testApp.get('/test-cast-error', () => {
      const err: any = new Error('Cast to ObjectId failed');
      err.name = 'CastError';
      throw err;
    });
    testApp.use(errorHandler);

    const response = await request(testApp)
      .get('/test-cast-error')
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_IDENTIFIER');
    expect(response.body.error.message).toBe('Invalid resource identifier format');
  });

  it('should capture MongoDB duplicate key E11000 and return 409 CONFLICT', async () => {
    const testApp = express();
    testApp.get('/test-duplicate-key', () => {
      const err: any = new Error('E11000 duplicate key error');
      err.name = 'MongoServerError';
      err.code = 11000;
      throw err;
    });
    testApp.use(errorHandler);

    const response = await request(testApp)
      .get('/test-duplicate-key')
      .expect(409);

    expect(response.body.error.code).toBe('CONFLICT');
    expect(response.body.error.message).toBe('A resource with this key already exists');
  });

  it('should propagate correlation requestId in error response and headers', async () => {
    const testApp = express();
    testApp.use((req, _res, next) => {
      req.id = 'correlation-uuid-test-999';
      next();
    });
    testApp.get('/test-req-id', () => {
      throw new ValidationError('Validation failed with req id');
    });
    testApp.use(errorHandler);

    const response = await request(testApp)
      .get('/test-req-id')
      .expect(400);

    expect(response.headers['x-request-id']).toBe('correlation-uuid-test-999');
    expect(response.body.error.requestId).toBe('correlation-uuid-test-999');
  });
});
