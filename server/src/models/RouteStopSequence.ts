import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IRouteStopSequence {
  directionId: Types.ObjectId;
  stopId: Types.ObjectId;
  sequenceOrder: number;
  distanceFromOriginKm: number;
  cumulativeDurationMinutes: number;
  isFareStage: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RouteStopSequenceDocument = Document & IRouteStopSequence;

const routeStopSequenceSchema = new Schema<RouteStopSequenceDocument>(
  {
    directionId: {
      type: Schema.Types.ObjectId,
      ref: 'RouteDirection',
      required: [true, 'Route direction reference is required'],
      index: true
    },
    stopId: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
      required: [true, 'Stop reference is required'],
      index: true
    },
    sequenceOrder: {
      type: Number,
      required: [true, 'Sequence order is required'],
      min: [1, 'Sequence order must be >= 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Sequence order must be an integer'
      }
    },
    distanceFromOriginKm: {
      type: Number,
      required: [true, 'Distance from origin is required'],
      min: [0, 'Distance must be >= 0']
    },
    cumulativeDurationMinutes: {
      type: Number,
      required: [true, 'Cumulative duration is required'],
      min: [0, 'Cumulative duration must be >= 0']
    },
    isFareStage: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'route_stop_sequences'
  }
);

// Compound unique index ensuring no two stops occupy the same sequenceOrder for a direction
routeStopSequenceSchema.index({ directionId: 1, sequenceOrder: 1 }, { unique: true });

// Non-unique compound index to quickly find occurrences of a stop along a direction (supporting legitimate repeated stops)
routeStopSequenceSchema.index({ directionId: 1, stopId: 1 });

export const RouteStopSequence: Model<RouteStopSequenceDocument> =
  model<RouteStopSequenceDocument>('RouteStopSequence', routeStopSequenceSchema);
