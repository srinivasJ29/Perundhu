import { Schema, model, Document, Model } from 'mongoose';

export type OrganizationStatus = 'ACTIVE' | 'INACTIVE';

export interface ITransportOrganization {
  name: string;
  code: string;
  shortName: string;
  status: OrganizationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type TransportOrganizationDocument = Document & ITransportOrganization;

const transportOrganizationSchema = new Schema<TransportOrganizationDocument>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    code: {
      type: String,
      required: [true, 'Organization code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 30
    },
    shortName: {
      type: String,
      required: [true, 'Short organization name is required'],
      trim: true,
      maxlength: 50
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Invalid organization status: {VALUE}'
      },
      default: 'ACTIVE',
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'transport_organizations'
  }
);

export const TransportOrganization: Model<TransportOrganizationDocument> =
  model<TransportOrganizationDocument>(
    'TransportOrganization',
    transportOrganizationSchema
  );
