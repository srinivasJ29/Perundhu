import { Schema, model, Document, Types } from 'mongoose';
import { IDataProvenance, dataProvenanceSchema } from './DataProvenance';

export type RecommendationCategory =
  | 'DEPOT_IMBALANCE'
  | 'ROUTE_DELAY'
  | 'INSUFFICIENT_COVERAGE'
  | 'ALLOCATION_IMPROVEMENT'
  | 'GPS_COVERAGE_GAP'
  | 'DATA_COLLECTION_GAP';

export type RecommendationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HumanReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEFERRED';
export type TargetEntityType = 'DEPOT' | 'ROUTE' | 'BUS' | 'STOP' | 'SYSTEM';

export interface IReviewHistoryItem {
  status: HumanReviewStatus;
  reviewedBy: string;
  reviewerRole: string;
  decisionNotes?: string;
  timestamp: Date;
}

export interface IOptimizationRecommendation {
  recommendationId: string;
  title: string;
  titleTa: string;
  category: RecommendationCategory;
  severity: RecommendationSeverity;
  targetEntityType: TargetEntityType;
  targetEntityId?: Types.ObjectId;
  targetEntityCode?: string;
  targetEntityName?: string;
  description: string;
  descriptionTa: string;
  supportingObservations: string[];
  dataSource: string[];
  evidencePeriod: {
    from: Date;
    to: Date;
    sampleSize: number;
    unit: string;
  };
  confidenceScore: number;
  expectedBenefit: string;
  expectedBenefitTa: string;
  risksAndAssumptions: string;
  humanReviewStatus: HumanReviewStatus;
  reviewHistory: IReviewHistoryItem[];
  appliedAction?: {
    isApplied: boolean;
    appliedAt?: Date;
    appliedBy?: string;
    appliedNotes?: string;
  };
  provenance: IDataProvenance;
  createdAt: Date;
  updatedAt: Date;
}

export type OptimizationRecommendationDocument = Document & IOptimizationRecommendation;

const reviewHistoryItemSchema = new Schema<IReviewHistoryItem>(
  {
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED'],
      required: true
    },
    reviewedBy: {
      type: String,
      required: true
    },
    reviewerRole: {
      type: String,
      required: true
    },
    decisionNotes: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const optimizationRecommendationSchema = new Schema<OptimizationRecommendationDocument>(
  {
    recommendationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    titleTa: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        'DEPOT_IMBALANCE',
        'ROUTE_DELAY',
        'INSUFFICIENT_COVERAGE',
        'ALLOCATION_IMPROVEMENT',
        'GPS_COVERAGE_GAP',
        'DATA_COLLECTION_GAP'
      ],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true
    },
    targetEntityType: {
      type: String,
      enum: ['DEPOT', 'ROUTE', 'BUS', 'STOP', 'SYSTEM'],
      required: true
    },
    targetEntityId: {
      type: Schema.Types.ObjectId,
      index: true
    },
    targetEntityCode: {
      type: String,
      trim: true
    },
    targetEntityName: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    descriptionTa: {
      type: String,
      required: true,
      trim: true
    },
    supportingObservations: {
      type: [String],
      default: []
    },
    dataSource: {
      type: [String],
      default: []
    },
    evidencePeriod: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
      sampleSize: { type: Number, required: true },
      unit: { type: String, required: true, default: 'observations' }
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    expectedBenefit: {
      type: String,
      required: true
    },
    expectedBenefitTa: {
      type: String,
      required: true
    },
    risksAndAssumptions: {
      type: String,
      required: true
    },
    humanReviewStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'DEFERRED'],
      default: 'PENDING',
      index: true
    },
    reviewHistory: {
      type: [reviewHistoryItemSchema],
      default: []
    },
    appliedAction: {
      isApplied: { type: Boolean, default: false },
      appliedAt: { type: Date },
      appliedBy: { type: String },
      appliedNotes: { type: String }
    },
    provenance: {
      type: dataProvenanceSchema,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'optimization_recommendations'
  }
);

optimizationRecommendationSchema.index({ category: 1, humanReviewStatus: 1 });
optimizationRecommendationSchema.index({ createdAt: -1 });

export const OptimizationRecommendation = model<OptimizationRecommendationDocument>(
  'OptimizationRecommendation',
  optimizationRecommendationSchema
);

