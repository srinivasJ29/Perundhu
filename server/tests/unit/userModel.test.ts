import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { User, RefreshTokenSession } from '../../src/models';

describe('User and RefreshTokenSession Schema Unit Tests', () => {
  describe('User Model Schema', () => {
    it('should validate a correct user document structure', () => {
      const user = new User({
        email: 'passenger@tnstc.in',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
        fullName: 'Karthik Raja',
        role: 'PASSENGER',
        status: 'ACTIVE'
      });

      const err = user.validateSync();
      expect(err).toBeUndefined();
      expect(user.role).toBe('PASSENGER');
      expect(user.status).toBe('ACTIVE');
    });

    it('should normalize email to lowercase and trim whitespace', () => {
      const user = new User({
        email: '   PASSENGER@TNSTC.IN   ',
        passwordHash: '$argon2id$dummy',
        fullName: 'Karthik Raja'
      });

      expect(user.email).toBe('passenger@tnstc.in');
    });

    it('should reject invalid email format', () => {
      const user = new User({
        email: 'invalid-email-string',
        passwordHash: '$argon2id$dummy',
        fullName: 'Karthik Raja'
      });

      const err = user.validateSync();
      expect(err?.errors['email']).toBeDefined();
    });

    it('should reject invalid role', () => {
      const user = new User({
        email: 'user@tnstc.in',
        passwordHash: '$argon2id$dummy',
        fullName: 'Karthik Raja',
        role: 'SUPER_USER' as any
      });

      const err = user.validateSync();
      expect(err?.errors['role']).toBeDefined();
    });

    it('should omit passwordHash and __v when converting to JSON', () => {
      const user = new User({
        _id: new Types.ObjectId('650000000000000000000001'),
        email: 'user@tnstc.in',
        passwordHash: 'secret-argon2-hash',
        fullName: 'Karthik Raja',
        role: 'PASSENGER',
        status: 'ACTIVE'
      });

      const json = user.toJSON();
      expect(json).toHaveProperty('id', '650000000000000000000001');
      expect(json).toHaveProperty('email', 'user@tnstc.in');
      expect(json).toHaveProperty('fullName', 'Karthik Raja');
      expect(json).toHaveProperty('role', 'PASSENGER');
      expect(json).not.toHaveProperty('passwordHash');
      expect(json).not.toHaveProperty('__v');
      expect(json).not.toHaveProperty('_id');
    });

    it('toSafeUser() should output public fields only', () => {
      const user = new User({
        _id: new Types.ObjectId('650000000000000000000001'),
        email: 'user@tnstc.in',
        passwordHash: 'secret-argon2-hash',
        fullName: 'Karthik Raja',
        role: 'PASSENGER',
        status: 'ACTIVE'
      });

      const safe = user.toSafeUser();
      expect(safe.id).toBe('650000000000000000000001');
      expect(safe.email).toBe('user@tnstc.in');
      expect(safe.role).toBe('PASSENGER');
      expect((safe as any).passwordHash).toBeUndefined();
    });
  });

  describe('RefreshTokenSession Model Schema', () => {
    it('should validate a valid refresh token session document', () => {
      const session = new RefreshTokenSession({
        userId: new Types.ObjectId(),
        sessionId: 'session-uuid-1',
        familyId: 'family-uuid-1',
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 7 * 86400 * 1000)
      });

      const err = session.validateSync();
      expect(err).toBeUndefined();
      expect(session.isRevoked).toBe(false);
    });

    it('should require userId, sessionId, familyId, tokenHash, and expiresAt', () => {
      const session = new RefreshTokenSession({});
      const err = session.validateSync();

      expect(err?.errors['userId']).toBeDefined();
      expect(err?.errors['sessionId']).toBeDefined();
      expect(err?.errors['familyId']).toBeDefined();
      expect(err?.errors['tokenHash']).toBeDefined();
      expect(err?.errors['expiresAt']).toBeDefined();
    });
  });
});
