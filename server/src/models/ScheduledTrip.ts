import { Schema, model, Document, Model, Types } from 'mongoose';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface IScheduledTrip {
  tripCode: string;
  routeDirectionId: Types.ObjectId;
  busId?: Types.ObjectId;
  departureTime: string; // HH:mm
  arrivalTime: string;   // HH:mm
  operationalDays: DayOfWeek[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ScheduledTripDocument = Document & IScheduledTrip;

const scheduledTripSchema = new Schema<ScheduledTripDocument>(
  {
    tripCode: {
      type: String,
      required: [true, 'Trip code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40
    },
    routeDirectionId: {
      type: Schema.Types.ObjectId,
      ref: 'RouteDirection',
      required: [true, 'Route direction reference is required'],
      index: true
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      default: undefined,
      index: true
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      validate: {
        validator: (v: string) => TIME_REGEX.test(v),
        message: 'Departure time must be in HH:mm 24-hour format (e.g., 08:30)'
      }
    },
    arrivalTime: {
      type: String,
      required: [true, 'Arrival time is required'],
      validate: {
        validator: (v: string) => TIME_REGEX.test(v),
        message: 'Arrival time must be in HH:mm 24-hour format (e.g., 09:25)'
      }
    },
    operationalDays: {
      type: [String],
      enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      default: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'scheduled_trips'
  }
);

scheduledTripSchema.index({ routeDirectionId: 1, departureTime: 1 });

export const ScheduledTrip: Model<ScheduledTripDocument> =
  model<ScheduledTripDocument>('ScheduledTrip', scheduledTripSchema);
