import { Schema, model, Document, Model, Types } from 'mongoose';

export type TransferReason =
  | 'FLEET_REBALANCING'
  | 'MAINTENANCE_TRANSFER'
  | 'PERMANENT_REALLOCATION'
  | 'SEASONAL_DEMAND'
  | 'EMERGENCY_RELIEF'
  | 'OTHER';

export type TransferStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ITransferAuditEntry {
  action: string;
  performedBy: string;
  timestamp: Date;
  notes?: string;
}

export interface IDepotTransfer {
  transferNumber: string;
  busId: Types.ObjectId;
  fromDepotId: Types.ObjectId;
  toDepotId: Types.ObjectId;
  reason: TransferReason;
  reasonDetails?: string;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  completedBy?: string;
  cancelledBy?: string;
  status: TransferStatus;
  requestTimestamp: Date;
  approvalTimestamp?: Date;
  completionTimestamp?: Date;
  notes?: string;
  auditHistory: ITransferAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export type DepotTransferDocument = Document & IDepotTransfer;

const transferAuditSchema = new Schema<ITransferAuditEntry>(
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

const depotTransferSchema = new Schema<DepotTransferDocument>(
  {
    transferNumber: {
      type: String,
      required: [true, 'Transfer number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required'],
      index: true
    },
    fromDepotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      required: [true, 'Source depot reference is required'],
      index: true
    },
    toDepotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      required: [true, 'Destination depot reference is required'],
      index: true
    },
    reason: {
      type: String,
      enum: {
        values: [
          'FLEET_REBALANCING',
          'MAINTENANCE_TRANSFER',
          'PERMANENT_REALLOCATION',
          'SEASONAL_DEMAND',
          'EMERGENCY_RELIEF',
          'OTHER'
        ],
        message: 'Invalid transfer reason: {VALUE}'
      },
      default: 'FLEET_REBALANCING'
    },
    reasonDetails: {
      type: String,
      trim: true,
      maxlength: 500
    },
    requestedBy: {
      type: String,
      required: [true, 'Requested by identity is required'],
      trim: true
    },
    approvedBy: {
      type: String,
      trim: true
    },
    rejectedBy: {
      type: String,
      trim: true
    },
    completedBy: {
      type: String,
      trim: true
    },
    cancelledBy: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: [
          'REQUESTED',
          'APPROVED',
          'REJECTED',
          'IN_TRANSIT',
          'COMPLETED',
          'CANCELLED'
        ],
        message: 'Invalid transfer status: {VALUE}'
      },
      default: 'REQUESTED',
      index: true
    },
    requestTimestamp: {
      type: Date,
      default: Date.now
    },
    approvalTimestamp: {
      type: Date
    },
    completionTimestamp: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    auditHistory: {
      type: [transferAuditSchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'depot_transfers'
  }
);

// Pre-validation hook: Source and Destination depots CANNOT be the same depot
depotTransferSchema.pre('validate', function (next) {
  if (
    this.fromDepotId &&
    this.toDepotId &&
    this.fromDepotId.toString() === this.toDepotId.toString()
  ) {
    return next(new Error('Source and destination depots cannot be the same depot'));
  }
  next();
});

depotTransferSchema.index({ busId: 1, status: 1 });
depotTransferSchema.index({ fromDepotId: 1, status: 1 });
depotTransferSchema.index({ toDepotId: 1, status: 1 });
depotTransferSchema.index({ requestTimestamp: -1 });

export const DepotTransfer: Model<DepotTransferDocument> = model<DepotTransferDocument>(
  'DepotTransfer',
  depotTransferSchema
);

