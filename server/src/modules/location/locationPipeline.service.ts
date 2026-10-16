import { logger } from '../../common/logger';
import {
  LocationObservation,
  PipelineProcessingResult,
  RouteSnappingResult,
  MovementProgressResult
} from './location.types';
import {
  PositionValidationService,
  positionValidationService
} from './positionValidation.service';
import { FreshnessService, freshnessService } from './freshness.service';
import {
  RouteMatchingService,
  routeMatchingService
} from './routeMatching.service';
import {
  MovementProgressService,
  movementProgressService
} from './movementProgress.service';
import { LocationRepository, locationRepository } from './location.repository';
import { realtimeTrackingService } from '../realtime/realtime.service';

export interface PipelineOptions {
  verifyDatabase?: boolean;
  persistToHistory?: boolean;
  routePolylineCoordinates?: [number, number][];
}

export type AcceptedObservationListener = (
  result: PipelineProcessingResult
) => Promise<void> | void;

export class LocationPipelineService {
  private acceptedListeners: AcceptedObservationListener[] = [];

  constructor(
    private readonly validator: PositionValidationService = positionValidationService,
    private readonly freshness: FreshnessService = freshnessService,
    private readonly routeMatcher: RouteMatchingService = routeMatchingService,
    private readonly progressTracker: MovementProgressService = movementProgressService,
    private readonly repository: LocationRepository = locationRepository
  ) {}

  public onObservationAccepted(listener: AcceptedObservationListener): () => void {
    this.acceptedListeners.push(listener);
    return () => {
      this.acceptedListeners = this.acceptedListeners.filter((l) => l !== listener);
    };
  }

  public notifyAcceptedListeners(result: PipelineProcessingResult): void {
    for (const listener of this.acceptedListeners) {
      try {
        const promiseOrVoid = listener(result);
        if (promiseOrVoid instanceof Promise) {
          promiseOrVoid.catch((err) =>
            logger.error({ err }, 'Error in accepted observation listener')
          );
        }
      } catch (err) {
        logger.error({ err }, 'Error in accepted observation listener');
      }
    }
  }

  /**
   * Universal ingestion pipeline for location observations:
   * 1. Structural validation (finite lat/lon, range, speed, heading, source).
   * 2. Freshness evaluation (age, clock-skew, mapping to tracking status).
   * 3. Route snapping & cross-track deviation detection.
   * 4. Movement progress & kinematic anomaly detection.
   * 5. Concurrency-safe atomic persistence.
   */
  public async processObservation(
    observation: LocationObservation,
    options?: PipelineOptions
  ): Promise<PipelineProcessingResult> {
    const busIdStr = observation.busId.toString();

    // -------------------------------------------------------------------------
    // Stage 1: Structural & Schema Validation
    // -------------------------------------------------------------------------
    const validationResult = await this.validator.validateObservation(observation, {
      verifyDatabase: options?.verifyDatabase
    });

    if (!validationResult.isValid) {
      logger.warn(
        {
          busId: busIdStr,
          errors: validationResult.errors,
          code: validationResult.errorCode
        },
        'Location observation rejected: failed structural validation'
      );

      return {
        accepted: false,
        observation,
        validationResult,
        freshness: {
          classification: 'FUTURE_REJECTED',
          ageMs: 0
        },
        persistedLatest: false,
        persistedHistory: false,
        rejectionReason: validationResult.errors.join('; ')
      };
    }

    // -------------------------------------------------------------------------
    // Stage 2: Temporal Freshness Evaluation
    // -------------------------------------------------------------------------
    const freshnessEval = this.freshness.evaluateObservation(observation);

    if (freshnessEval.isFuture) {
      logger.warn(
        { busId: busIdStr, ageMs: freshnessEval.ageMs },
        'Location observation rejected: timestamp exceeds future clock skew tolerance'
      );

      return {
        accepted: false,
        observation,
        validationResult: {
          status: 'REJECTED',
          isValid: false,
          errors: ['Timestamp is in the future beyond acceptable clock skew'],
          warnings: validationResult.warnings,
          errorCode: 'FUTURE_TIMESTAMP_CLOCK_SKEW'
        },
        freshness: {
          classification: freshnessEval.classification,
          ageMs: freshnessEval.ageMs
        },
        persistedLatest: false,
        persistedHistory: false,
        rejectionReason: 'Timestamp is in the future beyond acceptable clock skew'
      };
    }

    // Apply assigned tracking status based on freshness and source
    observation.trackingStatus = freshnessEval.assignedTrackingStatus;

    // -------------------------------------------------------------------------
    // Stage 3: Retrieve Prior Accepted Position for Continuity & Snapping
    // -------------------------------------------------------------------------
    const previousAccepted = await this.repository.getLatestPositionByBusId(
      observation.busId
    );

    // -------------------------------------------------------------------------
    // Stage 4: Geospatial Route Matching & Snapping
    // -------------------------------------------------------------------------
    let snappingResult: RouteSnappingResult | undefined;
    const rawCoords = observation.location.coordinates as [number, number];

    if (options?.routePolylineCoordinates && options.routePolylineCoordinates.length > 0) {
      snappingResult = this.routeMatcher.matchCoordinates(
        rawCoords,
        options.routePolylineCoordinates,
        {
          previousProgressMeters: previousAccepted?.distanceAlongRouteMeters
        }
      );
    } else if (observation.directionId) {
      const matched = await this.routeMatcher.matchToRouteDirection(
        rawCoords,
        observation.directionId.toString(),
        previousAccepted?.distanceAlongRouteMeters
      );
      if (matched) {
        snappingResult = matched;
      }
    }

    if (snappingResult) {
      observation.snappedLocation = {
        type: 'Point',
        coordinates: snappingResult.snappedCoordinates
      };
      observation.crossTrackDistanceMeters = snappingResult.crossTrackDistanceMeters;
      observation.distanceAlongRouteMeters = snappingResult.alongRouteDistanceMeters;
      observation.totalRouteDistanceMeters = snappingResult.totalRouteDistanceMeters;
      observation.progressRatio = snappingResult.progressRatio;

      if (snappingResult.isOffRoute) {
        observation.trackingStatus = 'DEVIATED';
        observation.validationStatus = 'SUSPECT';
        observation.validationErrors = ['EXCESSIVE_CROSS_TRACK_DEVIATION'];
      }
    }

    // -------------------------------------------------------------------------
    // Stage 5: Movement Progress & Kinematic Anomaly Detection
    // -------------------------------------------------------------------------
    let progressResult: MovementProgressResult | undefined;

    if (previousAccepted) {
      progressResult = this.progressTracker.evaluateProgress(
        observation,
        previousAccepted
      );

      if (!progressResult.isValidMovement) {
        if (progressResult.anomaly === 'OUT_OF_ORDER_TIMESTAMP') {
          logger.debug(
            { busId: busIdStr, warning: progressResult.warning },
            'Observation rejected: out of order timestamp'
          );

          return {
            accepted: false,
            observation,
            validationResult: {
              status: 'STALE',
              isValid: false,
              errors: [progressResult.warning ?? 'Out of order timestamp'],
              warnings: validationResult.warnings,
              errorCode: 'OUT_OF_ORDER_TIMESTAMP'
            },
            freshness: {
              classification: freshnessEval.classification,
              ageMs: freshnessEval.ageMs
            },
            snappingResult,
            progressResult,
            persistedLatest: false,
            persistedHistory: false,
            rejectionReason: progressResult.warning
          };
        }

        // Anomaly detected (e.g. IMPLAUSIBLE_JUMP or BACKWARD_MOVEMENT):
        // Mark as SUSPECT rather than silently discarding
        observation.validationStatus = 'SUSPECT';
        observation.validationErrors = [
          ...(observation.validationErrors ?? []),
          progressResult.anomaly ?? 'MOVEMENT_ANOMALY'
        ];
      }
    }

    // Set default validation status if not already set
    if (!observation.validationStatus) {
      observation.validationStatus =
        validationResult.status === 'SUSPICIOUS' ? 'SUSPECT' : 'VALID';
    }

    // -------------------------------------------------------------------------
    // Stage 6: Persistence with Concurrency Guards
    // -------------------------------------------------------------------------
    const persistedLatest = await this.repository.saveLatestPosition(observation);
    let persistedHistory = false;

    if (persistedLatest && options?.persistToHistory) {
      persistedHistory = await this.repository.appendLocationHistory(observation);
    }

    const result: PipelineProcessingResult = {
      accepted: persistedLatest,
      observation,
      validationResult,
      freshness: {
        classification: freshnessEval.classification,
        ageMs: freshnessEval.ageMs
      },
      snappingResult,
      progressResult,
      persistedLatest,
      persistedHistory,
      rejectionReason: persistedLatest ? undefined : 'Persistence concurrency guard rejected write'
    };

    if (result.accepted) {
      this.notifyAcceptedListeners(result);
    }

    return result;
  }
}

export const locationPipelineService = new LocationPipelineService();

// Connect real-time tracking broadcaster to universal location pipeline
locationPipelineService.onObservationAccepted((result) => {
  realtimeTrackingService.broadcastAcceptedObservation(result);
});
