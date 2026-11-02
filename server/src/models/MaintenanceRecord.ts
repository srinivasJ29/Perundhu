import { Schema, model, Document, Model, Types } from 'mongoose';

export type MaintenanceCategory =
  | 'PREVENTIVE'
  | 'BREAKDOWN'
  | 'ACCIDENT'
  | 'ROUTINE_INSPECTION'
  | 'FITNESS_CERT';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RepairStatus =
  | 'REPORTED'
  | 'TRIAGED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'RESOLVED'
  | 'CLOSED';

export interface IPartReplaced {
  partName: string;
  partCode?: string;
  quantity: number;
}

export interface IMaintenanceRecord {
  recordNumber: string;
  busId: Types.ObjectId;
  depotId: Types.ObjectId;
  workshopId?: Types.ObjectId;
  reportedByCrewId?: Types.ObjectId;
  maintenanceCategory: MaintenanceCategory;
  priority: MaintenancePriority;
  issueDescription: string;
  repairStatus: RepairStatus;
  odometerAtReportKm?: number;
  reportedAt: Date;
  resolvedAt?: Date;
  repairNotes?: string;
  technicianSignOff?: string;
  partsReplaced: IPartReplaced[];
  createdAt: Date;
  updatedAt: Date;
}

export type MaintenanceRecordDocument = Document & IMaintenanceRecord;

const partReplacedSchema = new Schema<IPartReplaced>(
  {
    partName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    partCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  },
  { _id: false }
);

const maintenanceRecordSchema = new Schema<MaintenanceRecordDocument>(
  {
    recordNumber: {
      type: String,
      required: [true, 'Record number is required'],
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
    depotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      required: [true, 'Depot reference is required'],
      index: true
    },
    workshopId: {
      type: Schema.Types.ObjectId,
      ref: 'MaintenanceWorkshop',
      default: undefined,
      index: true
    },
    reportedByCrewId: {
      type: Schema.Types.ObjectId,
      ref: 'CrewMember',
      default: undefined
    },
    maintenanceCategory: {
      type: String,
      enum: {
        values: [
          'PREVENTIVE',
          'BREAKDOWN',
          'ACCIDENT',
          'ROUTINE_INSPECTION',
          'FITNESS_CERT'
        ],
        message: 'Invalid maintenance category: {VALUE}'
      },
      required: [true, 'Maintenance category is required'],
      index: true
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: 'Invalid priority: {VALUE}'
      },
      default: 'MEDIUM',
      index: true
    },
    issueDescription: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      minlength: 5,
      maxlength: 1000
    },
    repairStatus: {
      type: String,
      enum: {
        values: [
          'REPORTED',
          'TRIAGED',
          'IN_PROGRESS',
          'WAITING_FOR_PARTS',
          'RESOLVED',
          'CLOSED'
        ],
        message: 'Invalid repair status: {VALUE}'
      },
      default: 'REPORTED',
      index: true
    },
    odometerAtReportKm: {
      type: Number,
      min: [0, 'Odometer reading cannot be negative']
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    resolvedAt: {
      type: Date,
      default: undefined
    },
    repairNotes: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    technicianSignOff: {
      type: String,
      trim: true,
      maxlength: 100
    },
    partsReplaced: {
      type: [partReplacedSchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'maintenance_records'
  }
);

maintenanceRecordSchema.index({ busId: 1, repairStatus: 1 });
maintenanceRecordSchema.index({ depotId: 1, repairStatus: 1 });

export const MaintenanceRecord: Model<MaintenanceRecordDocument> =
  model<MaintenanceRecordDocument>(
    'MaintenanceRecord',
    maintenanceRecordSchema
  );
