import { Schema, model, Document, Model, Types } from 'mongoose';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface ITripStopTime {
  tripId: Types.ObjectId;
  stopId: Types.ObjectId;
  stopSequence: number;
  scheduledArrivalTime: string;   // HH:mm
  scheduledDepartureTime: string; // HH:mm
  createdAt: Date;
  updatedAt: Date;
}

export type TripStopTimeDocument = Document & ITripStopTime;

const tripStopTimeSchema = new Schema<TripStopTimeDocument>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTrip',
      required: [true, 'Trip reference is required'],
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
      required: [true, 'Stop sequence is required'],
      min: [1, 'Stop sequence must be >= 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Stop sequence must be an integer'
      }
    },
    scheduledArrivalTime: {
      type: String,
      required: [true, 'Scheduled arrival time is required'],
      validate: {
        validator: (v: string) => TIME_REGEX.test(v),
        message: 'Scheduled arrival time must be in HH:mm 24-hour format'
      }
    },
    scheduledDepartureTime: {
      type: String,
      required: [true, 'Scheduled departure time is required'],
      validate: {
        validator: (v: string) => TIME_REGEX.test(v),
        message: 'Scheduled departure time must be in HH:mm 24-hour format'
      }
    }
  },
  {
    timestamps: true,
    collection: 'trip_stop_times'
  }
);

tripStopTimeSchema.index({ tripId: 1, stopSequence: 1 }, { unique: true });
tripStopTimeSchema.index({ tripId: 1, stopId: 1 });
tripStopTimeSchema.index({ stopId: 1, scheduledDepartureTime: 1 });

export const TripStopTime: Model<TripStopTimeDocument> =
  model<TripStopTimeDocument>('TripStopTime', tripStopTimeSchema);
