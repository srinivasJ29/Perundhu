import { Schema, model, Document, Model, Types } from 'mongoose';
import { GeoJsonPoint, GeoJsonPointSchema } from './geojson';
import { LocationSource } from './LatestBusPosition';

export interface ILocationHistory {
  busId: Types.ObjectId;
  tripId?: Types.ObjectId;
  location: GeoJsonPoint;
  heading: number;
  speedKmph: number;
  source: LocationSource;
  recordedAt: Date;
  expireAt: Date;
  createdAt: Date;
}

export type LocationHistoryDocument = Document & ILocationHistory;

const locationHistorySchema = new Schema<LocationHistoryDocument>(
  {
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required'],
      index: true
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      default: undefined
    },
    location: {
      type: GeoJsonPointSchema,
      required: [true, 'Location coordinate is required']
    },
    heading: {
      type: Number,
      default: 0
    },
    speedKmph: {
      type: Number,
      default: 0
    },
    source: {
      type: String,
      enum: [
        'SIMULATOR',
        'AUTHORIZED_MOBILE_GPS',
        'VEHICLE_HARDWARE_GPS',
        'OFFICIAL_FLEET_FEED',
        'ETM_GPS',
        'MANUAL_DISPATCH'
      ],
      required: [true, 'Location source is required']
    },
    recordedAt: {
      type: Date,
      required: [true, 'Recorded timestamp is required']
    },
    expireAt: {
      type: Date,
      required: [true, 'TTL expiration timestamp is required']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'location_history'
  }
);

// Native MongoDB TTL index: automatically purges documents after expireAt (default 24h rolling retention)
locationHistorySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
locationHistorySchema.index({ busId: 1, recordedAt: -1 });
locationHistorySchema.index({ location: '2dsphere' });

export const LocationHistory: Model<LocationHistoryDocument> =
  model<LocationHistoryDocument>('LocationHistory', locationHistorySchema);
