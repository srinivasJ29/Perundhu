import { Server } from 'socket.io';
import { logger } from '../../common/logger';
import {
  LocationObservation,
  PipelineProcessingResult,
  TrackingStatus
} from '../location/location.types';
import { haversineDistanceMeters } from '../location/geoMath';
import { NextStopService, nextStopService } from '../eta/nextStop.service';
import { EtaService, etaService } from '../eta/eta.service';
import { StopEventService, stopEventService } from '../eta/stopEvent.service';
import {
  RealtimeEvents,
  getBusRoom,
  getRouteRoom,
  BusPositionBroadcastPayload,
  BusStatusBroadcastPayload,
  BusNextStopBroadcastPayload,
  BusEtaBroadcastPayload,
  BusStopEventBroadcastPayload
} from './realtime.types';

interface EmittedStateRecord {
  coordinates: [number, number];
  heading: number;
  speedKmph: number;
  trackingStatus: TrackingStatus;
  timestampMs: number;
}

export class RealtimeTrackingService {
  private io: Server | null = null;
  private readonly deduplicationIntervalMs: number = 3000; // Force heartbeat emission after 3s
  private readonly minDistanceMetersForUpdate: number = 1.0;
  private readonly minHeadingDegreesForUpdate: number = 2.0;

  // In-memory cache of last emitted position per bus to suppress duplicates
  private lastEmittedState: Map<string, EmittedStateRecord> = new Map();

  constructor(
    private readonly nextStopDetector: NextStopService = nextStopService,
    private readonly etaPredictor: EtaService = etaService,
    private readonly stopEventDetector: StopEventService = stopEventService
  ) {}

  public attachServer(io: Server): void {
    this.io = io;
    logger.info('Socket.IO real-time tracking service attached to HTTP server');
  }

  public detachServer(): void {
    this.io = null;
    this.lastEmittedState.clear();
    logger.info('Socket.IO real-time tracking service detached');
  }

  public getConnectedClientsCount(): number {
    return this.io?.engine.clientsCount ?? 0;
  }

  public resetForTest(): void {
    this.lastEmittedState.clear();
  }

  /**
   * Primary entrypoint: Broadcasts accepted and persisted observations to active rooms.
   * Will NEVER broadcast rejected, unpersisted, or unverified observations.
   */
  public async broadcastAcceptedObservation(
    pipelineResult: PipelineProcessingResult
  ): Promise<boolean> {
    if (!this.io) {
      // Server not attached or shutting down
      return false;
    }

    // Step 2 & 4 Requirement: Broadcast ONLY accepted and persisted observations
    if (!pipelineResult.accepted || !pipelineResult.persistedLatest) {
      logger.debug(
        { busId: pipelineResult.observation.busId.toString() },
        'Skipping real-time broadcast: observation was not accepted or persisted'
      );
      return false;
    }

    const obs = pipelineResult.observation;
    const busId = obs.busId.toString();
    const routeId = obs.routeId?.toString();
    const tripId = obs.tripId?.toString();
    const directionId = obs.directionId?.toString();

    const rawCoords = obs.location.coordinates as [number, number];
    const snappedCoords = obs.snappedLocation?.coordinates as [number, number] | undefined;
    const effectiveCoords = snappedCoords ?? rawCoords;

    // Truthful source status enforcement:
    // Simulated telemetry must NEVER be masqueraded as 'LIVE'
    let trackingStatus: TrackingStatus = obs.trackingStatus;
    if (obs.source === 'SIMULATOR') {
      trackingStatus = obs.trackingStatus === 'DEVIATED' ? 'DEVIATED' : 'SIMULATED';
    }

    const nowMs = Date.now();
    const previous = this.lastEmittedState.get(busId);

    // -------------------------------------------------------------------------
    // Deduplication check: Suppress duplicate unchanged updates
    // -------------------------------------------------------------------------
    if (previous) {
      const distance = haversineDistanceMeters(previous.coordinates, effectiveCoords);
      const headingDiff = Math.abs(previous.heading - obs.heading);
      const speedDiff = Math.abs(previous.speedKmph - obs.speedKmph);
      const statusUnchanged = previous.trackingStatus === trackingStatus;
      const elapsedMs = nowMs - previous.timestampMs;

      if (
        distance < this.minDistanceMetersForUpdate &&
        headingDiff < this.minHeadingDegreesForUpdate &&
        speedDiff < 1.0 &&
        statusUnchanged &&
        elapsedMs < this.deduplicationIntervalMs
      ) {
        // Position has not changed meaningfully within the deduplication window
        return false;
      }
    }

    // Update in-memory emission cache
    const prevStatus = previous?.trackingStatus;
    this.lastEmittedState.set(busId, {
      coordinates: effectiveCoords,
      heading: obs.heading,
      speedKmph: obs.speedKmph,
      trackingStatus,
      timestampMs: nowMs
    });

    // -------------------------------------------------------------------------
    // 1. Build & Emit bus:position Payload
    // -------------------------------------------------------------------------
    const recordedAtIso = obs.recordedAt instanceof Date ? obs.recordedAt.toISOString() : new Date(obs.recordedAt).toISOString();
    const receivedAtIso = obs.receivedAt instanceof Date ? obs.receivedAt.toISOString() : new Date(obs.receivedAt).toISOString();

    const positionPayload: BusPositionBroadcastPayload = {
      busId,
      tripId,
      routeId,
      directionId,
      coordinates: rawCoords,
      snappedCoordinates: snappedCoords,
      heading: obs.heading,
      speedKmph: obs.speedKmph,
      progressRatio: obs.progressRatio,
      distanceAlongRouteMeters: obs.distanceAlongRouteMeters,
      totalRouteDistanceMeters: obs.totalRouteDistanceMeters,
      trackingStatus,
      source: obs.source,
      validationStatus: obs.validationStatus ?? 'VALID',
      recordedAt: recordedAtIso,
      receivedAt: receivedAtIso
    };

    const busRoom = getBusRoom(busId);
    let broadcaster = this.io.to(busRoom);

    if (routeId) {
      const routeRoom = getRouteRoom(routeId);
      // Socket.IO deduplicates across rooms automatically
      broadcaster = broadcaster.to(routeRoom);
    }

    broadcaster.emit(RealtimeEvents.BUS_POSITION, positionPayload);

    // -------------------------------------------------------------------------
    // 2. Emit bus:status if status changed
    // -------------------------------------------------------------------------
    if (prevStatus && prevStatus !== trackingStatus) {
      const statusPayload: BusStatusBroadcastPayload = {
        busId,
        tripId,
        routeId,
        previousStatus: prevStatus,
        currentStatus: trackingStatus,
        timestamp: new Date().toISOString()
      };
      broadcaster.emit(RealtimeEvents.BUS_STATUS, statusPayload);
    }

    // -------------------------------------------------------------------------
    // 3. Asynchronous Next-Stop, Stop-Event & ETA Evaluations
    // -------------------------------------------------------------------------
    if (tripId) {
      this.evaluateTripProgressAndBroadcast(obs, positionPayload, broadcaster).catch(
        (err) => {
          logger.error({ err, busId, tripId }, 'Error evaluating real-time trip ETA / next-stop');
        }
      );
    }

    return true;
  }

  /**
   * Evaluates next-stop detection, stop confirmation events, and dynamic ETAs.
   */
  private async evaluateTripProgressAndBroadcast(
    observation: LocationObservation,
    positionPayload: BusPositionBroadcastPayload,
    broadcaster: ReturnType<Server['to']>
  ): Promise<void> {
    const tripId = positionPayload.tripId;
    if (!tripId) return;

    try {
      // 1. Next-Stop Detection
      const nextStopResult = await this.nextStopDetector.detectNextStopForTrip(tripId);

      if (nextStopResult && nextStopResult.nextStop) {
        const nextStopPayload: BusNextStopBroadcastPayload = {
          busId: positionPayload.busId,
          tripId,
          routeId: positionPayload.routeId,
          nextStop: {
            id: nextStopResult.nextStop.id,
            code: nextStopResult.nextStop.code,
            nameEn: nextStopResult.nextStop.nameEn,
            nameTa: nextStopResult.nextStop.nameTa,
            sequence: nextStopResult.nextStop.sequence,
            distanceToStopMeters: nextStopResult.nextStop.distanceFromOriginMeters,
            status: nextStopResult.status
          },
          timestamp: new Date().toISOString()
        };

        broadcaster.emit(RealtimeEvents.BUS_NEXT_STOP, nextStopPayload);

        // 2. Stop Arrival / Departure Events Confirmation
        const confirmedEvent = await this.stopEventDetector.processStopEvents(
          observation,
          nextStopResult
        );

        if (confirmedEvent) {
          const stopEventPayload: BusStopEventBroadcastPayload = {
            busId: positionPayload.busId,
            tripId,
            routeId: positionPayload.routeId,
            stopId: nextStopResult.nextStop.id,
            stopNameEn: nextStopResult.nextStop.nameEn,
            sequence: nextStopResult.nextStop.sequence,
            eventType: confirmedEvent,
            recordedAt: positionPayload.recordedAt,
            source: observation.source
          };

          broadcaster.emit(RealtimeEvents.BUS_STOP_EVENT, stopEventPayload);
        }
      }

      // 3. Dynamic Dynamic ETA Prediction
      const etaResult = await this.etaPredictor.calculateTripEta(tripId);

      if (etaResult) {
        // Truthful ETA prediction source: Simulated movement must retain isRealTimePrediction: false
        const isRealTimePrediction =
          observation.source !== 'SIMULATOR' && etaResult.isRealTimePrediction;

        const effectiveSpeedKmph =
          etaResult.nextStop?.effectiveSpeedKmph ??
          etaResult.downstreamStops[0]?.effectiveSpeedKmph ??
          observation.speedKmph;

        const etaPayload: BusEtaBroadcastPayload = {
          busId: positionPayload.busId,
          tripId,
          routeId: positionPayload.routeId ?? '',
          predictionSource:
            observation.source === 'SIMULATOR'
              ? 'SIMULATED_MOVEMENT'
              : etaResult.predictionSource,
          isRealTimePrediction,
          predictions: etaResult.downstreamStops.map((p) => ({
            stopId: p.stopId,
            stopCode: p.stopCode,
            stopNameEn: p.stopNameEn,
            stopNameTa: p.stopNameTa,
            sequence: p.stopSequence,
            estimatedArrivalIso: p.estimatedArrivalAt ?? '',
            estimatedArrivalMinutes: p.etaMinutes,
            distanceToStopMeters: p.remainingDistanceMeters
          })),
          effectiveSpeedKmph,
          calculatedAt: etaResult.generatedAt
        };

        broadcaster.emit(RealtimeEvents.BUS_ETA, etaPayload);
      }
    } catch (err) {
      logger.error({ err, tripId }, 'Failed in evaluateTripProgressAndBroadcast');
    }
  }
}

export const realtimeTrackingService = new RealtimeTrackingService();
