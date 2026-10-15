import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app';
import { User, RefreshTokenSession } from '../../src/models';
import { env } from '../../src/config/env';

/**
 * Real Database-Backed Integration Tests.
 * Explicitly connects to the live local MongoDB development database (perundhu_dev).
 */
describe('Auth Live Database Integration Tests (MongoDB)', () => {
  let isDbConnected = false;
  const testEmail = `dbtest_${Date.now()}@tnstc.test`;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    if (env.MONGODB_URI) {
      try {
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(env.MONGODB_URI);
        }
        isDbConnected = mongoose.connection.readyState === 1;
      } catch (err) {
        isDbConnected = false;
      }
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      // Clean up test documents
      await User.deleteMany({ email: { $regex: /@tnstc\.test$/ } });
      await RefreshTokenSession.deleteMany({ ipAddress: 'db-test-runner' });
    }
  });

  it('should persist a new user in MongoDB with server-assigned PASSENGER role', async () => {
    if (!isDbConnected) {
      console.log('Skipping live DB test: MongoDB not connected.');
      return;
    }

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'RealDbPassword123!',
        fullName: 'Real DB Test User',
        role: 'ADMIN' // Should be overridden to PASSENGER
      })
      .expect(201);

    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.role).toBe('PASSENGER');

    // Verify in MongoDB directly
    const userInDb = await User.findOne({ email: testEmail }).select('+passwordHash');
    expect(userInDb).not.toBeNull();
    expect(userInDb!.role).toBe('PASSENGER');
    expect(userInDb!.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('should authenticate user against MongoDB and create a hashed session', async () => {
    if (!isDbConnected) return;

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'RealDbPassword123!'
      })
      .expect(200);

    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');

    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;

    // Verify session stored in MongoDB contains SHA-256 hash, not raw token
    const sessionInDb = await RefreshTokenSession.findOne({
      userId: new mongoose.Types.ObjectId(res.body.data.user.id)
    });

    expect(sessionInDb).not.toBeNull();
    expect(sessionInDb!.tokenHash).not.toBe(refreshToken);
    expect(sessionInDb!.tokenHash).toHaveLength(64); // SHA-256 hex length
  });

  it('should retrieve current user from MongoDB via GET /auth/me', async () => {
    if (!isDbConnected) return;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.email).toBe(testEmail);
  });

  it('should atomically rotate token in MongoDB and detect reuse on old token', async () => {
    if (!isDbConnected) return;

    const oldRefreshToken = refreshToken;

    // First refresh: should succeed
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
      .expect(200);

    expect(refreshRes.body.data).toHaveProperty('accessToken');
    expect(refreshRes.body.data).toHaveProperty('refreshToken');
    const newRefreshToken = refreshRes.body.data.refreshToken;

    // Verify old session marked ROTATED in DB
    const oldSessionInDb = await RefreshTokenSession.findOne({
      tokenHash: require('crypto').createHash('sha256').update(oldRefreshToken).digest('hex')
    });
    expect(oldSessionInDb?.isRevoked).toBe(true);
    expect(oldSessionInDb?.revokedReason).toBe('ROTATED');

    // Attempting to reuse oldRefreshToken: should trigger reuse detection!
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
      .expect(401);

    // Verify newRefreshToken session was also revoked due to family compromise!
    const newSessionInDb = await RefreshTokenSession.findOne({
      tokenHash: require('crypto').createHash('sha256').update(newRefreshToken).digest('hex')
    });
    expect(newSessionInDb?.isRevoked).toBe(true);
    expect(newSessionInDb?.revokedReason).toBe('REUSE_DETECTED');
  });
});
