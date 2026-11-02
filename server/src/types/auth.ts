export type UserRole =
  | 'PASSENGER'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'TRANSPORT_ADMIN'
  | 'REGIONAL_ADMIN'
  | 'DIVISION_ADMIN'
  | 'DEPOT_MANAGER'
  | 'WORKSHOP_MANAGER'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'CONDUCTOR'
  | 'ANALYST';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  organizationId?: string;
  divisionId?: string;
  depotId?: string;
  workshopId?: string;
  crewMemberId?: string;
  badgeNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  sessionId: string;
  organizationId?: string;
  divisionId?: string;
  depotId?: string;
  workshopId?: string;
  crewMemberId?: string;
  badgeNumber?: string;
}

export interface AccessTokenPayload {
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
      id?: string;
      rawBody?: Buffer;
    }
  }
}
