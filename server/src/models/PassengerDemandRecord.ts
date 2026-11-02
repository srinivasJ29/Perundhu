import { Schema, model, Document, Types } from 'mongoose';
import { DataClassification, IDataProvenance, dataProvenanceSchema } from './DataProvenance';

export interface IPassengerDemandRecord {
  recordId: string;
  stopId: Types.ObjectId;
  routeId: Types.ObjectId;
  tripId?: Types.ObjectId;
  directionId?: Types.ObjectId;
  busId?: Types.ObjectId;
  deviceId?: Types.ObjectId;
  etmTransactionBatchId?: string;
  boardingsCount: number;
  alightingsCount: number;
  recordedAt: Date;
  hourOfDay: number;
  dayOfWeek: number;
  fareCollectionAmount?: number;
  isSimulated: boolean;
  dataClassification: DataClassification;
  provenance: IDataProvenance;
  createdAt: Date;
  updatedAt: Date;
}

export type PassengerDemandRecordDocument = Document & IPassengerDemandRecord;

const passengerDemandRecordSchema = new Schema<PassengerDemandRecordDocument>(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    stopId: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
      required: true,
      index: true
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      index: true
    },
    directionId: {
      type: Schema.Types.ObjectId,
      ref: 'RouteDirection',
      index: true
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      index: true
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'DeviceRegistry',
      index: true
    },
    etmTransactionBatchId: {
      type: String,
      index: true
    },
    boardingsCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    alightingsCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    recordedAt: {
      type: Date,
      required: true,
      index: true
    },
    hourOfDay: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
      index: true
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      index: true
    },
    fareCollectionAmount: {
      type: Number,
      min: 0
    },
    isSimulated: {
      type: Boolean,
      default: false
    },
    dataClassification: {
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
      default: 'PENDING_VERIFICATION',
      index: true
    },
    provenance: {
      type: dataProvenanceSchema,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'passenger_demand_records'
  }
);

passengerDemandRecordSchema.index({ routeId: 1, recordedAt: -1 });
passengerDemandRecordSchema.index({ stopId: 1, recordedAt: -1 });
passengerDemandRecordSchema.index({ routeId: 1, stopId: 1, hourOfDay: 1 });

export const PassengerDemandRecord = model<PassengerDemandRecordDocument>(
  'PassengerDemandRecord',
  passengerDemandRecordSchema
);

