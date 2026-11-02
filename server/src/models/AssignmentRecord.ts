import { Schema, model, Document, Model, Types } from 'mongoose';

export type AssignmentType =
  | 'BUS_ETM'
  | 'BUS_GPS'
  | 'CONDUCTOR_ETM'
  | 'DRIVER_BUS'
  | 'BUS_DEPOT';

export type AssignmentStatus = 'ACTIVE' | 'UNASSIGNED' | 'SUPERSEDED';

export interface IAssignmentRecord {
  assignmentType: AssignmentType;
  busId?: Types.ObjectId;
  deviceId?: Types.ObjectId;
  crewMemberId?: Types.ObjectId;
  depotId?: Types.ObjectId;
  status: AssignmentStatus;
  assignedAt: Date;
  unassignedAt?: Date;
  assignedBy: string;
  unassignedBy?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type AssignmentRecordDocument = Document & IAssignmentRecord;

const assignmentRecordSchema = new Schema<AssignmentRecordDocument>(
  {
    assignmentType: {
      type: String,
      enum: {
        values: ['BUS_ETM', 'BUS_GPS', 'CONDUCTOR_ETM', 'DRIVER_BUS', 'BUS_DEPOT'],
        message: 'Invalid assignment type: {VALUE}'
      },
      required: [true, 'Assignment type is required'],
      index: true
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      default: undefined,
      index: true
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'DeviceRegistry',
      default: undefined,
      index: true
    },
    crewMemberId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined,
      index: true
    },
    depotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      default: undefined,
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'UNASSIGNED', 'SUPERSEDED'],
        message: 'Invalid assignment status: {VALUE}'
      },
      default: 'ACTIVE',
      index: true
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    unassignedAt: {
      type: Date,
      default: undefined
    },
    assignedBy: {
      type: String,
      required: [true, 'Assigned by identifier is required'],
      trim: true,
      maxlength: 100
    },
    unassignedBy: {
      type: String,
      trim: true,
      maxlength: 100,
      default: undefined
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'assignment_records'
  }
);

assignmentRecordSchema.index({ assignmentType: 1, status: 1 });
assignmentRecordSchema.index({ busId: 1, status: 1 });
assignmentRecordSchema.index({ deviceId: 1, status: 1 });
assignmentRecordSchema.index({ crewMemberId: 1, status: 1 });

export const AssignmentRecord: Model<AssignmentRecordDocument> =
  model<AssignmentRecordDocument>('AssignmentRecord', assignmentRecordSchema);

