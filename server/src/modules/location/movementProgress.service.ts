import { env } from '../../config/env';
import { haversineDistanceMeters } from './geoMath';
import { LocationObservation, MovementProgressResult } from './location.types';

export interface MovementProgressOptions {
  maxSpeedKmph?: number;
  maxProgressJumpMeters?: number;
  maxBackwardMeters?: number;
}

export class MovementProgressService {
  private maxSpeedKmph: number;
  private maxProgressJumpMeters: number;
  private maxBackwardMeters: number;

  constructor(options?: MovementProgressOptions) {
    this.maxSpeedKmph = options?.maxSpeedKmph ?? env.LOCATION_MAX_SPEED_KMPH;
    this.maxProgressJumpMeters =
      options?.maxProgressJumpMeters ?? env.LOCATION_MAX_PROGRESS_JUMP_METERS;
    this.maxBackwardMeters =
      options?.maxBackwardMeters ?? env.LOCATION_MAX_BACKWARD_METERS;
  }

  /**
   * Evaluates movement progress and kinematic consistency between a candidate observation
   * and the previous accepted observation for the same bus and trip.
   */
  public evaluateProgress(
    candidate: LocationObservation,
    previous?: LocationObservation | null
  ): MovementProgressResult {
    const candidateDistanceAlongRoute = candidate.distanceAlongRouteMeters ?? 0;
    const totalRouteDistance = candidate.totalRouteDistanceMeters ?? 0;
    const progressRatio =
      totalRouteDistance > 0
        ? Math.min(1, Math.max(0, candidateDistanceAlongRoute / totalRouteDistance))
        : candidate.progressRatio ?? 0;

    // Initial position policy: No prior accepted observation for this trip
    if (!previous) {
      return {
        isValidMovement: true,
        distanceTraveledMeters: 0,
        elapsedSeconds: 0,
        effectiveSpeedKmph: candidate.speedKmph,
        progressRatio
      };
    }

    // Verify trip consistency: If previous observation was for a different trip, treat as new baseline
    if (
      candidate.tripId &&
      previous.tripId &&
      candidate.tripId.toString() !== previous.tripId.toString()
    ) {
      return {
        isValidMovement: true,
        distanceTraveledMeters: 0,
        elapsedSeconds: 0,
        effectiveSpeedKmph: candidate.speedKmph,
        progressRatio
      };
    }

    // 1. Timestamp Ordering Check
    const elapsedMs = candidate.recordedAt.getTime() - previous.recordedAt.getTime();
    if (elapsedMs <= 0) {
      return {
        isValidMovement: false,
        distanceTraveledMeters: 0,
        elapsedSeconds: 0,
        effectiveSpeedKmph: 0,
        progressRatio,
        anomaly: 'OUT_OF_ORDER_TIMESTAMP',
        warning: `Candidate timestamp ${candidate.recordedAt.toISOString()} is not strictly newer than previous ${previous.recordedAt.toISOString()}`
      };
    }

    const elapsedSeconds = elapsedMs / 1000;

    // 2. Physical Spatial Distance Calculation
    const candCoord = candidate.location.coordinates as [number, number];
    const prevCoord = previous.location.coordinates as [number, number];
    const physicalDistanceMeters = haversineDistanceMeters(prevCoord, candCoord);

    // Calculate effective physical speed in km/h
    const effectiveSpeedKmph = Math.round((physicalDistanceMeters / elapsedSeconds) * 3.6 * 10) / 10;

    // 3. Implausible Jump / Kinematic Teleportation Anomaly Check
    // A jump is flagged if speed exceeds physical maximum AND distance exceeds allowed single-step tolerance
    if (
      effectiveSpeedKmph > this.maxSpeedKmph &&
      physicalDistanceMeters > this.maxProgressJumpMeters
    ) {
      return {
        isValidMovement: false,
        distanceTraveledMeters: physicalDistanceMeters,
        elapsedSeconds,
        effectiveSpeedKmph,
        progressRatio,
        anomaly: 'IMPLAUSIBLE_JUMP',
        warning: `Implausible jump of ${physicalDistanceMeters}m in ${elapsedSeconds}s (implied speed: ${effectiveSpeedKmph} km/h > max ${this.maxSpeedKmph} km/h)`
      };
    }

    // 4. Along-Route Backward Progress Check
    if (
      candidate.distanceAlongRouteMeters !== undefined &&
      previous.distanceAlongRouteMeters !== undefined &&
      totalRouteDistance > 0
    ) {
      const prevAlongRoute = previous.distanceAlongRouteMeters;
      const currAlongRoute = candidate.distanceAlongRouteMeters;
      const deltaAlongRoute = currAlongRoute - prevAlongRoute;

      // Check for legitimate terminal loop wrap-around:
      // (previous was near destination end > 80% and candidate is near origin < 20%)
      const isLoopWrapAround =
        prevAlongRoute > 0.8 * totalRouteDistance && currAlongRoute < 0.2 * totalRouteDistance;

      if (!isLoopWrapAround && deltaAlongRoute < -this.maxBackwardMeters) {
        return {
          isValidMovement: false,
          distanceTraveledMeters: physicalDistanceMeters,
          elapsedSeconds,
          effectiveSpeedKmph,
          progressRatio,
          anomaly: 'BACKWARD_MOVEMENT',
          warning: `Significant backward progress detected: ${Math.round(deltaAlongRoute)}m (tolerance: ${this.maxBackwardMeters}m)`
        };
      }
    }

    return {
      isValidMovement: true,
      distanceTraveledMeters: physicalDistanceMeters,
      elapsedSeconds,
      effectiveSpeedKmph,
      progressRatio
    };
  }
}

export const movementProgressService = new MovementProgressService();
