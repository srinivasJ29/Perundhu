import { Schema, model, Document, Model } from 'mongoose';
import { UserRole, UserStatus, SafeUser } from '../types';

export interface IUser {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
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
      enum: ['PASSENGER', 'ADMIN'],
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
