import { describe, it, expect } from 'vitest';
import { loadEnv, getAllowedOrigins } from '../../src/config/env';

describe('Phase 10 — Production Configuration & Secrets Validation (Unit)', () => {
  it('should reject production startup if MONGODB_URI is missing or empty', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        MONGODB_URI: '',
        JWT_ACCESS_SECRET: 'secure-production-random-jwt-access-secret-32-chars'
      })
    ).toThrowError(/MONGODB_URI is required in production environment/);
  });

  it('should reject production startup if JWT_ACCESS_SECRET uses the default dev secret', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/perundhu_prod',
        JWT_ACCESS_SECRET: 'dev-jwt-access-secret-minimum-32-chars-long-key'
      })
    ).toThrowError(/JWT_ACCESS_SECRET must not use the default insecure key in production/);
  });

  it('should default SIMULATOR_ENABLED to false in production if not explicitly set', () => {
    const config = loadEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/perundhu_prod',
      JWT_ACCESS_SECRET: 'secure-production-random-jwt-access-secret-32-chars',
      SIMULATOR_ENABLED: undefined
    });

    expect(config.SIMULATOR_ENABLED).toBe(false);
  });

  it('should allow SIMULATOR_ENABLED to be explicitly enabled in production if configured', () => {
    const config = loadEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/perundhu_prod',
      JWT_ACCESS_SECRET: 'secure-production-random-jwt-access-secret-32-chars',
      SIMULATOR_ENABLED: 'true'
    });

    expect(config.SIMULATOR_ENABLED).toBe(true);
  });

  it('should allow default dev secret in development or test environments', () => {
    const config = loadEnv({
      NODE_ENV: 'development',
      JWT_ACCESS_SECRET: 'dev-jwt-access-secret-minimum-32-chars-long-key'
    });

    expect(config.JWT_ACCESS_SECRET).toBe('dev-jwt-access-secret-minimum-32-chars-long-key');
    expect(config.SIMULATOR_ENABLED).toBe(true);
  });

  it('should parse single or comma-separated origins with getAllowedOrigins', () => {
    expect(getAllowedOrigins('http://localhost:5173')).toEqual(['http://localhost:5173']);

    expect(
      getAllowedOrigins(
        'https://perundhu.tnstc.gov.in, https://admin.perundhu.tnstc.gov.in, https://tracker.perundhu.tnstc.gov.in'
      )
    ).toEqual([
      'https://perundhu.tnstc.gov.in',
      'https://admin.perundhu.tnstc.gov.in',
      'https://tracker.perundhu.tnstc.gov.in'
    ]);
  });
});
