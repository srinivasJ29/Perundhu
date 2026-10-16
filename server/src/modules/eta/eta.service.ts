import { Types } from 'mongoose';
import {
  ScheduledTrip,
  RouteDirection,
  LatestBusPosition,
  LocationHistory
} from '../../models';
import { env } from '../../config/env';
import {
  EtaPredictionSource,
  StopEtaPrediction,
  TripEtaResponseDto
} from './eta.types';
import { NextStopService, nextStopService } from './nextStop.service';

export interface EtaServiceOptions {
  maxPositionAgeMs?: number;
  minEffectiveSpeedKmph?: number;
  maxEffectiveSpeedKmph?: number;
  defaultSpeedKmph?: number;
  defaultDwellSeconds?: number;
  clock?: () => number;
}

export class EtaService {
  private maxPositionAgeMs: number;
  private minEffectiveSpeedKmph: number;
  private maxEffectiveSpeedKmph: number;
  private defaultSpeedKmph: number;
  private defaultDwellSeconds: number;
  private clock: () => number;

  constructor(
    private readonly nextStopDetector: NextStopService = nextStopService,
    options?: EtaServiceOptions
  ) {
    this.maxPositionAgeMs =
      options?.maxPositionAgeMs ?? env.ETA_MAX_POSITION_AGE_MS;
    this.minEffectiveSpeedKmph =
      options?.minEffectiveSpeedKmph ?? env.ETA_MIN_EFFECTIVE_SPEED_KMPH;
    this.maxEffectiveSpeedKmph =
      options?.maxEffectiveSpeedKmph ?? env.ETA_MAX_EFFECTIVE_SPEED_KMPH;
    this.defaultSpeedKmph =
      options?.defaultSpeedKmph ?? env.ETA_DEFAULT_SPEED_KMPH;
    this.defaultDwellSeconds =
      options?.defaultDwellSeconds ?? env.ETA_DEFAULT_DWELL_SECONDS;
    this.clock = options?.clock ?? (() => Date.now());
  }

  /**
   * Calculates rolling average speed from recent location history observations for a bus.
   */
  public async getRollingAverageSpeedKmph(busId: Types.ObjectId): Promise<number | null> {
    try {
      const recentHistory = await LocationHistory.find({ busId })
        .sort({ recordedAt: -1 })
        .limit(5)
        .lean();

      if (!recentHistory || recentHistory.length < 2) {
        return null;
      }

      const validSpeeds = recentHistory
        .map((h) => h.speedKmph)
        .filter((s) => Number.isFinite(s) && s > 0);

      if (validSpeeds.length === 0) {
        return null;
      }

      const sum = validSpeeds.reduce((acc, curr) => acc + curr, 0);
      return Math.round((sum / validSpeeds.length) * 10) / 10;
    } catch {
      return null;
    }
  }

  /**
   * Generates dynamic ETA predictions for a scheduled trip and all its downstream stops.
   */
  public async calculateTripEta(
    tripId: string | Types.ObjectId
  ): Promise<TripEtaResponseDto | null> {
    const tripObjId = typeof tripId === 'string' ? new Types.ObjectId(tripId) : tripId;
    const trip = await ScheduledTrip.findById(tripObjId).lean();

    if (!trip) {
      return null;
    }

    const direction = await RouteDirection.findById(trip.routeDirectionId)
      .populate<{ routeId: { routeNumber: string } }>('routeId')
      .lean();

    const routeNumber = (direction?.routeId as any)?.routeNumber;
    const directionCode = direction?.directionCode;

    // Detect next stop & progress
    const nextStopDetection = await this.nextStopDetector.detectNextStopForTrip(tripObjId);

    const nowMs = this.clock();
    const generatedAt = new Date(nowMs).toISOString();

    // 1. If trip is CANCELLED or COMPLETED, return terminal/empty ETA
    if (trip.status === 'CANCELLED' || trip.status === 'COMPLETED' || nextStopDetection?.isTerminalReached) {
      return {
        tripId: trip._id.toString(),
        tripCode: trip.tripCode,
        busId: trip.busId?.toString(),
        routeNumber,
        directionCode,
        trackingStatus: trip.status === 'CANCELLED' ? 'OFFLINE' : 'UNAVAILABLE',
        source: 'SIMULATOR',
        isRealTimePrediction: false,
        predictionSource: 'UNAVAILABLE',
        confidence: 0,
        generatedAt,
        downstreamStops: []
      };
    }

    // 2. Fetch all ordered stops for the trip
    let orderedStops = await this.nextStopDetector.getOrderedStopsForTrip(
      tripObjId,
      trip.routeDirectionId
    );

    const polylineCoords =
      direction?.routePolyline?.type === 'LineString' &&
      Array.isArray(direction.routePolyline.coordinates)
        ? (direction.routePolyline.coordinates as [number, number][])
        : [];

    if (polylineCoords.length >= 2) {
      orderedStops = this.nextStopDetector.calculateStopAlongRouteDistances(
        orderedStops,
        polylineCoords
      );
    }

    if (orderedStops.length === 0) {
      return {
        tripId: trip._id.toString(),
        tripCode: trip.tripCode,
        busId: trip.busId?.toString(),
        routeNumber,
        directionCode,
        trackingStatus: 'UNAVAILABLE',
        source: 'SIMULATOR',
        isRealTimePrediction: false,
        predictionSource: 'UNAVAILABLE',
        confidence: 0,
        generatedAt,
        downstreamStops: []
      };
    }

    // 3. Inspect latest bus telemetry
    let latestPosition = null;
    if (trip.busId) {
      latestPosition = await LatestBusPosition.findOne({ busId: trip.busId }).lean();
    }

    // Check position age & freshness
    const positionAgeMs = latestPosition
      ? nowMs - latestPosition.recordedAt.getTime()
      : Infinity;
    const isPositionFresh = positionAgeMs <= this.maxPositionAgeMs;

    // Determine prediction source and truthfulness
    let predictionSource: EtaPredictionSource;
    let isRealTimePrediction = false;
    let trackingStatus = latestPosition?.trackingStatus ?? 'UNAVAILABLE';
    let source = latestPosition?.source ?? 'SIMULATOR';
    let confidence = 0.5;

    if (!latestPosition || !isPositionFresh) {
      // Stale or missing telemetry: Fallback to scheduled timetable
      predictionSource = 'SCHEDULE_FALLBACK';
      isRealTimePrediction = false;
      confidence = 0.45;
    } else if (latestPosition.source === 'SIMULATOR') {
      // Truthfulness: Simulated telemetry is NEVER labeled as LIVE real-time
      predictionSource = 'SIMULATED_MOVEMENT';
      isRealTimePrediction = false;
      confidence = 0.75;
    } else {
      // Real physical GPS telemetry
      predictionSource = 'LIVE_MOVEMENT';
      isRealTimePrediction = true;
      confidence = 0.9;
    }

    // 4. Calculate effective speed
    let effectiveSpeedKmph = this.defaultSpeedKmph;

    if (latestPosition && isPositionFresh) {
      const rollingSpeed = await this.getRollingAverageSpeedKmph(latestPosition.busId);
      const currentSpeed = latestPosition.speedKmph;

      // Use rolling average if available, else current observed speed
      const candidateSpeed = rollingSpeed ?? currentSpeed;

      if (candidateSpeed > 5) {
        effectiveSpeedKmph = Math.min(
          this.maxEffectiveSpeedKmph,
          Math.max(this.minEffectiveSpeedKmph, candidateSpeed)
        );
      } else {
        // Vehicle is dwelling at stop or stationary in traffic: use default transit speed
        effectiveSpeedKmph = this.defaultSpeedKmph;
      }
    }

    const effectiveSpeedMetersPerSec = (effectiveSpeedKmph * 1000) / 3600;

    // 5. Determine starting point along route
    const busProgressMeters = latestPosition?.distanceAlongRouteMeters ?? 0;
    const isDwellingAtStop = nextStopDetection?.status === 'ARRIVED';

    // Filter to upcoming downstream stops (stops ahead of the bus)
    // Find index of next stop in orderedStops
    let nextStopIndex = 0;
    if (nextStopDetection?.nextStop) {
      const foundIdx = orderedStops.findIndex(
        (s) => s.sequence === nextStopDetection.nextStop?.sequence
      );
      if (foundIdx !== -1) {
        nextStopIndex = foundIdx;
      }
    } else if (nextStopDetection?.currentStop) {
      const foundIdx = orderedStops.findIndex(
        (s) => s.sequence === nextStopDetection.currentStop?.sequence
      );
      if (foundIdx !== -1) {
        nextStopIndex = Math.min(orderedStops.length - 1, foundIdx + 1);
      }
    }

    const downstreamStopItems = orderedStops.slice(nextStopIndex);

    // 6. Cumulative ETA calculation for all downstream stops
    const downstreamPredictions: StopEtaPrediction[] = [];
    let cumulativeEtaSeconds = 0;
    let prevStopDistance = busProgressMeters;

    // If currently dwelling at a stop, add remaining stop dwell (half default dwell)
    if (isDwellingAtStop) {
      cumulativeEtaSeconds += Math.round(this.defaultDwellSeconds / 2);
    }

    for (let i = 0; i < downstreamStopItems.length; i++) {
      const stop = downstreamStopItems[i];
      const stopDistance = stop.distanceFromOriginMeters;

      // Distance from bus to this stop
      const remainingDistanceMeters = Math.max(0, stopDistance - busProgressMeters);

      // Distance segment from previous stop (or from bus for the first downstream stop)
      const segmentDistance = Math.max(0, stopDistance - prevStopDistance);
      const transitTimeSeconds =
        effectiveSpeedMetersPerSec > 0
          ? Math.round(segmentDistance / effectiveSpeedMetersPerSec)
          : 0;

      cumulativeEtaSeconds += transitTimeSeconds;

      // Add intermediate dwell time for subsequent stops
      if (i > 0) {
        cumulativeEtaSeconds += this.defaultDwellSeconds;
      }

      const etaSeconds = Math.max(0, cumulativeEtaSeconds);
      const etaMinutes = Math.round((etaSeconds / 60) * 10) / 10;
      const estimatedArrivalAt = new Date(nowMs + etaSeconds * 1000).toISOString();

      prevStopDistance = stopDistance;

      downstreamPredictions.push({
        stopId: stop.id,
        stopCode: stop.code,
        stopNameEn: stop.nameEn,
        stopNameTa: stop.nameTa,
        stopSequence: stop.sequence,
        location: stop.location,
        estimatedArrivalAt,
        etaSeconds,
        etaMinutes,
        remainingDistanceMeters: Math.round(remainingDistanceMeters),
        effectiveSpeedKmph,
        scheduledArrival: stop.scheduledArrival,
        scheduledDeparture: stop.scheduledDeparture,
        predictionSource,
        isRealTimePrediction,
        confidence
      });
    }

    const nextStopPrediction = downstreamPredictions.length > 0 ? downstreamPredictions[0] : undefined;

    return {
      tripId: trip._id.toString(),
      tripCode: trip.tripCode,
      busId: trip.busId?.toString(),
      routeNumber,
      directionCode,
      trackingStatus,
      source,
      isRealTimePrediction,
      predictionSource,
      confidence,
      generatedAt,
      nextStop: nextStopPrediction,
      downstreamStops: downstreamPredictions
    };
  }

  /**
   * Generates dynamic ETA predictions for a specific bus by resolving its active trip.
   */
  public async calculateBusEta(
    busId: string | Types.ObjectId
  ): Promise<TripEtaResponseDto | null> {
    const busObjId = typeof busId === 'string' ? new Types.ObjectId(busId) : busId;

    // Find active trip assigned to this bus
    const activeTrip = await ScheduledTrip.findOne({
      busId: busObjId,
      status: { $in: ['SCHEDULED', 'IN_TRANSIT'] },
      isActive: true
    }).lean();

    if (!activeTrip) {
      return null;
    }

    return this.calculateTripEta(activeTrip._id);
  }
}

export const etaService = new EtaService();
