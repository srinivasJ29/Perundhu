import { env } from '../../config/env';
import { TrackingStatus, LocationSource } from '../../models/LatestBusPosition';
import { FreshnessClassification, LocationObservation } from './location.types';

export interface FreshnessOptions {
  freshnessThresholdMs?: number;
  staleThresholdMs?: number;
  maxFutureSkewMs?: number;
  clock?: () => number;
}

export interface FreshnessEvaluation {
  classification: FreshnessClassification;
  ageMs: number;
  ageSeconds: number;
  assignedTrackingStatus: TrackingStatus;
  isFresh: boolean;
  isDelayed: boolean;
  isStale: boolean;
  isFuture: boolean;
}

export class FreshnessService {
  private freshnessThresholdMs: number;
  private staleThresholdMs: number;
  private maxFutureSkewMs: number;
  private clock: () => number;

  constructor(options?: FreshnessOptions) {
    this.freshnessThresholdMs =
      options?.freshnessThresholdMs ?? env.LOCATION_FRESHNESS_THRESHOLD_MS;
    this.staleThresholdMs =
      options?.staleThresholdMs ?? env.LOCATION_STALE_THRESHOLD_MS;
    this.maxFutureSkewMs =
      options?.maxFutureSkewMs ?? env.LOCATION_MAX_FUTURE_SKEW_MS;
    this.clock = options?.clock ?? (() => Date.now());
  }

  /**
   * Evaluates the temporal freshness of an observation timestamp against current time.
   * Maps freshness and source to an appropriate domain TrackingStatus.
   */
  public evaluateObservation(obs: LocationObservation): FreshnessEvaluation {
    return this.evaluateTimestamp(obs.recordedAt, obs.source, obs.trackingStatus);
  }

  /**
   * Core timestamp evaluation logic using the injectable clock.
   */
  public evaluateTimestamp(
    recordedAt: Date,
    source: LocationSource,
    currentStatus?: TrackingStatus
  ): FreshnessEvaluation {
    const now = this.clock();
    const ageMs = now - recordedAt.getTime();
    const ageSeconds = Math.round((ageMs / 1000) * 10) / 10;

    let classification: FreshnessClassification;
    let isFresh = false;
    let isDelayed = false;
    let isStale = false;
    let isFuture = false;

    // 1. Clock skew check: timestamp exceeds future tolerance
    if (ageMs < -this.maxFutureSkewMs) {
      classification = 'FUTURE_REJECTED';
      isFuture = true;
    } else if (ageMs <= this.freshnessThresholdMs) {
      classification = 'FRESH';
      isFresh = true;
    } else if (ageMs <= this.staleThresholdMs) {
      classification = 'DELAYED';
      isDelayed = true;
    } else {
      classification = 'STALE';
      isStale = true;
    }

    // 2. Map classification and source to schema TrackingStatus
    let assignedTrackingStatus: TrackingStatus;

    if (currentStatus === 'OFFLINE' || currentStatus === 'UNAVAILABLE') {
      // Maintain explicit operational offline/unavailable state
      assignedTrackingStatus = currentStatus;
    } else if (source === 'SIMULATOR') {
      // Simulated observations are NEVER marked LIVE
      assignedTrackingStatus = isStale ? 'STALE' : 'SIMULATED';
    } else {
      // Real physical GPS telemetry
      if (isStale) {
        assignedTrackingStatus = 'STALE';
      } else if (isDelayed) {
        assignedTrackingStatus = 'DELAYED';
      } else {
        assignedTrackingStatus = 'LIVE';
      }
    }

    return {
      classification,
      ageMs,
      ageSeconds,
      assignedTrackingStatus,
      isFresh,
      isDelayed,
      isStale,
      isFuture
    };
  }
}

export const freshnessService = new FreshnessService();
