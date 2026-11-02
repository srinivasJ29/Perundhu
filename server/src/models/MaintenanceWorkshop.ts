import { Schema, model, Document, Model, Types } from 'mongoose';
import { GeoJsonPoint, GeoJsonPointSchema } from './geojson';

export type WorkshopType = 'DEPOT_PIT_LANE' | 'REGIONAL_CENTRAL_WORKSHOP';
export type WorkshopStatus = 'ACTIVE' | 'INACTIVE' | 'FULL_CAPACITY';
export type MaintenanceCapability =
  | 'ROUTINE_SERVICE'
  | 'MINOR_REPAIRS'
  | 'HEAVY_OVERHAUL'
  | 'BODY_REPAIR'
  | 'BODY_WORK'
  | 'ELECTRICAL'
  | 'TYRE_RETREADING'
  | 'FITNESS_INSPECTION'
  | 'FITNESS_CERTIFICATION';

export interface IMaintenanceWorkshop {
  code: string;
  nameEn: string;
  nameTa: string;
  organizationId: Types.ObjectId;
  divisionId: Types.ObjectId;
  depotId?: Types.ObjectId;
  workshopType: WorkshopType;
  location: GeoJsonPoint;
  totalBays: number;
  activeBaysOccupied: number;
  capabilities: MaintenanceCapability[];
  status: WorkshopStatus;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MaintenanceWorkshopDocument = Document & IMaintenanceWorkshop;

const maintenanceWorkshopSchema = new Schema<MaintenanceWorkshopDocument>(
  {
    code: {
      type: String,
      required: [true, 'Workshop code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 30
    },
    nameEn: {
      type: String,
      required: [true, 'English workshop name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    nameTa: {
      type: String,
      required: [true, 'Tamil workshop name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
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
      default: undefined,
      index: true
    },
    workshopType: {
      type: String,
      enum: {
        values: ['DEPOT_PIT_LANE', 'REGIONAL_CENTRAL_WORKSHOP'],
        message: 'Invalid workshop type: {VALUE}'
      },
      default: 'DEPOT_PIT_LANE',
      index: true
    },
    location: {
      type: GeoJsonPointSchema,
      required: [true, 'Geographical location is required']
    },
    totalBays: {
      type: Number,
      required: [true, 'Total bays count is required'],
      min: [1, 'Must have at least 1 service bay'],
      default: 6
    },
    activeBaysOccupied: {
      type: Number,
      default: 0,
      min: [0, 'Active bays occupied cannot be negative']
    },
    capabilities: {
      type: [String],
      enum: [
        'ROUTINE_SERVICE',
        'MINOR_REPAIRS',
        'HEAVY_OVERHAUL',
        'BODY_REPAIR',
        'BODY_WORK',
        'ELECTRICAL',
        'TYRE_RETREADING',
        'FITNESS_INSPECTION',
        'FITNESS_CERTIFICATION'
      ],
      default: ['ROUTINE_SERVICE', 'FITNESS_INSPECTION']
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE', 'FULL_CAPACITY'],
        message: 'Invalid workshop status: {VALUE}'
      },
      default: 'ACTIVE',
      index: true
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: 30
    }
  },
  {
    timestamps: true,
    collection: 'maintenance_workshops'
  }
);

maintenanceWorkshopSchema.index({ organizationId: 1, code: 1 });
maintenanceWorkshopSchema.index({ location: '2dsphere' });

export const MaintenanceWorkshop: Model<MaintenanceWorkshopDocument> =
  model<MaintenanceWorkshopDocument>(
    'MaintenanceWorkshop',
    maintenanceWorkshopSchema
  );
