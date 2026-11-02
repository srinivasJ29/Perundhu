import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../types';
import { UnauthorizedError, ForbiddenError } from '../../common/errors';
import { verifyAccessToken } from './auth.tokens';

/**
 * Middleware that authenticates request using Bearer JWT.
 * Attaches verified user claims to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new UnauthorizedError('Authentication token is required'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(
      new UnauthorizedError('Invalid authorization header format. Expected "Bearer <token>"')
    );
  }

  const token = parts[1];

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: 'ACTIVE',
      sessionId: payload.sessionId,
      organizationId: payload.organizationId,
      divisionId: payload.divisionId,
      depotId: payload.depotId,
      workshopId: payload.workshopId,
      crewMemberId: payload.crewMemberId,
      badgeNumber: payload.badgeNumber
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware that restricts route access to specific user roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication is required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions to perform this operation'));
    }

    next();
  };
}

/**
 * Optional authentication middleware that attaches user if Bearer token present and valid,
 * but allows unauthenticated requests to proceed.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const payload = verifyAccessToken(parts[1]);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        status: 'ACTIVE',
        sessionId: payload.sessionId,
        organizationId: payload.organizationId,
        divisionId: payload.divisionId,
        depotId: payload.depotId,
        workshopId: payload.workshopId,
        crewMemberId: payload.crewMemberId,
        badgeNumber: payload.badgeNumber
      };
    } catch {
      // Ignored for optional authentication
    }
  }

  next();
}
