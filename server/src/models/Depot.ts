import { Schema, model, Document, Model, Types } from 'mongoose';
import { GeoJsonPoint, GeoJsonPointSchema } from './geojson';

export type DepotType = 'PRIMARY' | 'SECONDARY' | 'BACKUP';
export type DepotStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';

export interface IDepot {
  code: string;
  nameEn: string;
  nameTa: string;
  organizationId: Types.ObjectId;
  divisionId: Types.ObjectId;
  depotType: DepotType;
  primaryDepotId?: Types.ObjectId;
  sisterBackupDepotIds: Types.ObjectId[];
  location: GeoJsonPoint;
  address?: string;
  contactPhone?: string;
  totalCapacity: number;
  serviceBaysCount: number;
  fuelPumpsAvailable: boolean;
  associatedBusStandIds: Types.ObjectId[];
  status: DepotStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type DepotDocument = Document & IDepot;

const depotSchema = new Schema<DepotDocument>(
  {
    code: {
      type: String,
      required: [true, 'Depot code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 30
    },
    nameEn: {
      type: String,
      required: [true, 'English depot name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    nameTa: {
      type: String,
      required: [true, 'Tamil depot name is required'],
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
    depotType: {
      type: String,
      enum: {
        values: ['PRIMARY', 'SECONDARY', 'BACKUP'],
        message: 'Invalid depot type: {VALUE}'
      },
      default: 'PRIMARY',
      index: true
    },
    primaryDepotId: {
      type: Schema.Types.ObjectId,
      ref: 'Depot',
      default: undefined,
      validate: {
        validator: function (this: any, val?: Types.ObjectId): boolean {
          if (!val) return true;
          // Cannot reference itself as its own primary depot
          if (this._id && val.equals(this._id)) {
            return false;
          }
          return true;
        },
        message: 'A depot cannot reference itself as its primary depot'
      }
    },
    sisterBackupDepotIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Depot'
        }
      ],
      default: []
    },
    location: {
      type: GeoJsonPointSchema,
      required: [true, 'Geographical location is required']
    },
    address: {
      type: String,
      trim: true,
      maxlength: 250
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: 30
    },
    totalCapacity: {
      type: Number,
      required: [true, 'Total bus capacity is required'],
      min: [1, 'Capacity must be at least 1 bus'],
      default: 50
    },
    serviceBaysCount: {
      type: Number,
      default: 4,
      min: [0, 'Service bays count cannot be negative']
    },
    fuelPumpsAvailable: {
      type: Boolean,
      default: true
    },
    associatedBusStandIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'BusStand'
        }
      ],
      default: []
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'],
        message: 'Invalid depot status: {VALUE}'
      },
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'depots'
  }
);

// Pre-validation: Ensure BACKUP depot has a primaryDepotId and reject circular relationships
depotSchema.pre<DepotDocument>('validate', async function (next) {
  if (this.depotType === 'BACKUP' && !this.primaryDepotId) {
    return next(new Error('A BACKUP depot must specify an explicit primaryDepotId reference'));
  }

  if (this.primaryDepotId && this._id && this.primaryDepotId.equals(this._id)) {
    return next(new Error('A depot cannot reference itself as its primary depot'));
  }

  // Circular relationship check: Ensure primary depot does not reference this depot
  if (this.primaryDepotId && this._id) {
    try {
      const primaryDepot = await (this.constructor as Model<DepotDocument>).findById(this.primaryDepotId);
      if (primaryDepot && primaryDepot.primaryDepotId && primaryDepot.primaryDepotId.equals(this._id)) {
        return next(
          new Error('Circular depot relationship detected: Primary depot already references this depot')
        );
      }
    } catch (err: any) {
      return next(err);
    }
  }

  next();
});

depotSchema.index({ organizationId: 1, code: 1 });
depotSchema.index({ location: '2dsphere' });

export const Depot: Model<DepotDocument> = model<DepotDocument>('Depot', depotSchema);
