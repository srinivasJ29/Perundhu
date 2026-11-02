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
import { mlEtaService, MlEtaService } from './mlEta.service';

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
  private readonly nextStopDetector: NextStopService;
  private readonly mlPredictor: MlEtaService;

  constructor(
    nextStopDetector?: NextStopService,
    optionsOrMlPredictor?: EtaServiceOptions | MlEtaService,
    maybeOptions?: EtaServiceOptions
  ) {
    this.nextStopDetector = nextStopDetector ?? nextStopService;

    let options: EtaServiceOptions | undefined;
    if (optionsOrMlPredictor && typeof (optionsOrMlPredictor as any).predict === 'function') {
      this.mlPredictor = optionsOrMlPredictor as MlEtaService;
      options = maybeOptions;
    } else {
      this.mlPredictor = mlEtaService;
      options = optionsOrMlPredictor as EtaServiceOptions | undefined;
    }

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
        modelVersion: 'v1.0',
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
        modelVersion: 'v1.0',
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

    // Determine baseline status and speed
    let trackingStatus = latestPosition?.trackingStatus ?? 'UNAVAILABLE';
    let source = latestPosition?.source ?? 'SIMULATOR';
    let confidence = 0.5;
    let predictionSource: EtaPredictionSource;
    let isRealTimePrediction = false;

    if (!latestPosition || !isPositionFresh) {
      predictionSource = 'SCHEDULE_FALLBACK';
      isRealTimePrediction = false;
      confidence = 0.45;
    } else if (latestPosition.source === 'SIMULATOR') {
      predictionSource = 'SIMULATED_MOVEMENT';
      isRealTimePrediction = false;
      confidence = 0.75;
    } else {
      predictionSource = 'LIVE_MOVEMENT';
      isRealTimePrediction = true;
      confidence = 0.9;
    }

    let effectiveSpeedKmph = this.defaultSpeedKmph;
    if (latestPosition && isPositionFresh) {
      const rollingSpeed = await this.getRollingAverageSpeedKmph(latestPosition.busId);
      const currentSpeed = latestPosition.speedKmph;
      const candidateSpeed = rollingSpeed ?? currentSpeed;

      if (candidateSpeed > 5) {
        effectiveSpeedKmph = Math.min(
          this.maxEffectiveSpeedKmph,
          Math.max(this.minEffectiveSpeedKmph, candidateSpeed)
        );
      }
    }

    const effectiveSpeedMetersPerSec = (effectiveSpeedKmph * 1000) / 3600;

    // 4. Determine starting point along route
    const busProgressMeters = latestPosition?.distanceAlongRouteMeters ?? 0;
    const isDwellingAtStop = nextStopDetection?.status === 'ARRIVED';

    // Filter to upcoming downstream stops (stops ahead of the bus)
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
      const remainingDistanceMeters = Math.max(0, stopDistance - busProgressMeters);

      const segmentDistance = Math.max(0, stopDistance - prevStopDistance);
      const transitTimeSeconds =
        effectiveSpeedMetersPerSec > 0
          ? Math.round(segmentDistance / effectiveSpeedMetersPerSec)
          : 0;

      cumulativeEtaSeconds += transitTimeSeconds;

      if (i > 0) {
        cumulativeEtaSeconds += this.defaultDwellSeconds;
      }

      let stopEtaSeconds = Math.max(0, cumulativeEtaSeconds);
      let stopEtaMinutes = Math.round((stopEtaSeconds / 60) * 10) / 10;
      let stopConfidence = confidence;
      let stopPredSource: EtaPredictionSource = predictionSource;
      let confInterval: [number, number] | undefined = undefined;
      let fallbackReason: string | undefined = undefined;

      // If we have live movement with physical GPS, invoke ML prediction service
      if (predictionSource === 'LIVE_MOVEMENT' && this.mlPredictor) {
        try {
          const mlRes = await this.mlPredictor.predict({
            bus_id: trip.busId?.toString() || trip._id.toString(),
            route_id: trip.routeDirectionId?.toString(),
            route_number: routeNumber,
            target_stop_code: stop.code,
            distance_to_stop_meters: remainingDistanceMeters,
            distance_along_route_meters: busProgressMeters,
            current_speed_kmph: latestPosition?.speedKmph ?? 0,
            rolling_speed_kmph: effectiveSpeedKmph,
            heading: latestPosition?.heading ?? 0,
            stops_remaining: i + 1,
            segment_index: nextStopIndex + i,
            scheduled_duration_seconds: stopEtaSeconds,
            recorded_at: latestPosition?.recordedAt?.toISOString(),
            is_deviated: latestPosition?.trackingStatus === 'DEVIATED',
            tracking_status: latestPosition?.trackingStatus ?? 'UNAVAILABLE'
          });

          if (mlRes.prediction_source === 'ML_PREDICTION') {
            stopPredSource = 'ML_PREDICTION';
            stopEtaSeconds = Math.round(mlRes.predicted_seconds);
            stopEtaMinutes = mlRes.predicted_minutes;
            stopConfidence = mlRes.confidence;
            confInterval = [mlRes.confidence_lower_seconds, mlRes.confidence_upper_seconds];
          } else {
            confInterval = [Math.round(stopEtaSeconds * 0.8), Math.round(stopEtaSeconds * 1.25)];
            fallbackReason = mlRes.fallback_reason;
          }
        } catch {
          // Keep physics-based live movement estimate
        }
      }

      const estimatedArrivalAt = new Date(nowMs + stopEtaSeconds * 1000).toISOString();

      downstreamPredictions.push({
        stopId: stop.id,
        stopCode: stop.code,
        stopNameEn: stop.nameEn,
        stopNameTa: stop.nameTa,
        stopSequence: stop.sequence,
        location: stop.location,
        estimatedArrivalAt,
        etaSeconds: stopEtaSeconds,
        etaMinutes: stopEtaMinutes,
        remainingDistanceMeters: Math.round(remainingDistanceMeters),
        effectiveSpeedKmph,
        scheduledArrival: stop.scheduledArrival,
        scheduledDeparture: stop.scheduledDeparture,
        predictionSource: stopPredSource,
        isRealTimePrediction,
        confidence: stopConfidence,
        confidenceIntervalSeconds: confInterval,
        fallbackReason
      });

      prevStopDistance = stopDistance;
    }

    const nextStopPrediction = downstreamPredictions.length > 0 ? downstreamPredictions[0] : undefined;
    const overallSource = nextStopPrediction?.predictionSource ?? predictionSource;
    const overallConfidence = nextStopPrediction?.confidence ?? confidence;

    return {
      tripId: trip._id.toString(),
      tripCode: trip.tripCode,
      busId: trip.busId?.toString(),
      routeNumber,
      directionCode,
      trackingStatus,
      source,
      isRealTimePrediction,
      predictionSource: overallSource,
      confidence: overallConfidence,
      modelVersion: 'v1.0',
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
