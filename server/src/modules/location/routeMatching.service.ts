import { env } from '../../config/env';
import { RouteDirection } from '../../models';
import { RouteSnappingResult } from './location.types';
import { projectPointOntoPolyline, computePolylineCumulativeDistances } from './geoMath';

export interface RouteMatchingOptions {
  maxCrossTrackMeters?: number;
  backwardToleranceMeters?: number;
}

export class RouteMatchingService {
  private maxCrossTrackMeters: number;
  private backwardToleranceMeters: number;

  constructor(options?: RouteMatchingOptions) {
    this.maxCrossTrackMeters =
      options?.maxCrossTrackMeters ?? env.LOCATION_MAX_CROSS_TRACK_METERS;
    this.backwardToleranceMeters =
      options?.backwardToleranceMeters ?? env.LOCATION_MAX_BACKWARD_METERS;
  }

  /**
   * Snaps a raw coordinate [longitude, latitude] to an array of route coordinates.
   */
  public matchCoordinates(
    point: [number, number],
    coordinates: [number, number][],
    options?: {
      previousProgressMeters?: number;
      cumulativeDistances?: number[];
    }
  ): RouteSnappingResult {
    return projectPointOntoPolyline(point, coordinates, options?.cumulativeDistances, {
      previousProgressMeters: options?.previousProgressMeters,
      maxCrossTrackMeters: this.maxCrossTrackMeters,
      backwardToleranceMeters: this.backwardToleranceMeters
    });
  }

  /**
   * Matches an observation to a RouteDirection's persisted GeoJSON LineString.
   */
  public async matchToRouteDirection(
    point: [number, number],
    routeDirectionId: string,
    previousProgressMeters?: number
  ): Promise<RouteSnappingResult | null> {
    try {
      const direction = await RouteDirection.findById(routeDirectionId).lean();

      if (
        !direction ||
        !direction.routePolyline ||
        direction.routePolyline.type !== 'LineString' ||
        !Array.isArray(direction.routePolyline.coordinates) ||
        direction.routePolyline.coordinates.length === 0
      ) {
        return null;
      }

      const rawCoords = direction.routePolyline.coordinates as [number, number][];
      const cumDistances = computePolylineCumulativeDistances(rawCoords);

      return this.matchCoordinates(point, rawCoords, {
        previousProgressMeters,
        cumulativeDistances: cumDistances
      });
    } catch {
      return null;
    }
  }
}

export const routeMatchingService = new RouteMatchingService();
