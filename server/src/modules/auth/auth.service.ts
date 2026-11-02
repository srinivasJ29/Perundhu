import crypto from 'crypto';
import { Types } from 'mongoose';
import { User, RefreshTokenSession } from '../../models';
import { SafeUser } from '../../types';
import { ConflictError, UnauthorizedError } from '../../common/errors';
import { logger } from '../../common/logger';
import { env } from '../../config/env';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateRefreshToken,
  signAccessToken
} from './auth.tokens';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthSuccessResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshSuccessResult {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Registers a new passenger account.
   * Public registration always assigns the 'PASSENGER' role server-side.
   */
  public async register(input: RegisterInput): Promise<SafeUser> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName: input.fullName.trim(),
      phone: input.phone?.trim(),
      role: 'PASSENGER', // Enforced server-side
      status: 'ACTIVE'
    });

    logger.info({ userId: user._id, role: user.role }, 'New passenger registered successfully');

    return user.toSafeUser();
  }

  /**
   * Authenticates user credentials and creates a new refresh token session.
   */
  public async login(input: LoginInput, meta?: RequestMetadata): Promise<AuthSuccessResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

// Constant-time Argon2id dummy hash for non-existent account timing mitigation
const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$dG5zdGNsaXZldHJhY2tpbmc$9nI1d3RjYjV2cGtyM294bWlsZW1haW50YWluZXJzZWNyZXQ';

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      // Run dummy hash verification to equalize response timing with existing accounts
      await verifyPassword(DUMMY_ARGON2_HASH, input.password);
      // Use generic error message to prevent account enumeration
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'DISABLED') {
      throw new UnauthorizedError('Account is disabled. Please contact support.');
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const sessionId = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    await RefreshTokenSession.create({
      userId: user._id,
      sessionId,
      familyId,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
      organizationId: user.organizationId?.toString(),
      divisionId: user.divisionId?.toString(),
      depotId: user.depotId?.toString(),
      workshopId: user.workshopId?.toString(),
      crewMemberId: user.crewMemberId?.toString(),
      badgeNumber: user.badgeNumber
    });

    logger.info({ userId: user._id, sessionId }, 'User logged in successfully');

    return {
      user: user.toSafeUser(),
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  /**
   * Rotates a refresh token with strict reuse detection and atomic rotation.
   */
  public async refresh(
    rawRefreshToken: string,
    meta?: RequestMetadata
  ): Promise<RefreshSuccessResult> {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string' || rawRefreshToken.trim() === '') {
      throw new UnauthorizedError('Refresh token is required');
    }

    const incomingHash = hashToken(rawRefreshToken.trim());
    const session = await RefreshTokenSession.findOne({ tokenHash: incomingHash });

    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Reuse Detection: A revoked or previously rotated token presented again
    if (session.isRevoked) {
      logger.warn(
        { userId: session.userId, familyId: session.familyId, reason: session.revokedReason },
        'SECURITY ALERT: Refresh token reuse detected! Revoking all sessions in token family.'
      );

      // Invalidate the entire token family
      await RefreshTokenSession.updateMany(
        { familyId: session.familyId, isRevoked: false },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'REUSE_DETECTED'
          }
        }
      );

      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Check expiration
    if (session.expiresAt <= new Date()) {
      await RefreshTokenSession.updateOne(
        { _id: session._id },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'EXPIRED'
          }
        }
      );
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Atomic rotation of current generation to prevent concurrent race conditions
    const rotatedOldSession = await RefreshTokenSession.findOneAndUpdate(
      {
        _id: session._id,
        tokenHash: incomingHash,
        isRevoked: false
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'ROTATED'
        }
      },
      { new: true }
    );

    if (!rotatedOldSession) {
      // Race condition: another concurrent process already rotated this token
      await RefreshTokenSession.updateMany(
        { familyId: session.familyId, isRevoked: false },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'REUSE_DETECTED'
          }
        }
      );
      throw new UnauthorizedError('Concurrent refresh detected or token already rotated');
    }

    // Check user account status
    const user = await User.findById(session.userId);
    if (!user || user.status === 'DISABLED') {
      throw new UnauthorizedError('Account is disabled or no longer exists');
    }

    // Mint new generation in the same family
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const newSessionId = crypto.randomUUID();
    const newExpiresAt = new Date(
      Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
    );

    await RefreshTokenSession.create({
      userId: session.userId,
      sessionId: newSessionId,
      familyId: session.familyId, // Retain family lineage
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId: newSessionId,
      organizationId: user.organizationId?.toString(),
      divisionId: user.divisionId?.toString(),
      depotId: user.depotId?.toString(),
      workshopId: user.workshopId?.toString(),
      crewMemberId: user.crewMemberId?.toString(),
      badgeNumber: user.badgeNumber
    });

    logger.debug({ userId: user._id, newSessionId }, 'Refresh token rotated successfully');

    return {
      accessToken,
      refreshToken: newRawRefreshToken
    };
  }

  /**
   * Revokes the refresh token session and clears associated state.
   */
  public async logout(rawRefreshToken?: string): Promise<{ success: boolean }> {
    if (rawRefreshToken && typeof rawRefreshToken === 'string' && rawRefreshToken.trim() !== '') {
      const tokenHash = hashToken(rawRefreshToken.trim());
      await RefreshTokenSession.updateOne(
        { tokenHash, isRevoked: false },
        {
          $set: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'LOGOUT'
          }
        }
      );
    }

    return { success: true };
  }

  /**
   * Retrieves authenticated user public profile by ID.
   */
  public async getCurrentUser(userId: string): Promise<SafeUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedError('Invalid user identity');
    }

    const user = await User.findById(userId);
    if (!user || user.status === 'DISABLED') {
      throw new UnauthorizedError('Account is disabled or does not exist');
    }

    return user.toSafeUser();
  }

  /**
   * Revokes all active refresh sessions for a specific user (e.g. security reset).
   */
  public async revokeAllUserSessions(userId: string | Types.ObjectId): Promise<number> {
    const result = await RefreshTokenSession.updateMany(
      { userId, isRevoked: false },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'ADMIN_REVOKED'
        }
      }
    );
    return result.modifiedCount;
  }
}

export const authService = new AuthService();
