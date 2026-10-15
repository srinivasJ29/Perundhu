import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IRefreshTokenSession {
  userId: Types.ObjectId;
  sessionId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: 'ROTATED' | 'LOGOUT' | 'REUSE_DETECTED' | 'ADMIN_REVOKED' | 'EXPIRED';
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshTokenSessionDocument = Document & IRefreshTokenSession;

const refreshTokenSessionSchema = new Schema<RefreshTokenSessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      index: true
    },
    familyId: {
      type: String,
      required: [true, 'Token family ID is required'],
      index: true
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration timestamp is required']
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedAt: {
      type: Date
    },
    revokedReason: {
      type: String,
      enum: ['ROTATED', 'LOGOUT', 'REUSE_DETECTED', 'ADMIN_REVOKED', 'EXPIRED']
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'refresh_token_sessions'
  }
);

// TTL index to automatically purge expired sessions
refreshTokenSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSessionSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSessionSchema.index({ familyId: 1, isRevoked: 1 });

export const RefreshTokenSession: Model<RefreshTokenSessionDocument> =
  model<RefreshTokenSessionDocument>('RefreshTokenSession', refreshTokenSessionSchema);
