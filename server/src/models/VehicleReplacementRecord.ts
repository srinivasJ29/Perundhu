import { Schema, model, Document, Model, Types } from 'mongoose';

export type ReplacementReason =
  | 'BREAKDOWN'
  | 'ACCIDENT'
  | 'MAINTENANCE_DUE'
  | 'CREW_UNAVAILABLE'
  | 'OVERCROWDING'
  | 'OTHER';

export type ReplacementStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IReplacementAuditEntry {
  action: string;
  performedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface IVehicleReplacementRecord {
  replacementNumber: string;
  originalBusId: Types.ObjectId;
  replacementBusId: Types.ObjectId;
  tripId?: Types.ObjectId;
  routeId?: Types.ObjectId;
  originalDepotId: Types.ObjectId;
  replacementDepotId: Types.ObjectId;
  reason: ReplacementReason;
  reasonDetails?: string;
  authorizedBy: string;
  driverReassignedId?: Types.ObjectId;
  conductorReassignedId?: Types.ObjectId;
  gpsReassignedDeviceId?: Types.ObjectId;
  replacementTimestamp: Date;
  status: ReplacementStatus;
  passengersTransferred: boolean;
  auditHistory: IReplacementAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleReplacementRecordDocument = Document & IVehicleReplacementRecord;

const auditEntrySchema = new Schema<IReplacementAuditEntry>(
  {
    action: {
      type: String,
      required: true,
      trim: true
    },
    performedBy: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const vehicleReplacementRecordSchema = new Schema<VehicleReplacementRecordDocument>(
  {
    replacementNumber: {
      type: String,
      required: [true, 'Replacement number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40
    },
    originalBusId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Original bus reference is required'],
      index: true
    },
    replacementBusId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Replacement bus reference is required'],
      index: true
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      default: undefined,
      index: true
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      default: undefined,
      index: true
    },
    originalDepotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      required: [true, 'Original depot reference is required'],
      index: true
    },
    replacementDepotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      required: [true, 'Replacement depot reference is required'],
      index: true
    },
    reason: {
      type: String,
      enum: {
        values: [
          'BREAKDOWN',
          'ACCIDENT',
          'MAINTENANCE_DUE',
          'CREW_UNAVAILABLE',
          'OVERCROWDING',
          'OTHER'
        ],
        message: 'Invalid replacement reason: {VALUE}'
      },
      required: [true, 'Replacement reason is required']
    },
    reasonDetails: {
      type: String,
      trim: true,
      maxlength: 500
    },
    authorizedBy: {
      type: String,
      required: [true, 'Authorized by identity is required'],
      trim: true
    },
    driverReassignedId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined
    },
    conductorReassignedId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined
    },
    gpsReassignedDeviceId: {
      type: Schema.Types.ObjectId,
      ref: 'DeviceRegistry',
      default: undefined
    },
    replacementTimestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: [
          'REQUESTED',
          'APPROVED',
          'DISPATCHED',
          'ACTIVE',
          'COMPLETED',
          'CANCELLED'
        ],
        message: 'Invalid replacement status: {VALUE}'
      },
      default: 'REQUESTED',
      index: true
    },
    passengersTransferred: {
      type: Boolean,
      default: false
    },
    auditHistory: {
      type: [auditEntrySchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'vehicle_replacements'
  }
);

// Pre-save validation: Original bus and Replacement bus CANNOT be the same vehicle
vehicleReplacementRecordSchema.pre('validate', function (next) {
  if (
    this.originalBusId &&
    this.replacementBusId &&
    this.originalBusId.toString() === this.replacementBusId.toString()
  ) {
    return next(new Error('Replacement bus cannot be identical to the original bus'));
  }
  next();
});

vehicleReplacementRecordSchema.index({ originalBusId: 1, status: 1 });
vehicleReplacementRecordSchema.index({ replacementBusId: 1, status: 1 });

export const VehicleReplacementRecord: Model<VehicleReplacementRecordDocument> =
  model<VehicleReplacementRecordDocument>(
    'VehicleReplacementRecord',
    vehicleReplacementRecordSchema
  );
