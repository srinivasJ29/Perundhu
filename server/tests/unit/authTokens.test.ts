import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateRefreshToken,
  signAccessToken,
  verifyAccessToken,
  getRefreshTokenCookieOptions
} from '../../src/modules/auth/auth.tokens';
import { env } from '../../src/config/env';

describe('Auth Tokens & Cryptographic Functions', () => {
  describe('Argon2id Password Hashing', () => {
    it('should hash a password into a valid Argon2id string', async () => {
      const plaintext = 'SuperSecret123!';
      const hash = await hashPassword(plaintext);

      expect(hash).toMatch(/^\$argon2id\$/);
      expect(hash).not.toBe(plaintext);
    });

    it('should verify correct password against its Argon2id hash', async () => {
      const plaintext = 'CorrectHorseBatteryStaple';
      const hash = await hashPassword(plaintext);

      const isValid = await verifyPassword(hash, plaintext);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const plaintext = 'CorrectPassword';
      const hash = await hashPassword(plaintext);

      const isValid = await verifyPassword(hash, 'WrongPassword');
      expect(isValid).toBe(false);
    });

    it('should safely return false when given an invalid hash format', async () => {
      const isValid = await verifyPassword('not-a-valid-hash', 'password');
      expect(isValid).toBe(false);
    });
  });

  describe('Token Hashing & Generation', () => {
    it('should compute deterministic SHA-256 hash for raw tokens', () => {
      const rawToken = 'my-sample-refresh-token-12345';
      const hash1 = hashToken(rawToken);
      const hash2 = hashToken(rawToken);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate 80-character hex random refresh tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).toHaveLength(80);
      expect(token2).toHaveLength(80);
      expect(token1).not.toBe(token2);
    });
  });

  describe('JWT Access Token Signing & Verification', () => {
    it('should sign and successfully verify access token', () => {
      const payload = {
        sub: '650000000000000000000001',
        email: 'passenger@example.com',
        role: 'PASSENGER' as const,
        sessionId: 'session-uuid-123'
      };

      const token = signAccessToken(payload);
      expect(typeof token).toBe('string');

      const verified = verifyAccessToken(token);
      expect(verified.sub).toBe(payload.sub);
      expect(verified.email).toBe(payload.email);
      expect(verified.role).toBe('PASSENGER');
      expect(verified.sessionId).toBe(payload.sessionId);
      expect(verified.iss).toBe(env.JWT_ISSUER);
      expect(verified.aud).toBe(env.JWT_AUDIENCE);
    });

    it('should reject access token signed with wrong secret', () => {
      const forgedToken = jwt.sign(
        { sub: '123', email: 'test@example.com', role: 'ADMIN' },
        'wrong-secret-key-that-does-not-match-at-all-32chars',
        { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE }
      );

      expect(() => verifyAccessToken(forgedToken)).toThrowError(/Invalid access token/);
    });

    it('should reject expired access token', () => {
      const expiredToken = jwt.sign(
        { sub: '123', email: 'test@example.com', role: 'PASSENGER', sessionId: 'ses-1' },
        env.JWT_ACCESS_SECRET,
        {
          expiresIn: -10, // already expired
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE
        }
      );

      expect(() => verifyAccessToken(expiredToken)).toThrowError(/expired/);
    });

    it('should reject access token with invalid audience or issuer', () => {
      const wrongAudToken = jwt.sign(
        { sub: '123', email: 'test@example.com', role: 'PASSENGER', sessionId: 'ses-1' },
        env.JWT_ACCESS_SECRET,
        {
          issuer: 'wrong-issuer',
          audience: 'wrong-audience'
        }
      );

      expect(() => verifyAccessToken(wrongAudToken)).toThrowError(/Invalid access token/);
    });
  });

  describe('Cookie Configuration Helper', () => {
    it('should return safe HttpOnly cookie options matching environment', () => {
      const options = getRefreshTokenCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe('/api/v1/auth');
      expect(options.maxAge).toBe(env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
    });
  });
});
