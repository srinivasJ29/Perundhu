import { Schema, model, Document, Model, Types } from 'mongoose';
import { UserRole, UserStatus, SafeUser } from '../types';

export interface IUser {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  organizationId?: Types.ObjectId;
  divisionId?: Types.ObjectId;
  depotId?: Types.ObjectId;
  workshopId?: Types.ObjectId;
  crewMemberId?: Types.ObjectId;
  badgeNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends Document, Omit<IUser, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
  toSafeUser(): SafeUser;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    role: {
      type: String,
      enum: [
        'PASSENGER',
        'ADMIN',
        'SUPER_ADMIN',
        'TRANSPORT_ADMIN',
        'REGIONAL_ADMIN',
        'DIVISION_ADMIN',
        'DEPOT_MANAGER',
        'WORKSHOP_MANAGER',
        'DISPATCHER',
        'DRIVER',
        'CONDUCTOR',
        'ANALYST'
      ],
      default: 'PASSENGER',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISABLED'],
      default: 'ACTIVE',
      required: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      sparse: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'TransportOrganization',
      default: undefined,
      index: true
    },
    divisionId: {
      type: Schema.Types.ObjectId,
      ref: 'TransportDivision',
      default: undefined,
      index: true
    },
    depotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      default: undefined,
      index: true
    },
    workshopId: {
      type: Schema.Types.ObjectId,
      ref: 'MaintenanceWorkshop',
      default: undefined,
      index: true
    },
    crewMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined,
      index: true
    },
    badgeNumber: {
      type: String,
      trim: true,
      default: undefined
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Method to return safe sanitized user object
userSchema.methods.toSafeUser = function (): SafeUser {
  return {
    id: this._id.toString(),
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    status: this.status,
    phone: this.phone,
    organizationId: this.organizationId ? this.organizationId.toString() : undefined,
    divisionId: this.divisionId ? this.divisionId.toString() : undefined,
    depotId: this.depotId ? this.depotId.toString() : undefined,
    workshopId: this.workshopId ? this.workshopId.toString() : undefined,
    crewMemberId: this.crewMemberId ? this.crewMemberId.toString() : undefined,
    badgeNumber: this.badgeNumber,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Safe JSON serialization
userSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  }
});

export const User: Model<UserDocument> = model<UserDocument>('User', userSchema);
