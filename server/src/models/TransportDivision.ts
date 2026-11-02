import { Schema, model, Document, Model, Types } from 'mongoose';

export type DivisionStatus = 'ACTIVE' | 'INACTIVE';

export interface ITransportDivision {
  organizationId: Types.ObjectId;
  name: string;
  code: string;
  districtId?: Types.ObjectId;
  status: DivisionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type TransportDivisionDocument = Document & ITransportDivision;

const transportDivisionSchema = new Schema<TransportDivisionDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'TransportOrganization',
      required: [true, 'Organization reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Division name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    code: {
      type: String,
      required: [true, 'Division code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 30
    },
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      default: undefined
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Invalid division status: {VALUE}'
      },
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'transport_divisions'
  }
);

transportDivisionSchema.index({ organizationId: 1, code: 1 });

export const TransportDivision: Model<TransportDivisionDocument> =
  model<TransportDivisionDocument>(
    'TransportDivision',
    transportDivisionSchema
  );
