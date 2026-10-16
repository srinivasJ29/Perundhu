import { Types } from 'mongoose';
import {
  ScheduledTrip,
  RouteDirection,
  RouteStopSequence,
  TripStopTime,
  LatestBusPosition
} from '../../models';
import { env } from '../../config/env';
import { haversineDistanceMeters, projectPointOntoPolyline, computePolylineCumulativeDistances } from '../location/geoMath';
import { EnrichedStopItem, NextStopDetectionResult, StopArrivalStatus } from './eta.types';

export interface NextStopOptions {
  arrivalRadiusMeters?: number;
  departureRadiusMeters?: number;
  clock?: () => number;
}

export class NextStopService {
  private arrivalRadiusMeters: number;
  private departureRadiusMeters: number;
  private clock: () => number;

  constructor(options?: NextStopOptions) {
    this.arrivalRadiusMeters =
      options?.arrivalRadiusMeters ?? env.STOP_ARRIVAL_RADIUS_METERS;
    this.departureRadiusMeters =
      options?.departureRadiusMeters ?? env.STOP_DEPARTURE_RADIUS_METERS;
    this.clock = options?.clock ?? (() => Date.now());
  }

  public getClock(): () => number {
    return this.clock;
  }

  /**
   * Loads ordered stops for a trip or route direction, enriched with geographic positions
   * and along-route cumulative distances in meters.
   */
  public async getOrderedStopsForTrip(
    tripId: string | Types.ObjectId,
    directionId?: Types.ObjectId
  ): Promise<EnrichedStopItem[]> {
    const tripObjId = typeof tripId === 'string' ? new Types.ObjectId(tripId) : tripId;

    // 1. Try to load specific TripStopTime schedule
    const tripStopTimes = await TripStopTime.find({ tripId: tripObjId })
      .sort({ stopSequence: 1 })
      .populate<{ stopId: { _id: Types.ObjectId; code: string; nameEn: string; nameTa: string; location: { coordinates: [number, number] } } }>('stopId')
      .lean();

    if (tripStopTimes && tripStopTimes.length > 0) {
      return tripStopTimes
        .filter((tst) => tst.stopId && tst.stopId.location)
        .map((tst, idx) => {
          const stopDoc = tst.stopId;
          return {
            id: stopDoc._id.toString(),
            code: stopDoc.code,
            nameEn: stopDoc.nameEn,
            nameTa: stopDoc.nameTa,
            sequence: tst.stopSequence ?? idx + 1,
            location: stopDoc.location.coordinates,
            distanceFromOriginMeters: 0, // Calculated below when polyline is available
            scheduledArrival: tst.scheduledArrivalTime,
            scheduledDeparture: tst.scheduledDepartureTime
          };
        });
    }

    // 2. Fallback to RouteStopSequence for the direction
    if (!directionId) {
      const trip = await ScheduledTrip.findById(tripObjId).lean();
      if (trip) {
        directionId = trip.routeDirectionId;
      }
    }

    if (!directionId) {
      return [];
    }

    const stopSequences = await RouteStopSequence.find({
      directionId,
      isActive: true
    })
      .sort({ sequenceOrder: 1 })
      .populate<{ stopId: { _id: Types.ObjectId; code: string; nameEn: string; nameTa: string; location: { coordinates: [number, number] } } }>('stopId')
      .lean();

    return stopSequences
      .filter((rss) => rss.stopId && rss.stopId.location)
      .map((rss, idx) => {
        const stopDoc = rss.stopId;
        return {
          id: stopDoc._id.toString(),
          code: stopDoc.code,
          nameEn: stopDoc.nameEn,
          nameTa: stopDoc.nameTa,
          sequence: rss.sequenceOrder ?? idx + 1,
          location: stopDoc.location.coordinates,
          distanceFromOriginMeters: (rss.distanceFromOriginKm ?? 0) * 1000
        };
      });
  }

  /**
   * Projects each stop in the sequence onto the route polyline to derive exact along-route meters.
   */
  public calculateStopAlongRouteDistances(
    stops: EnrichedStopItem[],
    polylineCoordinates: [number, number][]
  ): EnrichedStopItem[] {
    if (!polylineCoordinates || polylineCoordinates.length < 2) {
      return stops;
    }

    const cumDistances = computePolylineCumulativeDistances(polylineCoordinates);
    let previousMeters = 0;

    return stops.map((stop) => {
      // Snap stop to polyline, using previousMeters as hint to handle loops and repeated visits
      const snapping = projectPointOntoPolyline(
        stop.location,
        polylineCoordinates,
        cumDistances,
        {
          previousProgressMeters: previousMeters,
          maxCrossTrackMeters: 500
        }
      );

      const distance = Math.max(previousMeters, snapping.alongRouteDistanceMeters);
      previousMeters = distance;

      return {
        ...stop,
        distanceFromOriginMeters: distance
      };
    });
  }

  /**
   * Detects the next upcoming stop and arrival status for an active trip.
   */
  public async detectNextStopForTrip(
    tripId: string | Types.ObjectId
  ): Promise<NextStopDetectionResult | null> {
    const tripObjId = typeof tripId === 'string' ? new Types.ObjectId(tripId) : tripId;
    const trip = await ScheduledTrip.findById(tripObjId).lean();

    if (!trip) {
      return null;
    }

    const direction = await RouteDirection.findById(trip.routeDirectionId).lean();
    const polylineCoords =
      direction?.routePolyline?.type === 'LineString' &&
      Array.isArray(direction.routePolyline.coordinates)
        ? (direction.routePolyline.coordinates as [number, number][])
        : [];

    let orderedStops = await this.getOrderedStopsForTrip(tripObjId, trip.routeDirectionId);

    if (polylineCoords.length >= 2) {
      orderedStops = this.calculateStopAlongRouteDistances(orderedStops, polylineCoords);
    }

    // Handle completed or cancelled trips
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      const lastStop = orderedStops[orderedStops.length - 1];
      return {
        tripId: trip._id.toString(),
        tripCode: trip.tripCode,
        busId: trip.busId?.toString(),
        status: trip.status === 'COMPLETED' ? 'TERMINAL_REACHED' : 'UNKNOWN',
        currentStop: lastStop,
        remainingDistanceMeters: 0,
        distanceAlongRouteMeters: lastStop?.distanceFromOriginMeters ?? 0,
        totalRouteDistanceMeters: lastStop?.distanceFromOriginMeters ?? 0,
        progressRatio: 1,
        trackingStatus: 'OFFLINE',
        source: 'SIMULATOR',
        isTerminalReached: trip.status === 'COMPLETED',
        isCompleted: trip.status === 'COMPLETED',
        isCancelled: trip.status === 'CANCELLED',
        confidence: 1.0
      };
    }

    if (orderedStops.length === 0) {
      return {
        tripId: trip._id.toString(),
        tripCode: trip.tripCode,
        busId: trip.busId?.toString(),
        status: 'UNKNOWN',
        remainingDistanceMeters: 0,
        distanceAlongRouteMeters: 0,
        totalRouteDistanceMeters: 0,
        progressRatio: 0,
        trackingStatus: 'UNAVAILABLE',
        source: 'SIMULATOR',
        isTerminalReached: false,
        isCompleted: false,
        isCancelled: false,
        confidence: 0
      };
    }

    // Query latest accepted position for the bus assigned to this trip
    let latestPosition = null;
    if (trip.busId) {
      latestPosition = await LatestBusPosition.findOne({ busId: trip.busId }).lean();
    }

    const totalRouteDistance =
      orderedStops[orderedStops.length - 1].distanceFromOriginMeters ||
      (direction?.totalDistanceKm ? direction.totalDistanceKm * 1000 : 0);

    // If no telemetry exists, return initial scheduled state
    if (!latestPosition) {
      return {
        tripId: trip._id.toString(),
        tripCode: trip.tripCode,
        busId: trip.busId?.toString(),
        status: 'APPROACHING',
        nextStop: orderedStops[0],
        remainingDistanceMeters: orderedStops[0].distanceFromOriginMeters,
        distanceAlongRouteMeters: 0,
        totalRouteDistanceMeters: totalRouteDistance,
        progressRatio: 0,
        trackingStatus: 'UNAVAILABLE',
        source: 'SIMULATOR',
        isTerminalReached: false,
        isCompleted: false,
        isCancelled: false,
        confidence: 0.5
      };
    }

    const busCoords = latestPosition.location.coordinates as [number, number];
    let busProgressMeters = latestPosition.distanceAlongRouteMeters ?? 0;

    // If bus distanceAlongRoute is missing or 0, project current bus position
    if (busProgressMeters === 0 && polylineCoords.length >= 2) {
      const snap = projectPointOntoPolyline(busCoords, polylineCoords);
      busProgressMeters = snap.alongRouteDistanceMeters;
    }

    return this.evaluateNextStopFromProgress(
      trip._id.toString(),
      trip.tripCode,
      trip.busId?.toString(),
      orderedStops,
      busCoords,
      busProgressMeters,
      totalRouteDistance,
      latestPosition.speedKmph ?? 0,
      latestPosition.trackingStatus,
      latestPosition.source
    );
  }

  /**
   * Pure evaluation function: determines next stop, arrival/departure status,
   * and remaining distance based on bus progress and ordered stops.
   */
  public evaluateNextStopFromProgress(
    tripId: string,
    tripCode: string,
    busId: string | undefined,
    orderedStops: EnrichedStopItem[],
    busCoords: [number, number],
    busProgressMeters: number,
    totalRouteDistance: number,
    busSpeedKmph: number,
    trackingStatus: any = 'SIMULATED',
    source: any = 'SIMULATOR'
  ): NextStopDetectionResult {
    if (!orderedStops || orderedStops.length === 0) {
      return {
        tripId,
        tripCode,
        busId,
        status: 'TERMINAL_REACHED',
        remainingDistanceMeters: 0,
        distanceAlongRouteMeters: 0,
        totalRouteDistanceMeters: 0,
        progressRatio: 1,
        trackingStatus,
        source,
        isTerminalReached: true,
        isCompleted: true,
        isCancelled: false,
        confidence: 0
      };
    }

    const lastStopIdx = orderedStops.length - 1;
    const finalStop = orderedStops[lastStopIdx];

    // Check if terminal reached (bus progress at or beyond final stop, or within arrival radius of terminal)
    const distToTerminalSpatial = haversineDistanceMeters(busCoords, finalStop.location);
    if (
      busProgressMeters >= finalStop.distanceFromOriginMeters - this.arrivalRadiusMeters ||
      distToTerminalSpatial <= this.arrivalRadiusMeters
    ) {
      return {
        tripId,
        tripCode,
        busId,
        status: 'TERMINAL_REACHED',
        currentStop: finalStop,
        remainingDistanceMeters: 0,
        distanceAlongRouteMeters: busProgressMeters,
        totalRouteDistanceMeters: totalRouteDistance,
        progressRatio: 1,
        trackingStatus,
        source,
        isTerminalReached: true,
        isCompleted: true,
        isCancelled: false,
        confidence: 0.95
      };
    }

    // Bus is before the first stop
    if (busProgressMeters < orderedStops[0].distanceFromOriginMeters - this.arrivalRadiusMeters) {
      const firstStop = orderedStops[0];
      const remainingDist = Math.max(0, firstStop.distanceFromOriginMeters - busProgressMeters);
      return {
        tripId,
        tripCode,
        busId,
        status: 'APPROACHING',
        nextStop: firstStop,
        remainingDistanceMeters: remainingDist,
        distanceAlongRouteMeters: busProgressMeters,
        totalRouteDistanceMeters: totalRouteDistance,
        progressRatio: totalRouteDistance > 0 ? busProgressMeters / totalRouteDistance : 0,
        trackingStatus,
        source,
        isTerminalReached: false,
        isCompleted: false,
        isCancelled: false,
        confidence: 0.9
      };
    }

    // Find stop along sequence
    let currentStop: EnrichedStopItem | undefined;
    let nextStop: EnrichedStopItem | undefined;
    let status: StopArrivalStatus = 'APPROACHING';
    let remainingDistanceMeters = 0;

    for (let i = 0; i < orderedStops.length; i++) {
      const stop = orderedStops[i];
      const stopMeters = stop.distanceFromOriginMeters;
      const spatialDist = haversineDistanceMeters(busCoords, stop.location);
      const deltaAlongRoute = stopMeters - busProgressMeters;

      // Check if bus is currently ARRIVED at stop i (within arrival radius)
      if (
        spatialDist <= this.arrivalRadiusMeters ||
        Math.abs(deltaAlongRoute) <= this.arrivalRadiusMeters
      ) {
        currentStop = stop;
        status = 'ARRIVED';
        // Next stop is the subsequent stop in the sequence
        nextStop = i < lastStopIdx ? orderedStops[i + 1] : undefined;
        remainingDistanceMeters = nextStop
          ? Math.max(0, nextStop.distanceFromOriginMeters - busProgressMeters)
          : 0;
        break;
      }

      // Check if bus has passed stop i but hasn't reached stop i + 1
      if (deltaAlongRoute > 0) {
        // Stop i is ahead of the bus! This is the next stop.
        nextStop = stop;
        remainingDistanceMeters = deltaAlongRoute;

        // Check if just departed the previous stop
        if (i > 0) {
          currentStop = orderedStops[i - 1];
          const distFromPrev = busProgressMeters - currentStop.distanceFromOriginMeters;
          if (distFromPrev <= this.departureRadiusMeters && busSpeedKmph > 5) {
            status = 'DEPARTED';
          } else {
            status = 'APPROACHING';
          }
        } else {
          status = 'APPROACHING';
        }
        break;
      }
    }

    // Fallback if all stops checked and none was ahead
    if (!nextStop && !currentStop) {
      currentStop = finalStop;
      status = 'TERMINAL_REACHED';
      remainingDistanceMeters = 0;
    }

    const progressRatio =
      totalRouteDistance > 0
        ? Math.min(1, Math.max(0, busProgressMeters / totalRouteDistance))
        : 0;

    return {
      tripId,
      tripCode,
      busId,
      status,
      currentStop,
      nextStop,
      remainingDistanceMeters: Math.round(remainingDistanceMeters),
      distanceAlongRouteMeters: Math.round(busProgressMeters),
      totalRouteDistanceMeters: Math.round(totalRouteDistance),
      progressRatio: Math.round(progressRatio * 10000) / 10000,
      trackingStatus,
      source,
      isTerminalReached: status === 'TERMINAL_REACHED',
      isCompleted: status === 'TERMINAL_REACHED',
      isCancelled: false,
      confidence: 0.9
    };
  }
}

export const nextStopService = new NextStopService();
