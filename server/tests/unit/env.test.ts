import { describe, it, expect } from 'vitest';
import { loadEnv } from '../../src/config/env';

describe('Environment Configuration Validation (loadEnv)', () => {
  it('should parse valid environment variables with sensible defaults', () => {
    const config = loadEnv({
      NODE_ENV: 'test',
      PORT: '8080',
      MONGODB_URI: ''
    });

    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBe(8080);
    expect(config.API_PREFIX).toBe('/api/v1');
    expect(config.CLIENT_ORIGIN).toBe('http://localhost:5173');
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.MONGODB_URI).toBeUndefined();
  });

  it('should treat empty or whitespace-only MONGODB_URI as undefined', () => {
    const config = loadEnv({
      MONGODB_URI: '   '
    });

    expect(config.MONGODB_URI).toBeUndefined();
  });

  it('should reject invalid NODE_ENV values', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'invalid_env' as any
      })
    ).toThrowError(/Invalid environment configuration/);
  });

  it('should reject non-numeric or out-of-range PORT values', () => {
    expect(() =>
      loadEnv({
        PORT: 'abc' as any
      })
    ).toThrowError(/Invalid environment configuration/);

    expect(() =>
      loadEnv({
        PORT: '999999' as any
      })
    ).toThrowError(/Invalid environment configuration/);

    expect(() =>
      loadEnv({
        PORT: '-1' as any
      })
    ).toThrowError(/Invalid environment configuration/);
  });

  it('should reject invalid API_PREFIX values that lack leading slash', () => {
    expect(() =>
      loadEnv({
        API_PREFIX: 'api/v1'
      })
    ).toThrowError(/Invalid environment configuration/);
  });
});
