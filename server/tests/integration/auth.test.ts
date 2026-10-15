import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { User, RefreshTokenSession, District } from '../../src/models';
import { hashPassword, hashToken, signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Authentication & Authorization REST Endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new passenger account with 201 Created', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      const fakeUser = new User({
        _id: new Types.ObjectId('650000000000000000000001'),
        email: 'passenger@example.com',
        passwordHash: '$argon2id$mockhash',
        fullName: 'Karthik Raja',
        role: 'PASSENGER',
        status: 'ACTIVE'
      });

      vi.spyOn(User, 'create').mockResolvedValue(fakeUser as any);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'passenger@example.com',
          password: 'Password123!',
          fullName: 'Karthik Raja'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        id: '650000000000000000000001',
        email: 'passenger@example.com',
        fullName: 'Karthik Raja',
        role: 'PASSENGER',
        status: 'ACTIVE'
      });
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should prevent client-supplied ADMIN role and enforce PASSENGER server-side', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue(null);

      let createdWithRole: string | undefined;
      vi.spyOn(User, 'create').mockImplementation(async (doc: any) => {
        createdWithRole = doc.role;
        return new User({
          ...doc,
          _id: new Types.ObjectId('650000000000000000000002')
        }) as any;
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'sneaky@example.com',
          password: 'Password123!',
          fullName: 'Sneaky User',
          role: 'ADMIN' // Client trying to elevate privileges
        })
        .expect(201);

      expect(createdWithRole).toBe('PASSENGER');
      expect(response.body.data.role).toBe('PASSENGER');
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      vi.spyOn(User, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId()
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          fullName: 'Existing User'
        })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toMatch(/already exists/i);
    });

    it('should reject invalid registration inputs with 400 Validation Error', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short', // under 8 chars
          fullName: 'A'       // under 2 chars
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(3);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in successfully with valid credentials and set HttpOnly refresh cookie', async () => {
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);

      const fakeUser = new User({
        _id: new Types.ObjectId('650000000000000000000003'),
        email: 'user@example.com',
        passwordHash: hash,
        fullName: 'Test User',
        role: 'PASSENGER',
        status: 'ACTIVE'
      });

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(fakeUser)
      } as any);

      vi.spyOn(RefreshTokenSession, 'create').mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toMatchObject({
        id: '650000000000000000000003',
        email: 'user@example.com',
        role: 'PASSENGER'
      });

      // Verify HttpOnly cookie header
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);
    });

    it('should return 401 generic error when user is not found', async () => {
      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should return 401 generic error when password is incorrect', async () => {
      const realHash = await hashPassword('RealPassword123!');

      const fakeUser = new User({
        _id: new Types.ObjectId(),
        email: 'user@example.com',
        passwordHash: realHash,
        status: 'ACTIVE'
      });

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(fakeUser)
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword!'
        })
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    it('should reject disabled user accounts with 401', async () => {
      const fakeUser = new User({
        _id: new Types.ObjectId(),
        email: 'disabled@example.com',
        passwordHash: 'dummy',
        status: 'DISABLED'
      });

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(fakeUser)
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'disabled@example.com',
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.error.message).toMatch(/Account is disabled/i);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate token and return 200 with new access & refresh tokens', async () => {
      const rawToken = 'valid-refresh-token-value-1234567890';
      const tokenHash = hashToken(rawToken);
      const userId = new Types.ObjectId('650000000000000000000004');

      const existingSession = {
        _id: new Types.ObjectId('650000000000000000000010'),
        userId,
        familyId: 'family-123',
        tokenHash,
        expiresAt: new Date(Date.now() + 86400 * 1000),
        isRevoked: false
      };

      vi.spyOn(RefreshTokenSession, 'findOne').mockResolvedValue(existingSession as any);
      vi.spyOn(RefreshTokenSession, 'findOneAndUpdate').mockResolvedValue(existingSession as any);
      vi.spyOn(RefreshTokenSession, 'create').mockResolvedValue({} as any);

      const fakeUser = new User({
        _id: userId,
        email: 'refresh@example.com',
        role: 'PASSENGER',
        status: 'ACTIVE'
      });
      vi.spyOn(User, 'findById').mockResolvedValue(fakeUser as any);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${rawToken}`])
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.refreshToken).not.toBe(rawToken);
    });

    it('should detect token reuse and revoke the entire token family', async () => {
      const reusedToken = 'reused-token-value-1234567890';
      const tokenHash = hashToken(reusedToken);

      const alreadyRevokedSession = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        familyId: 'compromised-family-id',
        tokenHash,
        isRevoked: true,
        revokedReason: 'ROTATED'
      };

      vi.spyOn(RefreshTokenSession, 'findOne').mockResolvedValue(alreadyRevokedSession as any);
      const updateManySpy = vi.spyOn(RefreshTokenSession, 'updateMany').mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: reusedToken })
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
      // Verify all sessions in that family were revoked
      expect(updateManySpy).toHaveBeenCalledWith(
        { familyId: 'compromised-family-id', isRevoked: false },
        expect.objectContaining({
          $set: expect.objectContaining({
            isRevoked: true,
            revokedReason: 'REUSE_DETECTED'
          })
        })
      );
    });

    it('should reject expired refresh token', async () => {
      const expiredToken = 'expired-token-value';
      const tokenHash = hashToken(expiredToken);

      const expiredSession = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        familyId: 'family-exp',
        tokenHash,
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000) // in the past
      };

      vi.spyOn(RefreshTokenSession, 'findOne').mockResolvedValue(expiredSession as any);
      vi.spyOn(RefreshTokenSession, 'updateOne').mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.error.message).toMatch(/expired/i);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke session and clear cookie on logout', async () => {
      const rawToken = 'logout-token-value';
      const updateOneSpy = vi.spyOn(RefreshTokenSession, 'updateOne').mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`refreshToken=${rawToken}`])
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
      expect(updateOneSpy).toHaveBeenCalled();

      // Check cookie was cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toMatch(/refreshToken=;/);
    });

    it('should be safe and idempotent on repeated logout without tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return authenticated user profile with valid Bearer token', async () => {
      const userId = '650000000000000000000005';
      const token = signAccessToken({
        sub: userId,
        email: 'passenger@tnstc.in',
        role: 'PASSENGER',
        sessionId: 'session-123'
      });

      const fakeUser = new User({
        _id: new Types.ObjectId(userId),
        email: 'passenger@tnstc.in',
        fullName: 'Senthil Kumar',
        role: 'PASSENGER',
        status: 'ACTIVE'
      });

      vi.spyOn(User, 'findById').mockResolvedValue(fakeUser as any);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: userId,
        email: 'passenger@tnstc.in',
        fullName: 'Senthil Kumar',
        role: 'PASSENGER'
      });
    });

    it('should reject request without Authorization header with 401', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with malformed Authorization header with 401', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Basic 12345')
        .expect(401);

      expect(response.body.error.message).toMatch(/Expected "Bearer <token>"/i);
    });
  });

  describe('RBAC Authorization: GET /api/v1/auth/admin-check', () => {
    it('should reject PASSENGER role with 403 Forbidden', async () => {
      const passengerToken = signAccessToken({
        sub: '650000000000000000000006',
        email: 'passenger@tnstc.in',
        role: 'PASSENGER',
        sessionId: 'session-passenger'
      });

      const response = await request(app)
        .get('/api/v1/auth/admin-check')
        .set('Authorization', `Bearer ${passengerToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toMatch(/Insufficient permissions/i);
    });

    it('should allow ADMIN role with 200 OK', async () => {
      const adminToken = signAccessToken({
        sub: '650000000000000000000007',
        email: 'admin@tnstc.in',
        role: 'ADMIN',
        sessionId: 'session-admin'
      });

      const response = await request(app)
        .get('/api/v1/auth/admin-check')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Admin access verified');
      expect(response.body.user.role).toBe('ADMIN');
    });
  });

  describe('Regression: Public Phase 3 APIs Remain Unprotected', () => {
    it('should allow GET /api/v1/health without token', async () => {
      const response = await request(app).get('/api/v1/health').expect(200);
      expect(response.body.status).toBe('healthy');
    });

    it('should allow GET /api/v1/ready without token', async () => {
      const response = await request(app).get('/api/v1/ready');
      expect([200, 503]).toContain(response.status);
    });

    it('should allow GET /api/v1/districts without token', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };
      vi.spyOn(District, 'find').mockReturnValue(mockQuery as any);
      vi.spyOn(District, 'countDocuments').mockResolvedValue(0 as any);

      const response = await request(app).get('/api/v1/districts').expect(200);
      expect(response.body).toHaveProperty('data');
    });
  });
});
