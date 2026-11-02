import { Schema, model, Document, Model, Types } from 'mongoose';

export type CrewRole = 'DRIVER' | 'CONDUCTOR';
export type CrewStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ON_DUTY'
  | 'OFF_DUTY'
  | 'ON_LEAVE'
  | 'INACTIVE'
  | 'ACTIVE'
  | 'SUSPENDED';

export interface ICrewAssignmentHistory {
  busId?: Types.ObjectId;
  tripId?: Types.ObjectId;
  etmDeviceId?: Types.ObjectId;
  assignedAt: Date;
  unassignedAt?: Date;
  dutyType?: string;
}

export interface ICrewMember {
  employeeId: string;
  badgeNumber: string;
  fullName: string;
  role: CrewRole;
  organizationId: Types.ObjectId;
  divisionId: Types.ObjectId;
  depotId: Types.ObjectId;
  licenseNumber?: string; // Driver license
  licenseExpiryDate?: Date;
  contactNumber?: string;
  status: CrewStatus;
  currentAssignedBusId?: Types.ObjectId;
  currentAssignedTripId?: Types.ObjectId;
  assignedEtmDeviceId?: Types.ObjectId; // Conductor paired ETM
  assignmentHistory: ICrewAssignmentHistory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CrewMemberDocument = Document & ICrewMember;

const crewAssignmentHistorySchema = new Schema<ICrewAssignmentHistory>(
  {
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      default: undefined
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      default: undefined
    },
    etmDeviceId: {
      type: Schema.Types.ObjectId,
      ref: 'DeviceRegistry',
      default: undefined
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
    dutyType: {
      type: String,
      trim: true,
      maxlength: 50
    }
  },
  { _id: false }
);

const crewMemberSchema = new Schema<CrewMemberDocument>(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    badgeNumber: {
      type: String,
      required: [true, 'Badge number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 30
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    role: {
      type: String,
      enum: {
        values: ['DRIVER', 'CONDUCTOR'],
        message: 'Invalid crew role: {VALUE}'
      },
      required: [true, 'Crew role is required'],
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'TransportOrganization',
      required: [true, 'Organization reference is required'],
      index: true
    },
    divisionId: {
      type: Schema.Types.ObjectId,
      ref: 'TransportDivision',
      required: [true, 'Division reference is required'],
      index: true
    },
    depotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      required: [true, 'Depot assignment is required'],
      index: true
    },
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50,
      default: undefined
    },
    licenseExpiryDate: {
      type: Date,
      default: undefined
    },
    contactNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      default: undefined
    },
    status: {
      type: String,
      enum: {
        values: [
          'AVAILABLE',
          'ASSIGNED',
          'ON_DUTY',
          'OFF_DUTY',
          'ON_LEAVE',
          'INACTIVE',
          'ACTIVE',
          'SUSPENDED'
        ],
        message: 'Invalid crew status: {VALUE}'
      },
      default: 'AVAILABLE',
      index: true
    },
    currentAssignedBusId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      default: undefined,
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
      default: undefined,
      index: true
    },
    assignmentHistory: {
      type: [crewAssignmentHistorySchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'crew_members'
  }
);

crewMemberSchema.index({ depotId: 1, role: 1, status: 1 });

export const CrewMember: Model<CrewMemberDocument> = model<CrewMemberDocument>(
  'CrewMember',
  crewMemberSchema
);
