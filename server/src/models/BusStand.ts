import { Schema, model, Document, Model, Types } from 'mongoose';
import { GeoJsonPoint, GeoJsonPointSchema } from './geojson';

export type BusStandType = 'INTERCITY_TERMINAL' | 'MOFUSSIL' | 'TOWN_STAND';

export interface IBusStand {
  districtId: Types.ObjectId;
  divisionId?: Types.ObjectId;
  depotIds?: Types.ObjectId[];
  code: string;
  nameEn: string;
  nameTa: string;
  location: GeoJsonPoint;
  standType: BusStandType;
  totalPlatforms: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BusStandDocument = Document & IBusStand;

const busStandSchema = new Schema<BusStandDocument>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District reference is required'],
      index: true
    },
    divisionId: {
      type: Schema.Types.ObjectId,
      ref: 'TransportDivision',
      default: undefined,
      index: true
    },
    depotIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Depot',
      default: []
    },
    code: {
      type: String,
      required: [true, 'Bus stand code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 20
    },
    nameEn: {
      type: String,
      required: [true, 'English bus stand name is required'],
      trim: true
    },
    nameTa: {
      type: String,
      required: [true, 'Tamil bus stand name is required'],
      trim: true
    },
    location: {
      type: GeoJsonPointSchema,
      required: [true, 'Geographic location is required']
    },
    standType: {
      type: String,
      enum: {
        values: ['INTERCITY_TERMINAL', 'MOFUSSIL', 'TOWN_STAND'],
        message: 'Invalid bus stand type: {VALUE}'
      },
      default: 'TOWN_STAND'
    },
    totalPlatforms: {
      type: Number,
      default: 1,
      min: [1, 'Must have at least 1 platform']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'bus_stands'
  }
);

busStandSchema.index({ districtId: 1, code: 1 });
busStandSchema.index({ location: '2dsphere' });

export const BusStand: Model<BusStandDocument> =
  model<BusStandDocument>('BusStand', busStandSchema);
