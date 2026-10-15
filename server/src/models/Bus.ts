import { Schema, model, Document, Model, Types } from 'mongoose';

export type VehicleType = 'ORDINARY_NON_AC' | 'DELUXE' | 'ULTRA_DELUXE';
export type BusOperationalStatus = 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';

export interface IBus {
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  vehicleType: VehicleType;
  status: BusOperationalStatus;
  currentAssignedTripId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BusDocument = Document & IBus;

const busSchema = new Schema<BusDocument>(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Bus registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 20
    },
    fleetNumber: {
      type: String,
      required: [true, 'Fleet number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    depotName: {
      type: String,
      required: [true, 'Depot name is required'],
      trim: true
    },
    vehicleType: {
      type: String,
      enum: {
        values: ['ORDINARY_NON_AC', 'DELUXE', 'ULTRA_DELUXE'],
        message: 'Invalid vehicle type: {VALUE}'
      },
      default: 'ORDINARY_NON_AC'
    },
    status: {
      type: String,
      enum: {
        values: ['IN_SERVICE', 'MAINTENANCE', 'OFFLINE'],
        message: 'Invalid bus status: {VALUE}'
      },
      default: 'IN_SERVICE',
      index: true
    },
    currentAssignedTripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      default: undefined
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'buses'
  }
);

export const Bus: Model<BusDocument> = model<BusDocument>('Bus', busSchema);
