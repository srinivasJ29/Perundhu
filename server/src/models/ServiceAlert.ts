/**
 * PERUNDHU (பேருந்து) — Service Alert & Transit Advisory Model
 * Represents verified transport announcements, route diversions, service disruptions,
 * and festival special operations issued by TNSTC or District Administration.
 */

import { Schema, model, Document, Types } from 'mongoose';

export type AlertType =
  | 'ADVISORY'
  | 'DISRUPTION'
  | 'ROUTE_DIVERSION'
  | 'FESTIVAL_SPECIAL'
  | 'WEATHER_NOTICE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface IServiceAlert extends Document {
  _id: Types.ObjectId;
  titleEn: string;
  titleTa: string;
  descriptionEn: string;
  descriptionTa: string;
  alertType: AlertType;
  severity: AlertSeverity;
  districtCode: string; // e.g. 'MDU'
  affectedRouteNumbers: string[]; // e.g. ['70', '77']
  affectedStandCodes?: string[]; // e.g. ['MDU-PERIYAR', 'MDU-MGR']
  effectiveFrom: Date;
  effectiveUntil: Date;
  isActive: boolean;
  sourceOrganization: string; // e.g. 'TNSTC (Madurai) Limited'
  sourceUrl?: string;
  verifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceAlertSchema = new Schema<IServiceAlert>(
  {
    titleEn: { type: String, required: true, trim: true },
    titleTa: { type: String, required: true, trim: true },
    descriptionEn: { type: String, required: true, trim: true },
    descriptionTa: { type: String, required: true, trim: true },
    alertType: {
      type: String,
      required: true,
      enum: [
        'ADVISORY',
        'DISRUPTION',
        'ROUTE_DIVERSION',
        'FESTIVAL_SPECIAL',
        'WEATHER_NOTICE'
      ],
      default: 'ADVISORY'
    },
    severity: {
      type: String,
      required: true,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      default: 'INFO'
    },
    districtCode: { type: String, required: true, trim: true, uppercase: true, index: true },
    affectedRouteNumbers: [{ type: String, trim: true }],
    affectedStandCodes: [{ type: String, trim: true }],
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveUntil: { type: Date, required: true, index: true },
    isActive: { type: Boolean, required: true, default: true, index: true },
    sourceOrganization: { type: String, required: true, trim: true },
    sourceUrl: { type: String, trim: true },
    verifiedAt: { type: Date, required: true, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

ServiceAlertSchema.index({ districtCode: 1, isActive: 1, effectiveUntil: 1 });
ServiceAlertSchema.index({ affectedRouteNumbers: 1, isActive: 1 });

export const ServiceAlert = model<IServiceAlert>('ServiceAlert', ServiceAlertSchema);

