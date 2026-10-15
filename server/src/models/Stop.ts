import { Schema, model, Document, Model, Types } from 'mongoose';
import { GeoJsonPoint, GeoJsonPointSchema } from './geojson';

export interface IStop {
  districtId: Types.ObjectId;
  busStandId?: Types.ObjectId;
  code: string;
  nameEn: string;
  nameTa: string;
  location: GeoJsonPoint;
  landmark?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type StopDocument = Document & IStop;

const stopSchema = new Schema<StopDocument>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District reference is required'],
      index: true
    },
    busStandId: {
      type: Schema.Types.ObjectId,
      ref: 'BusStand',
      default: undefined,
      index: true
    },
    code: {
      type: String,
      required: [true, 'Stop code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 30
    },
    nameEn: {
      type: String,
      required: [true, 'English stop name is required'],
      trim: true
    },
    nameTa: {
      type: String,
      required: [true, 'Tamil stop name is required'],
      trim: true
    },
    location: {
      type: GeoJsonPointSchema,
      required: [true, 'Geographic location is required']
    },
    landmark: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'stops'
  }
);

stopSchema.index({ districtId: 1, nameEn: 1 });
stopSchema.index({ location: '2dsphere' });

export const Stop: Model<StopDocument> = model<StopDocument>('Stop', stopSchema);
