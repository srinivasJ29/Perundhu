import { Schema, model, Document, Model, Types } from 'mongoose';

export type ServiceCategory = 'TOWN_SERVICE' | 'MOFUSSIL' | 'EXPRESS';

export interface IRoute {
  districtId: Types.ObjectId;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  serviceCategory: ServiceCategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RouteDocument = Document & IRoute;

const routeSchema = new Schema<RouteDocument>(
  {
    districtId: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District reference is required'],
      index: true
    },
    routeNumber: {
      type: String,
      required: [true, 'Route number is required'],
      uppercase: true,
      trim: true,
      minlength: 1,
      maxlength: 20
    },
    displayTitleEn: {
      type: String,
      required: [true, 'English display title is required'],
      trim: true
    },
    displayTitleTa: {
      type: String,
      required: [true, 'Tamil display title is required'],
      trim: true
    },
    serviceCategory: {
      type: String,
      enum: {
        values: ['TOWN_SERVICE', 'MOFUSSIL', 'EXPRESS'],
        message: 'Invalid service category: {VALUE}'
      },
      default: 'TOWN_SERVICE'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'routes'
  }
);

routeSchema.index({ districtId: 1, routeNumber: 1 }, { unique: true });
routeSchema.index({ routeNumber: 1 });

export const Route: Model<RouteDocument> = model<RouteDocument>('Route', routeSchema);
