export type UserRole = 'PASSENGER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  sessionId: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

// Augment Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
