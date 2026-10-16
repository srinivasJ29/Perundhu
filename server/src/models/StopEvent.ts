import { Schema, model, Document, Model, Types } from 'mongoose';
import { LocationSource, TrackingStatus } from './LatestBusPosition';

export type StopEventType =
  | 'APPROACHING'
  | 'ARRIVED'
  | 'DEPARTED'
  | 'TERMINAL_REACHED'
  | 'UNKNOWN';

export interface IStopEvent {
  tripId: Types.ObjectId;
  busId: Types.ObjectId;
  stopId: Types.ObjectId;
  stopSequence: number;
  eventType: StopEventType;
  distanceToStopMeters: number;
  recordedAt: Date;
  source: LocationSource;
  trackingStatus: TrackingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type StopEventDocument = Document & IStopEvent;

const stopEventSchema = new Schema<StopEventDocument>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      required: [true, 'Trip reference is required'],
      index: true
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required'],
      index: true
    },
    stopId: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
      required: [true, 'Stop reference is required'],
      index: true
    },
    stopSequence: {
      type: Number,
      required: [true, 'Stop sequence index is required'],
      min: [1, 'Stop sequence must be >= 1']
    },
    eventType: {
      type: String,
      enum: {
        values: ['APPROACHING', 'ARRIVED', 'DEPARTED', 'TERMINAL_REACHED', 'UNKNOWN'],
        message: 'Invalid stop event type: {VALUE}'
      },
      required: [true, 'Event type is required']
    },
    distanceToStopMeters: {
      type: Number,
      required: [true, 'Distance to stop is required'],
      min: [0, 'Distance must be non-negative']
    },
    recordedAt: {
      type: Date,
      required: [true, 'Recorded timestamp is required']
    },
    source: {
      type: String,
      enum: [
        'SIMULATOR',
        'AUTHORIZED_MOBILE_GPS',
        'VEHICLE_HARDWARE_GPS',
        'OFFICIAL_FLEET_FEED'
      ],
      required: [true, 'Location source is required']
    },
    trackingStatus: {
      type: String,
      enum: [
        'SIMULATED',
        'LIVE',
        'DELAYED',
        'STALE',
        'OFFLINE',
        'DEVIATED',
        'UNAVAILABLE'
      ],
      required: [true, 'Tracking status is required']
    }
  },
  {
    timestamps: true,
    collection: 'stop_events'
  }
);

// Idempotent uniqueness: one event per eventType per stopSequence per trip
stopEventSchema.index({ tripId: 1, stopSequence: 1, eventType: 1 }, { unique: true });
stopEventSchema.index({ busId: 1, recordedAt: -1 });
stopEventSchema.index({ tripId: 1, recordedAt: -1 });

export const StopEvent: Model<StopEventDocument> = model<StopEventDocument>(
  'StopEvent',
  stopEventSchema
);
