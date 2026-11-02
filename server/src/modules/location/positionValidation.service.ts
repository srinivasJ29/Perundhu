import { Types } from 'mongoose';
import { env } from '../../config/env';
import {
  LocationObservation,
  PositionValidationResult,
  ValidationOutcomeStatus
} from './location.types';
import { Bus, ScheduledTrip } from '../../models';

export interface PositionValidationOptions {
  maxFutureSkewMs?: number;
  maxSpeedKmph?: number;
  clock?: () => number;
  verifyDatabaseReferences?: boolean;
}

export class PositionValidationService {
  private maxFutureSkewMs: number;
  private maxSpeedKmph: number;
  private clock: () => number;

  constructor(options?: PositionValidationOptions) {
    this.maxFutureSkewMs = options?.maxFutureSkewMs ?? env.LOCATION_MAX_FUTURE_SKEW_MS;
    this.maxSpeedKmph = options?.maxSpeedKmph ?? env.LOCATION_MAX_SPEED_KMPH;
    this.clock = options?.clock ?? (() => Date.now());
  }

  /**
   * Performs structural and kinematic validation of an incoming location observation.
   * Returns a structured validation outcome with specific diagnostic error codes.
   */
  public async validateObservation(
    obs: LocationObservation,
    options?: { verifyDatabase?: boolean }
  ): Promise<PositionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let status: ValidationOutcomeStatus = 'VALID';
    let errorCode: string | undefined;

    // 1. Bus ID Reference Validation
    if (!obs.busId || !Types.ObjectId.isValid(obs.busId.toString())) {
      errors.push('Invalid or missing bus identifier');
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'INVALID_BUS_ID'
      };
    }

    // 2. Coordinate Finite and Range Validation (GeoJSON format: [longitude, latitude])
    if (!obs.location || !Array.isArray(obs.location.coordinates) || obs.location.coordinates.length < 2) {
      errors.push('Missing or invalid location GeoJSON coordinates');
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'INVALID_COORDINATES'
      };
    }

    const [lon, lat] = obs.location.coordinates;

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      errors.push(`Non-finite coordinates received: [${lon}, ${lat}]`);
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'NON_FINITE_COORDINATES'
      };
    }

    if (lon < -180 || lon > 180) {
      errors.push(`Longitude ${lon} is out of valid bounds [-180, 180]`);
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'LONGITUDE_OUT_OF_BOUNDS'
      };
    }

    if (lat < -90 || lat > 90) {
      errors.push(`Latitude ${lat} is out of valid bounds [-90, 90]`);
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'LATITUDE_OUT_OF_BOUNDS'
      };
    }

    // Tamil Nadu regional bounding box sanity check (Lat ~8.0N - 14.0N, Lon ~76.0E - 81.0E)
    if (lat < 7.5 || lat > 14.5 || lon < 75.5 || lon > 81.5) {
      warnings.push(`Coordinate [${lon}, ${lat}] lies outside the regional bounds of Tamil Nadu`);
    }

    // 3. Timestamp & Clock Skew Validation
    if (!obs.recordedAt || !(obs.recordedAt instanceof Date) || isNaN(obs.recordedAt.getTime())) {
      errors.push('Invalid or missing recordedAt timestamp');
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'INVALID_TIMESTAMP'
      };
    }

    const now = this.clock();
    const futureSkew = obs.recordedAt.getTime() - now;

    if (futureSkew > this.maxFutureSkewMs) {
      errors.push(
        `Recorded timestamp is in the future by ${futureSkew}ms (tolerance: ${this.maxFutureSkewMs}ms)`
      );
      return {
        status: 'REJECTED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'FUTURE_TIMESTAMP_CLOCK_SKEW'
      };
    }

    // 4. Speed & Heading Validation
    if (!Number.isFinite(obs.speedKmph) || obs.speedKmph < 0) {
      errors.push(`Invalid speed: ${obs.speedKmph} km/h`);
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'INVALID_SPEED'
      };
    }

    if (obs.speedKmph > this.maxSpeedKmph) {
      warnings.push(
        `Speed ${obs.speedKmph} km/h exceeds plausible limit of ${this.maxSpeedKmph} km/h`
      );
      status = 'SUSPICIOUS';
      errorCode = 'EXCESSIVE_SPEED';
    }

    if (!Number.isFinite(obs.heading) || obs.heading < 0 || obs.heading > 360) {
      errors.push(`Invalid heading: ${obs.heading} degrees (must be 0 - 360)`);
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'INVALID_HEADING'
      };
    }

    // 5. Source and Tracking Status Enums
    const validSources = [
      'SIMULATOR',
      'AUTHORIZED_MOBILE_GPS',
      'VEHICLE_HARDWARE_GPS',
      'OFFICIAL_FLEET_FEED',
      'ETM_GPS',
      'MANUAL_DISPATCH'
    ];
    if (!validSources.includes(obs.source)) {
      errors.push(`Invalid location source: ${obs.source}`);
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'INVALID_SOURCE'
      };
    }

    const validTrackingStatuses = [
      'SIMULATED',
      'LIVE',
      'DELAYED',
      'STALE',
      'OFFLINE',
      'DEVIATED',
      'UNAVAILABLE'
    ];
    if (!validTrackingStatuses.includes(obs.trackingStatus)) {
      errors.push(`Invalid tracking status: ${obs.trackingStatus}`);
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'INVALID_TRACKING_STATUS'
      };
    }

    // 6. Optional Trip Reference Validation
    if (obs.tripId && !Types.ObjectId.isValid(obs.tripId.toString())) {
      errors.push('Invalid trip identifier reference');
      return {
        status: 'MALFORMED',
        isValid: false,
        errors,
        warnings,
        errorCode: 'INVALID_TRIP_ID'
      };
    }

    // 7. Database Consistency Check (if requested)
    if (options?.verifyDatabase) {
      try {
        const bus = await Bus.findById(obs.busId).lean();
        if (!bus) {
          errors.push(`Referenced bus ${obs.busId} does not exist in database`);
          return {
            status: 'REJECTED',
            isValid: false,
            errors,
            warnings,
            errorCode: 'BUS_NOT_FOUND'
          };
        }

        if (bus.status === 'MAINTENANCE' || bus.status === 'OFFLINE') {
          warnings.push(`Bus ${obs.busId} is marked as ${bus.status}`);
          status = 'SUSPICIOUS';
        }

        if (obs.tripId) {
          const trip = await ScheduledTrip.findById(obs.tripId).lean();
          if (!trip) {
            errors.push(`Referenced trip ${obs.tripId} does not exist in database`);
            return {
              status: 'REJECTED',
              isValid: false,
              errors,
              warnings,
              errorCode: 'TRIP_NOT_FOUND'
            };
          }

          if (trip.busId && trip.busId.toString() !== obs.busId.toString()) {
            errors.push(
              `Trip ${obs.tripId} is assigned to bus ${trip.busId}, not bus ${obs.busId}`
            );
            return {
              status: 'REJECTED',
              isValid: false,
              errors,
              warnings,
              errorCode: 'TRIP_BUS_MISMATCH'
            };
          }
        }
      } catch {
        // If DB query fails during offline/mocked tests, log warning
        warnings.push('Database consistency check skipped or failed');
      }
    }

    return {
      status,
      isValid: errors.length === 0,
      errors,
      warnings,
      errorCode
    };
  }
}

export const positionValidationService = new PositionValidationService();
