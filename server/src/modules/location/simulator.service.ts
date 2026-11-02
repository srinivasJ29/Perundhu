import { Types } from 'mongoose';
import {
  Bus,
  ScheduledTrip,
  RouteDirection
} from '../../models';
import { env } from '../../config/env';
import { logger } from '../../common/logger';
import {
  ILocationProvider,
  LocationObservation,
  LocationObservationListener
} from './location.types';
import {
  computePolylineCumulativeDistances,
  interpolatePositionAlongPolyline,
  computeBearingDegrees
} from './geoMath';
import { locationRepository } from './location.repository';
import { LocationPipelineService } from './locationPipeline.service';

export interface SimulatedBusState {
  busId: Types.ObjectId;
  registrationNumber: string;
  fleetNumber: string;
  tripId: Types.ObjectId;
  tripCode: string;
  routeId: Types.ObjectId;
  directionId: Types.ObjectId;
  directionCode: 'OUTBOUND' | 'INBOUND';
  coordinates: [number, number][]; // [lng, lat]
  cumulativeDistances: number[];   // meters
  totalDistanceMeters: number;
  speedKmph: number;
  speedMetersPerSec: number;
  sessionStartTimeMs: number;
  initialDistanceMeters?: number;
  currentDistanceMeters: number;
  currentLocation: [number, number];
  currentHeading: number;
  progressRatio: number;
  isCompleted: boolean;
  ticksCount: number;
}

export interface SimulatorOptions {
  tickIntervalMs?: number;
  speedMultiplier?: number;
  defaultSpeedKmph?: number;
  writeHistory?: boolean;
  historyIntervalTicks?: number;
  routeEndPolicy?: 'LOOP' | 'COMPLETE';
  maxBuses?: number;
  clock?: () => number; // Injectable clock for unit/integration testing
  pipeline?: LocationPipelineService;
}

export interface SimulatorStatusDto {
  isRunning: boolean;
  isEnabled: boolean;
  startedAt?: string;
  uptimeSeconds: number;
  tickIntervalMs: number;
  speedMultiplier: number;
  routeEndPolicy: 'LOOP' | 'COMPLETE';
  writeHistory: boolean;
  activeBusesCount: number;
  buses: Array<{
    busId: string;
    registrationNumber: string;
    fleetNumber: string;
    tripCode: string;
    directionCode: string;
    progressPercent: number;
    speedKmph: number;
    heading: number;
    currentLocation: [number, number];
    isCompleted: boolean;
  }>;
}

export class RouteSimulatorService implements ILocationProvider {
  public readonly name = 'DeterministicRouteSimulator';
  public readonly source = 'SIMULATOR' as const;

  private isSimulating = false;
  private timer: NodeJS.Timeout | null = null;
  private startedAt: Date | null = null;
  private listeners: LocationObservationListener[] = [];
  private activeBuses: Map<string, SimulatedBusState> = new Map();

  // Configuration settings (with defaults from env)
  private tickIntervalMs: number;
  private speedMultiplier: number;
  private defaultSpeedKmph: number;
  private writeHistory: boolean;
  private historyIntervalTicks: number;
  private routeEndPolicy: 'LOOP' | 'COMPLETE';
  private maxBuses: number;
  private clock: () => number;
  private pipeline?: LocationPipelineService;

  constructor(options?: SimulatorOptions, pipeline?: LocationPipelineService) {
    this.tickIntervalMs = options?.tickIntervalMs ?? env.SIMULATOR_TICK_INTERVAL_MS;
    this.speedMultiplier = options?.speedMultiplier ?? env.SIMULATOR_SPEED_MULTIPLIER;
    this.defaultSpeedKmph = options?.defaultSpeedKmph ?? env.SIMULATOR_DEFAULT_SPEED_KMPH;
    this.writeHistory = options?.writeHistory ?? env.SIMULATOR_WRITE_HISTORY;
    this.historyIntervalTicks = options?.historyIntervalTicks ?? env.SIMULATOR_HISTORY_INTERVAL_TICKS;
    this.routeEndPolicy = options?.routeEndPolicy ?? env.SIMULATOR_ROUTE_END_POLICY;
    this.maxBuses = options?.maxBuses ?? env.SIMULATOR_MAX_BUSES ?? 40;
    this.clock = options?.clock ?? Date.now;
    this.pipeline = pipeline ?? options?.pipeline;
  }

  public setPipeline(pipeline: LocationPipelineService): void {
    this.pipeline = pipeline;
  }

  public isRunning(): boolean {
    return this.isSimulating;
  }

  public onObservation(listener: LocationObservationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async getCurrentObservation(
    busId: string | Types.ObjectId
  ): Promise<LocationObservation | null> {
    const idStr = busId.toString();
    const busState = this.activeBuses.get(idStr);

    if (!busState) {
      return locationRepository.getLatestPositionByBusId(busId);
    }

    const now = this.clock();
    return this.buildObservation(busState, now);
  }

  /**
   * Starts or resumes the simulation loop.
   */
  public async start(overrides?: SimulatorOptions): Promise<SimulatorStatusDto> {
    if (!env.SIMULATOR_ENABLED) {
      logger.warn('Simulator start invoked but SIMULATOR_ENABLED is false in configuration');
      return this.getStatus();
    }

    if (overrides) {
      if (overrides.tickIntervalMs !== undefined) this.tickIntervalMs = overrides.tickIntervalMs;
      if (overrides.speedMultiplier !== undefined) this.speedMultiplier = overrides.speedMultiplier;
      if (overrides.defaultSpeedKmph !== undefined) this.defaultSpeedKmph = overrides.defaultSpeedKmph;
      if (overrides.writeHistory !== undefined) this.writeHistory = overrides.writeHistory;
      if (overrides.historyIntervalTicks !== undefined) this.historyIntervalTicks = overrides.historyIntervalTicks;
      if (overrides.routeEndPolicy !== undefined) this.routeEndPolicy = overrides.routeEndPolicy;
      if (overrides.maxBuses !== undefined) this.maxBuses = overrides.maxBuses;
      if (overrides.clock !== undefined) this.clock = overrides.clock;
    }

    // Refresh eligible buses from database
    await this.refreshEligibleBuses();

    if (!this.isSimulating) {
      this.isSimulating = true;
      this.startedAt = new Date(this.clock());

      logger.info(
        {
          activeBuses: this.activeBuses.size,
          tickIntervalMs: this.tickIntervalMs,
          speedMultiplier: this.speedMultiplier,
          routeEndPolicy: this.routeEndPolicy
        },
        'Deterministic Route Simulator started'
      );

      // Perform immediate tick
      await this.tick();

      // Schedule recurring ticks
      this.timer = setInterval(() => {
        void this.tick();
      }, this.tickIntervalMs);

      // Unref timer so it does not block Node process termination
      if (this.timer && typeof this.timer.unref === 'function') {
        this.timer.unref();
      }
    }

    return this.getStatus();
  }

  /**
   * Stops the active simulation timer loop.
   */
  public async stop(): Promise<SimulatorStatusDto> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.isSimulating = false;
    logger.info('Deterministic Route Simulator stopped');
    return this.getStatus();
  }

  /**
   * Resets simulation clock and rewinds all simulated vehicles to their route origins.
   */
  public async reset(): Promise<SimulatorStatusDto> {
    const now = this.clock();

    for (const [, busState] of this.activeBuses) {
      busState.sessionStartTimeMs = now;
      busState.currentDistanceMeters = 0;
      busState.currentLocation = busState.coordinates[0];
      busState.currentHeading =
        busState.coordinates.length >= 2
          ? computeBearingDegrees(busState.coordinates[0], busState.coordinates[1])
          : 0;
      busState.progressRatio = 0;
      busState.isCompleted = false;
      busState.ticksCount = 0;

      const obs = this.buildObservation(busState, now);
      await locationRepository.saveLatestPosition(obs);

      for (const listener of this.listeners) {
        try {
          await listener(obs);
        } catch (err) {
          logger.error({ err }, 'Error in observation listener during simulator reset');
        }
      }
    }

    logger.info({ busesCount: this.activeBuses.size }, 'Deterministic Route Simulator reset to origin');
    return this.getStatus();
  }

  /**
   * Returns current simulation state and active simulated bus progress.
   */
  public getStatus(): SimulatorStatusDto {
    const now = this.clock();
    const uptimeSeconds = this.startedAt
      ? Math.max(0, Math.floor((now - this.startedAt.getTime()) / 1000))
      : 0;

    const buses = Array.from(this.activeBuses.values()).map((b) => ({
      busId: b.busId.toString(),
      registrationNumber: b.registrationNumber,
      fleetNumber: b.fleetNumber,
      tripCode: b.tripCode,
      directionCode: b.directionCode,
      progressPercent: Math.round(b.progressRatio * 1000) / 10,
      speedKmph: b.speedKmph,
      heading: b.currentHeading,
      currentLocation: b.currentLocation,
      isCompleted: b.isCompleted
    }));

    return {
      isRunning: this.isSimulating,
      isEnabled: env.SIMULATOR_ENABLED,
      startedAt: this.startedAt?.toISOString(),
      uptimeSeconds,
      tickIntervalMs: this.tickIntervalMs,
      speedMultiplier: this.speedMultiplier,
      routeEndPolicy: this.routeEndPolicy,
      writeHistory: this.writeHistory,
      activeBusesCount: this.activeBuses.size,
      buses
    };
  }

  /**
   * Manual single-tick invocation (crucial for deterministic unit and integration tests).
   */
  public async tick(): Promise<void> {
    const now = this.clock();

    for (const [, busState] of this.activeBuses) {
      if (busState.isCompleted) {
        continue;
      }

      // Calculate elapsed time from session start
      const elapsedSeconds = Math.max(0, (now - busState.sessionStartTimeMs) / 1000);
      const totalEffectiveDistance =
        elapsedSeconds * busState.speedMetersPerSec * this.speedMultiplier;

      let distanceAlongRoute = totalEffectiveDistance;

      if (busState.totalDistanceMeters > 0) {
        if (this.routeEndPolicy === 'LOOP') {
          distanceAlongRoute = totalEffectiveDistance % busState.totalDistanceMeters;
        } else if (this.routeEndPolicy === 'COMPLETE') {
          if (totalEffectiveDistance >= busState.totalDistanceMeters) {
            distanceAlongRoute = busState.totalDistanceMeters;
            busState.isCompleted = true;
          }
        }
      }

      // Interpolate current position along route polyline
      const interpolated = interpolatePositionAlongPolyline(
        busState.coordinates,
        busState.cumulativeDistances,
        distanceAlongRoute
      );

      busState.currentDistanceMeters = interpolated.distanceAlongRouteMeters;
      busState.currentLocation = interpolated.location;
      busState.currentHeading = interpolated.heading;
      busState.progressRatio = interpolated.progressRatio;
      busState.ticksCount++;

      // Create typed observation
      const observation = this.buildObservation(busState, now);

      // Persist to LatestBusPosition or process via Pipeline
      if (this.pipeline) {
        await this.pipeline.processObservation(observation, {
          routePolylineCoordinates: busState.coordinates,
          persistToHistory:
            this.writeHistory && busState.ticksCount % this.historyIntervalTicks === 0
        });
      } else {
        await locationRepository.saveLatestPosition(observation);

        // Optionally write to 24-hour TTL LocationHistory
        if (
          this.writeHistory &&
          busState.ticksCount % this.historyIntervalTicks === 0
        ) {
          await locationRepository.appendLocationHistory(observation);
        }
      }

      // Dispatch observation to registered listeners
      for (const listener of this.listeners) {
        try {
          await listener(observation);
        } catch (err) {
          logger.error({ err }, 'Error in simulator observation listener');
        }
      }
    }
  }

  /**
   * Refreshes eligible vehicles for simulation based on strict eligibility rules:
   * 1. Bus is active and status is IN_SERVICE (not MAINTENANCE or OFFLINE).
   * 2. Bus is assigned to a trip, or trip has busId assigned.
   * 3. Trip is active (status SCHEDULED or IN_TRANSIT, not COMPLETED or CANCELLED).
   * 4. Route direction exists, is active, and possesses a valid polyline (>= 2 points).
   */
  public async refreshEligibleBuses(): Promise<void> {
    try {
      const buses = await Bus.find({
        isActive: true,
        status: 'IN_SERVICE'
      })
        .limit(this.maxBuses)
        .lean();

      const now = this.clock();
      const currentEligibleBusIds = new Set<string>();

      for (const bus of buses) {
        let assignedTrip = null;

        if (bus.currentAssignedTripId) {
          assignedTrip = await ScheduledTrip.findOne({
            _id: bus.currentAssignedTripId,
            isActive: true,
            status: { $in: ['SCHEDULED', 'IN_TRANSIT'] }
          }).lean();
        }

        if (!assignedTrip) {
          assignedTrip = await ScheduledTrip.findOne({
            busId: bus._id,
            isActive: true,
            status: { $in: ['SCHEDULED', 'IN_TRANSIT'] }
          }).lean();
        }

        if (!assignedTrip) {
          continue;
        }

        const direction = await RouteDirection.findOne({
          _id: assignedTrip.routeDirectionId,
          isActive: true
        }).lean();

        if (
          !direction ||
          !direction.routePolyline ||
          direction.routePolyline.type !== 'LineString' ||
          !Array.isArray(direction.routePolyline.coordinates) ||
          direction.routePolyline.coordinates.length < 2
        ) {
          continue;
        }

        const busIdStr = bus._id.toString();
        currentEligibleBusIds.add(busIdStr);

        // If bus is already in simulation, preserve state
        if (this.activeBuses.has(busIdStr)) {
          continue;
        }

        const rawCoords = direction.routePolyline.coordinates as [number, number][];
        const cumulativeDistances = computePolylineCumulativeDistances(rawCoords);
        const totalDistanceMeters =
          cumulativeDistances[cumulativeDistances.length - 1];

        const speedKmph = this.defaultSpeedKmph;
        const speedMetersPerSec = (speedKmph * 1000) / 3600;

        const newState: SimulatedBusState = {
          busId: bus._id,
          registrationNumber: bus.registrationNumber,
          fleetNumber: bus.fleetNumber,
          tripId: assignedTrip._id,
          tripCode: assignedTrip.tripCode,
          routeId: direction.routeId,
          directionId: direction._id,
          directionCode: direction.directionCode,
          coordinates: rawCoords,
          cumulativeDistances,
          totalDistanceMeters,
          speedKmph,
          speedMetersPerSec,
          sessionStartTimeMs: now,
          currentDistanceMeters: 0,
          currentLocation: rawCoords[0],
          currentHeading: 0,
          progressRatio: 0,
          isCompleted: false,
          ticksCount: 0
        };

        this.activeBuses.set(busIdStr, newState);
      }

      // Remove buses that are no longer eligible (e.g. put into maintenance, trip completed)
      for (const [busIdStr] of this.activeBuses) {
        if (!currentEligibleBusIds.has(busIdStr)) {
          this.activeBuses.delete(busIdStr);
        }
      }
    } catch (err) {
      logger.error({ err }, 'Failed to refresh eligible buses for simulator');
    }
  }

  /**
   * Internal helper: builds typed LocationObservation from simulated state.
   */
  private buildObservation(
    busState: SimulatedBusState,
    timestampMs: number
  ): LocationObservation {
    const timestamp = new Date(timestampMs);

    return {
      busId: busState.busId,
      tripId: busState.tripId,
      routeId: busState.routeId,
      directionId: busState.directionId,
      location: {
        type: 'Point',
        coordinates: busState.currentLocation
      },
      snappedLocation: {
        type: 'Point',
        coordinates: busState.currentLocation
      },
      crossTrackDistanceMeters: 0,
      heading: busState.currentHeading,
      speedKmph: busState.speedKmph,
      accuracyMeters: 5,
      source: 'SIMULATOR',
      trackingStatus: 'SIMULATED',
      validationStatus: 'VALID',
      validationErrors: [],
      recordedAt: timestamp,
      receivedAt: timestamp,
      progressRatio: busState.progressRatio,
      distanceAlongRouteMeters: busState.currentDistanceMeters,
      totalRouteDistanceMeters: busState.totalDistanceMeters
    };
  }

  /**
   * Manually adds a simulated bus for testing with synthetic geometry and clock.
   */
  public addSimulatedBusForTest(state: SimulatedBusState): void {
    this.activeBuses.set(state.busId.toString(), state);
  }

  /**
   * Cleans up all resources on application shutdown.
   */
  public destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isSimulating = false;
    this.activeBuses.clear();
    this.listeners = [];
  }
}

export const routeSimulator = new RouteSimulatorService();
