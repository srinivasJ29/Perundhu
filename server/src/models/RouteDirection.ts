import { Schema, model, Document, Model, Types } from 'mongoose';
import { GeoJsonLineString, GeoJsonLineStringSchema } from './geojson';

export type DirectionCode = 'OUTBOUND' | 'INBOUND';

export interface IRouteDirection {
  routeId: Types.ObjectId;
  directionCode: DirectionCode;
  originStandId?: Types.ObjectId;
  destinationStandId?: Types.ObjectId;
  originStopId: Types.ObjectId;
  destinationStopId: Types.ObjectId;
  totalDistanceKm: number;
  estimatedDurationMins: number;
  routePolyline: GeoJsonLineString;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RouteDirectionDocument = Document & IRouteDirection;

const routeDirectionSchema = new Schema<RouteDirectionDocument>(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route reference is required'],
      index: true
    },
    directionCode: {
      type: String,
      enum: {
        values: ['OUTBOUND', 'INBOUND'],
        message: 'Direction must be OUTBOUND or INBOUND'
      },
      required: [true, 'Direction code is required']
    },
    originStandId: {
      type: Schema.Types.ObjectId,
      ref: 'BusStand',
      default: undefined
    },
    destinationStandId: {
      type: Schema.Types.ObjectId,
      ref: 'BusStand',
      default: undefined
    },
    originStopId: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
      required: [true, 'Origin stop reference is required']
    },
    destinationStopId: {
      type: Schema.Types.ObjectId,
      ref: 'Stop',
      required: [true, 'Destination stop reference is required']
    },
    totalDistanceKm: {
      type: Number,
      required: [true, 'Total distance in km is required'],
      min: [0.1, 'Total distance must be at least 0.1 km']
    },
    estimatedDurationMins: {
      type: Number,
      required: [true, 'Estimated duration in minutes is required'],
      min: [1, 'Estimated duration must be at least 1 minute']
    },
    routePolyline: {
      type: GeoJsonLineStringSchema,
      required: [true, 'Route polyline geometry is required']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'route_directions'
  }
);

routeDirectionSchema.index({ routeId: 1, directionCode: 1 }, { unique: true });
routeDirectionSchema.index({ routePolyline: '2dsphere' });

export const RouteDirection: Model<RouteDirectionDocument> =
  model<RouteDirectionDocument>('RouteDirection', routeDirectionSchema);
