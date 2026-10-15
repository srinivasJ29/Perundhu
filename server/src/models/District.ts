import { Schema, model, Document, Model } from 'mongoose';

export interface IDistrict {
  code: string;
  nameEn: string;
  nameTa: string;
  headquarters: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DistrictDocument = Document & IDistrict;

const districtSchema = new Schema<DistrictDocument>(
  {
    code: {
      type: String,
      required: [true, 'District code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10
    },
    nameEn: {
      type: String,
      required: [true, 'English district name is required'],
      trim: true
    },
    nameTa: {
      type: String,
      required: [true, 'Tamil district name is required'],
      trim: true
    },
    headquarters: {
      type: String,
      required: [true, 'District headquarters is required'],
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
    collection: 'districts'
  }
);

districtSchema.index({ nameEn: 1 });

export const District: Model<DistrictDocument> =
  model<DistrictDocument>('District', districtSchema);
