import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../../config/env';
import { AccessTokenPayload, UserRole } from '../../types';
import { UnauthorizedError } from '../../common/errors';

/**
 * Hashes a plaintext password using Argon2id with OWASP-recommended parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 4     // 4 threads
  });
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Computes SHA-256 hash of a raw token for safe database persistence.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a cryptographically strong random token string (80 characters hex).
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Signs a short-lived access JWT.
 */
export function signAccessToken(payload: {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
  organizationId?: string;
  divisionId?: string;
  depotId?: string;
  workshopId?: string;
  crewMemberId?: string;
  badgeNumber?: string;
}): string {
  const tokenPayload: Record<string, any> = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId
  };

  if (payload.organizationId) tokenPayload.organizationId = payload.organizationId;
  if (payload.divisionId) tokenPayload.divisionId = payload.divisionId;
  if (payload.depotId) tokenPayload.depotId = payload.depotId;
  if (payload.workshopId) tokenPayload.workshopId = payload.workshopId;
  if (payload.crewMemberId) tokenPayload.crewMemberId = payload.crewMemberId;
  if (payload.badgeNumber) tokenPayload.badgeNumber = payload.badgeNumber;

  return jwt.sign(
    tokenPayload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithm: 'HS256'
    }
  );
}

/**
 * Verifies and decodes an access JWT.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithms: ['HS256']
    }) as AccessTokenPayload;

    return decoded;
  } catch (err: any) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token has expired');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError(`Invalid access token: ${err.message}`);
    }
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Returns secure browser cookie options for the refresh token.
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: `${env.API_PREFIX}/auth`,
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
  };
}
