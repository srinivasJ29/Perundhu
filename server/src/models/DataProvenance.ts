import { Schema } from 'mongoose';

export type DataClassification =
  | 'OFFICIAL_VERIFIED'
  | 'AUTHORIZED_IMPORTED'
  | 'SECONDARY_VERIFIED'
  | 'COMMUNITY_SOURCED'
  | 'ESTIMATED'
  | 'PENDING_VERIFICATION'
  | 'RETIRED';

export interface IDataProvenance {
  sourceOrganization: string;
  sourceReference: string;
  retrievalTimestamp: Date;
  dataCoverage: string;
  classification: DataClassification;
  verificationStatus: 'VERIFIED' | 'PROVISIONAL' | 'UNVERIFIED';
  processingVersion: string;
  lastVerifiedTimestamp?: Date;
}

export const dataProvenanceSchema = new Schema<IDataProvenance>(
  {
    sourceOrganization: {
      type: String,
      required: true,
      default: 'TNSTC-Madurai'
    },
    sourceReference: {
      type: String,
      required: true,
      default: 'SYSTEM_AGGREGATION'
    },
    retrievalTimestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    dataCoverage: {
      type: String,
      required: true,
      default: 'Madurai District'
    },
    classification: {
      type: String,
      enum: [
        'OFFICIAL_VERIFIED',
        'AUTHORIZED_IMPORTED',
        'SECONDARY_VERIFIED',
        'COMMUNITY_SOURCED',
        'ESTIMATED',
        'PENDING_VERIFICATION',
        'RETIRED'
      ],
      required: true,
      default: 'OFFICIAL_VERIFIED'
    },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED', 'PROVISIONAL', 'UNVERIFIED'],
      required: true,
      default: 'VERIFIED'
    },
    processingVersion: {
      type: String,
      required: true,
      default: 'v1.0'
    },
    lastVerifiedTimestamp: {
      type: Date
    }
  },
  { _id: false }
);

