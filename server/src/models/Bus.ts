import { Schema, model, Document, Model, Types } from 'mongoose';

export type VehicleType = 'ORDINARY_NON_AC' | 'DELUXE' | 'ULTRA_DELUXE';
export type FuelType = 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';

export type BusOperationalStatus =
  | 'AVAILABLE'
  | 'IN_SERVICE'
  | 'RESERVED'
  | 'UNDER_MAINTENANCE'
  | 'BREAKDOWN'
  | 'MAINTENANCE'
  | 'OFFLINE'
  | 'INACTIVE';

export interface IBus {
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  depotId?: Types.ObjectId;
  homeDepotId?: Types.ObjectId;
  vehicleType: VehicleType;
  manufacturer?: string;
  vehicleModel?: string;
  fuelType?: FuelType;
  seatingCapacity?: number;
  chassisNumber?: string;
  engineNumber?: string;
  registrationDate?: Date;
  status: BusOperationalStatus;
  isReserveFleet: boolean;
  currentAssignedTripId?: Types.ObjectId;
  assignedEtmDeviceId?: Types.ObjectId;
  assignedGpsTrackerId?: Types.ObjectId;
  assignedDriverId?: Types.ObjectId;
  assignedConductorId?: Types.ObjectId;
  currentOdometerKm?: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDueKm?: number;
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
    depotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      default: undefined,
      index: true
    },
    homeDepotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      default: undefined,
      index: true
    },
    vehicleType: {
      type: String,
      enum: {
        values: ['ORDINARY_NON_AC', 'DELUXE', 'ULTRA_DELUXE'],
        message: 'Invalid vehicle type: {VALUE}'
      },
      default: 'ORDINARY_NON_AC'
    },
    manufacturer: {
      type: String,
      trim: true,
      maxlength: 100,
      default: undefined
    },
    vehicleModel: {
      type: String,
      trim: true,
      maxlength: 100,
      default: undefined
    },
    fuelType: {
      type: String,
      enum: {
        values: ['DIESEL', 'CNG', 'ELECTRIC', 'HYBRID'],
        message: 'Invalid fuel type: {VALUE}'
      },
      default: 'DIESEL'
    },
    seatingCapacity: {
      type: Number,
      min: [1, 'Seating capacity must be at least 1'],
      max: [120, 'Seating capacity cannot exceed 120'],
      default: undefined
    },
    chassisNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50,
      default: undefined
    },
    engineNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50,
      default: undefined
    },
    registrationDate: {
      type: Date,
      default: undefined
    },
    status: {
      type: String,
      enum: {
        values: [
          'AVAILABLE',
          'IN_SERVICE',
          'RESERVED',
          'UNDER_MAINTENANCE',
          'BREAKDOWN',
          'MAINTENANCE',
          'OFFLINE',
          'INACTIVE'
        ],
        message: 'Invalid bus status: {VALUE}'
      },
      default: 'IN_SERVICE',
      index: true
    },
    isReserveFleet: {
      type: Boolean,
      default: false,
      index: true
    },
    currentAssignedTripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      default: undefined
    },
    assignedEtmDeviceId: {
      type: Schema.Types.ObjectId,
      ref: 'DeviceRegistry',
      default: undefined
    },
    assignedGpsTrackerId: {
      type: Schema.Types.ObjectId,
      ref: 'DeviceRegistry',
      default: undefined
    },
    assignedDriverId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined
    },
    assignedConductorId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined
    },
    currentOdometerKm: {
      type: Number,
      default: 0,
      min: [0, 'Odometer cannot be negative']
    },
    lastMaintenanceDate: {
      type: Date,
      default: undefined
    },
    nextMaintenanceDueKm: {
      type: Number,
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

busSchema.index({ depotId: 1, status: 1 });
busSchema.index({ isReserveFleet: 1, status: 1 });

export const Bus: Model<BusDocument> = model<BusDocument>('Bus', busSchema);
