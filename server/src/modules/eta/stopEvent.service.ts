import { Types } from 'mongoose';
import { env } from '../../config/env';
import { logger } from '../../common/logger';
import { StopEvent, StopEventType } from '../../models/StopEvent';
import { LocationObservation } from '../location/location.types';
import { NextStopDetectionResult } from './eta.types';

export interface StopEventOptions {
  arrivalRadiusMeters?: number;
  departureRadiusMeters?: number;
  confirmationCount?: number;
  clock?: () => number;
}

interface InFlightStopTracker {
  tripId: string;
  busId: string;
  candidateStopSequence: number;
  candidateStopId: string;
  consecutiveArrivalObservations: number;
  lastArrivedStopSequence?: number;
  lastDepartedStopSequence?: number;
}

export class StopEventService {
  private arrivalRadiusMeters: number;
  private departureRadiusMeters: number;
  private confirmationCount: number;
  private clock: () => number;

  // In-memory confirmation state per bus to filter transient GPS jitter
  private busTrackers: Map<string, InFlightStopTracker> = new Map();

  constructor(options?: StopEventOptions) {
    this.arrivalRadiusMeters =
      options?.arrivalRadiusMeters ?? env.STOP_ARRIVAL_RADIUS_METERS;
    this.departureRadiusMeters =
      options?.departureRadiusMeters ?? env.STOP_DEPARTURE_RADIUS_METERS;
    this.confirmationCount =
      options?.confirmationCount ?? env.STOP_ARRIVAL_CONFIRMATION_COUNT;
    this.clock = options?.clock ?? (() => Date.now());
  }

  public getArrivalRadius(): number {
    return this.arrivalRadiusMeters;
  }

  public getDepartureRadius(): number {
    return this.departureRadiusMeters;
  }

  public getClock(): () => number {
    return this.clock;
  }

  /**
   * Resets tracking state for a specific bus or trip.
   */
  public resetTracker(busId: string): void {
    this.busTrackers.delete(busId);
  }

  /**
   * Evaluates observation against next-stop detection to trigger and persist confirmed
   * arrival, departure, or terminal events safely.
   */
  public async processStopEvents(
    observation: LocationObservation,
    nextStopDetection: NextStopDetectionResult
  ): Promise<StopEventType | null> {
    const busId = observation.busId.toString();
    const tripId = observation.tripId?.toString() ?? nextStopDetection.tripId;

    if (!tripId) {
      return null;
    }

    // Do not confirm arrivals on stale or inactive telemetry
    if (observation.trackingStatus === 'STALE' || observation.trackingStatus === 'OFFLINE') {
      return null;
    }

    let tracker = this.busTrackers.get(busId);
    if (!tracker || tracker.tripId !== tripId) {
      tracker = {
        tripId,
        busId,
        candidateStopSequence: 0,
        candidateStopId: '',
        consecutiveArrivalObservations: 0
      };
      this.busTrackers.set(busId, tracker);
    }

    const currentStop = nextStopDetection.currentStop;

    // 1. Terminal reached event
    if (nextStopDetection.isTerminalReached && currentStop) {
      await this.recordEvent({
        tripId,
        busId,
        stopId: currentStop.id,
        stopSequence: currentStop.sequence,
        eventType: 'TERMINAL_REACHED',
        distanceToStopMeters: 0,
        recordedAt: observation.recordedAt,
        source: observation.source,
        trackingStatus: observation.trackingStatus
      });
      return 'TERMINAL_REACHED';
    }

    // 2. Arrival confirmation check
    if (nextStopDetection.status === 'ARRIVED' && currentStop) {
      if (tracker.candidateStopSequence === currentStop.sequence) {
        tracker.consecutiveArrivalObservations++;
      } else {
        tracker.candidateStopSequence = currentStop.sequence;
        tracker.candidateStopId = currentStop.id;
        tracker.consecutiveArrivalObservations = 1;
      }

      // Confirm arrival only after reaching confirmationCount (default: 2)
      if (
        tracker.consecutiveArrivalObservations >= this.confirmationCount &&
        tracker.lastArrivedStopSequence !== currentStop.sequence
      ) {
        tracker.lastArrivedStopSequence = currentStop.sequence;

        await this.recordEvent({
          tripId,
          busId,
          stopId: currentStop.id,
          stopSequence: currentStop.sequence,
          eventType: 'ARRIVED',
          distanceToStopMeters: 0,
          recordedAt: observation.recordedAt,
          source: observation.source,
          trackingStatus: observation.trackingStatus
        });

        return 'ARRIVED';
      }
    } else {
      // Vehicle is no longer in arrival radius; reset consecutive arrival count
      tracker.consecutiveArrivalObservations = 0;
    }

    // 3. Departure confirmation check
    if (
      nextStopDetection.status === 'DEPARTED' &&
      currentStop &&
      tracker.lastArrivedStopSequence === currentStop.sequence &&
      tracker.lastDepartedStopSequence !== currentStop.sequence
    ) {
      tracker.lastDepartedStopSequence = currentStop.sequence;

      await this.recordEvent({
        tripId,
        busId,
        stopId: currentStop.id,
        stopSequence: currentStop.sequence,
        eventType: 'DEPARTED',
        distanceToStopMeters: nextStopDetection.remainingDistanceMeters,
        recordedAt: observation.recordedAt,
        source: observation.source,
        trackingStatus: observation.trackingStatus
      });

      return 'DEPARTED';
    }

    return null;
  }

  /**
   * Persists stop event idempotently. Concurrency-safe against duplicate database records.
   */
  public async recordEvent(eventData: {
    tripId: string;
    busId: string;
    stopId: string;
    stopSequence: number;
    eventType: StopEventType;
    distanceToStopMeters: number;
    recordedAt: Date;
    source: any;
    trackingStatus: any;
  }): Promise<boolean> {
    try {
      const filter = {
        tripId: new Types.ObjectId(eventData.tripId),
        stopSequence: eventData.stopSequence,
        eventType: eventData.eventType
      };

      const update = {
        $setOnInsert: {
          tripId: new Types.ObjectId(eventData.tripId),
          busId: new Types.ObjectId(eventData.busId),
          stopId: new Types.ObjectId(eventData.stopId),
          stopSequence: eventData.stopSequence,
          eventType: eventData.eventType,
          distanceToStopMeters: eventData.distanceToStopMeters,
          recordedAt: eventData.recordedAt,
          source: eventData.source,
          trackingStatus: eventData.trackingStatus
        }
      };

      await StopEvent.findOneAndUpdate(filter, update, { upsert: true });
      return true;
    } catch (err: any) {
      // E11000 duplicate key error is expected under concurrent writes; handled idempotently
      if (err.code === 11000) {
        return true;
      }
      logger.error({ err, eventData }, 'Failed to record stop event');
      return false;
    }
  }
}

export const stopEventService = new StopEventService();
