import { Schema, model, Document, Model, Types } from 'mongoose';
import { GeoJsonPoint, GeoJsonPointSchema } from './geojson';

export type LocationSource =
  | 'SIMULATOR'
  | 'AUTHORIZED_MOBILE_GPS'
  | 'VEHICLE_HARDWARE_GPS'
  | 'OFFICIAL_FLEET_FEED';

export type TrackingStatus =
  | 'SIMULATED'
  | 'LIVE'
  | 'DELAYED'
  | 'STALE'
  | 'OFFLINE'
  | 'DEVIATED'
  | 'UNAVAILABLE';

export type PositionValidationStatus = 'VALID' | 'SUSPECT' | 'INVALID';

export interface ILatestBusPosition {
  busId: Types.ObjectId;
  tripId?: Types.ObjectId;
  routeId?: Types.ObjectId;
  directionId?: Types.ObjectId;
  location: GeoJsonPoint;
  snappedLocation?: GeoJsonPoint;
  crossTrackDistanceMeters?: number;
  distanceAlongRouteMeters?: number;
  totalRouteDistanceMeters?: number;
  progressRatio?: number;
  heading: number;
  speedKmph: number;
  accuracyMeters: number;
  source: LocationSource;
  sourceDeviceId?: string;
  trackingStatus: TrackingStatus;
  validationStatus: PositionValidationStatus;
  validationErrors: string[];
  lastStopPassedId?: Types.ObjectId;
  nextUpcomingStopId?: Types.ObjectId;
  nextStopEtaMinutes?: number;
  recordedAt: Date;
  receivedAt: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type LatestBusPositionDocument = Document & ILatestBusPosition;

const latestBusPositionSchema = new Schema<LatestBusPositionDocument>(
  {
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required']
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      default: undefined,
      index: true
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      default: undefined,
      index: true
    },
    directionId: {
      type: Schema.Types.ObjectId,
      ref: 'RouteDirection',
      default: undefined
    },
    location: {
      type: GeoJsonPointSchema,
      required: [true, 'Bus coordinate location is required']
    },
    snappedLocation: {
      type: GeoJsonPointSchema,
      default: undefined
    },
    crossTrackDistanceMeters: {
      type: Number,
      min: [0, 'Cross-track distance must be non-negative'],
      default: undefined
    },
    distanceAlongRouteMeters: {
      type: Number,
      min: [0, 'Distance along route must be non-negative'],
      default: undefined
    },
    totalRouteDistanceMeters: {
      type: Number,
      min: [0, 'Total route distance must be non-negative'],
      default: undefined
    },
    progressRatio: {
      type: Number,
      min: [0, 'Progress ratio must be between 0 and 1'],
      max: [1, 'Progress ratio must be between 0 and 1'],
      default: undefined
    },
    heading: {
      type: Number,
      default: 0,
      min: [0, 'Heading must be between 0 and 360 degrees'],
      max: [360, 'Heading must be between 0 and 360 degrees']
    },
    speedKmph: {
      type: Number,
      default: 0,
      min: [0, 'Speed must be non-negative'],
      max: [200, 'Speed exceeds plausible vehicle limits']
    },
    accuracyMeters: {
      type: Number,
      default: 5,
      min: [0, 'Accuracy must be non-negative']
    },
    source: {
      type: String,
      enum: {
        values: [
          'SIMULATOR',
          'AUTHORIZED_MOBILE_GPS',
          'VEHICLE_HARDWARE_GPS',
          'OFFICIAL_FLEET_FEED'
        ],
        message: 'Invalid location source: {VALUE}'
      },
      required: [true, 'Location source is required']
    },
    sourceDeviceId: {
      type: String,
      trim: true,
      default: undefined
    },
    trackingStatus: {
      type: String,
      enum: {
        values: ['SIMULATED', 'LIVE', 'DELAYED', 'STALE', 'OFFLINE', 'DEVIATED', 'UNAVAILABLE'],
        message: 'Invalid tracking status: {VALUE}'
      },
      required: [true, 'Tracking status is required'],
      index: true
    },
    validationStatus: {
      type: String,
      enum: {
        values: ['VALID', 'SUSPECT', 'INVALID'],
        message: 'Invalid validation status: {VALUE}'
      },
      default: 'VALID'
    },
    validationErrors: {
      type: [String],
      default: []
    },
    lastStopPassedId: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
      default: undefined
    },
    nextUpcomingStopId: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
      default: undefined
    },
    nextStopEtaMinutes: {
      type: Number,
      min: [0, 'ETA minutes must be non-negative'],
      default: undefined
    },
    recordedAt: {
      type: Date,
      required: [true, 'Provider recorded timestamp is required'],
      index: true
    },
    receivedAt: {
      type: Date,
      required: [true, 'Server received timestamp is required']
    },
    version: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  {
    timestamps: true,
    collection: 'latest_bus_positions'
  }
);

latestBusPositionSchema.index({ busId: 1 }, { unique: true });
latestBusPositionSchema.index({ location: '2dsphere' });
latestBusPositionSchema.index({ routeId: 1, directionId: 1 });
latestBusPositionSchema.index({ recordedAt: -1 });

export const LatestBusPosition: Model<LatestBusPositionDocument> =
  model<LatestBusPositionDocument>('LatestBusPosition', latestBusPositionSchema);
