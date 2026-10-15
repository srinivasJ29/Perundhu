import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError
} from '../../src/common/errors';

describe('Domain Errors (AppError Hierarchy)', () => {
  it('should initialize AppError with standard defaults', () => {
    const error = new AppError('General server failure');
    expect(error.message).toBe('General server failure');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('AppError');
  });

  it('should initialize NotFoundError with 404 status and NOT_FOUND code', () => {
    const error = new NotFoundError('Bus stand not found');
    expect(error.message).toBe('Bus stand not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.isOperational).toBe(true);
  });

  it('should initialize ValidationError with 400 status and details', () => {
    const details = [{ path: 'routeId', message: 'Required' }];
    const error = new ValidationError('Invalid query parameters', details);
    expect(error.message).toBe('Invalid query parameters');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(details);
  });

  it('should initialize UnauthorizedError with 401 status', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('should initialize ForbiddenError with 403 status', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('should initialize ConflictError with 409 status', () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });

  it('should initialize ServiceUnavailableError with 503 status', () => {
    const error = new ServiceUnavailableError();
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
  });
});
