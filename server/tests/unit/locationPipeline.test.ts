import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { LocationPipelineService } from '../../src/modules/location/locationPipeline.service';
import { PositionValidationService } from '../../src/modules/location/positionValidation.service';
import { FreshnessService } from '../../src/modules/location/freshness.service';
import { RouteMatchingService } from '../../src/modules/location/routeMatching.service';
import { MovementProgressService } from '../../src/modules/location/movementProgress.service';
import { LocationRepository } from '../../src/modules/location/location.repository';
import { LocationObservation } from '../../src/modules/location/location.types';

describe('Location Pipeline Service (Unit)', () => {
  let mockTime = 1700000000000;
  const getMockClock = () => mockTime;

  let validator: PositionValidationService;
  let freshness: FreshnessService;
  let routeMatcher: RouteMatchingService;
  let progressTracker: MovementProgressService;
  let repository: LocationRepository;
  let pipeline: LocationPipelineService;

  const busId = new Types.ObjectId();
  const tripId = new Types.ObjectId();

  const corridorCoords: [number, number][] = [
    [78.1198, 9.9252],
    [78.1198, 9.9352],
    [78.1298, 9.9352]
  ];

  beforeEach(() => {
    mockTime = 1700000000000;
    vi.restoreAllMocks();

    validator = new PositionValidationService({
      clock: getMockClock,
      maxFutureSkewMs: 5000,
      maxSpeedKmph: 120
    });

    freshness = new FreshnessService({
      clock: getMockClock,
      freshnessThresholdMs: 30000,
      staleThresholdMs: 120000,
      maxFutureSkewMs: 5000
    });

    routeMatcher = new RouteMatchingService({
      maxCrossTrackMeters: 100,
      backwardToleranceMeters: 30
    });

    progressTracker = new MovementProgressService({
      maxSpeedKmph: 120,
      maxProgressJumpMeters: 500,
      maxBackwardMeters: 30
    });

    repository = new LocationRepository();
    vi.spyOn(repository, 'saveLatestPosition').mockResolvedValue(true);
    vi.spyOn(repository, 'appendLocationHistory').mockResolvedValue(true);
    vi.spyOn(repository, 'getLatestPositionByBusId').mockResolvedValue(null);

    pipeline = new LocationPipelineService(
      validator,
      freshness,
      routeMatcher,
      progressTracker,
      repository
    );
  });

  function createSampleObservation(
    coords: [number, number] = [78.1198, 9.9252],
    ageMs = 2000,
    source: 'SIMULATOR' | 'AUTHORIZED_MOBILE_GPS' = 'SIMULATOR'
  ): LocationObservation {
    const recordedAt = new Date(mockTime - ageMs);
    return {
      busId,
      tripId,
      location: { type: 'Point', coordinates: coords },
      heading: 90,
      speedKmph: 35,
      accuracyMeters: 5,
      source,
      trackingStatus: 'SIMULATED',
      recordedAt,
      receivedAt: new Date(mockTime)
    };
  }

  it('should process a valid observation end-to-end and persist to latest position', async () => {
    const obs = createSampleObservation([78.1198, 9.9252], 2000, 'SIMULATOR');

    const result = await pipeline.processObservation(obs, {
      routePolylineCoordinates: corridorCoords
    });

    expect(result.accepted).toBe(true);
    expect(result.validationResult.isValid).toBe(true);
    expect(result.freshness.classification).toBe('FRESH');
    expect(result.observation.trackingStatus).toBe('SIMULATED');
    expect(result.snappingResult).toBeDefined();
    expect(result.snappingResult?.isOffRoute).toBe(false);
    expect(result.persistedLatest).toBe(true);
  });

  it('should reject malformed observation with invalid coordinates at Stage 1', async () => {
    const obs = createSampleObservation([NaN, 9.9252]);

    const result = await pipeline.processObservation(obs);

    expect(result.accepted).toBe(false);
    expect(result.validationResult.isValid).toBe(false);
    expect(result.validationResult.errorCode).toBe('NON_FINITE_COORDINATES');
    expect(result.persistedLatest).toBe(false);
  });

  it('should reject observation exceeding future clock skew at Stage 2', async () => {
    const obs = createSampleObservation([78.1198, 9.9252], -15000); // 15s in the future

    const result = await pipeline.processObservation(obs);

    expect(result.accepted).toBe(false);
    expect(result.validationResult.errorCode).toBe('FUTURE_TIMESTAMP_CLOCK_SKEW');
    expect(result.persistedLatest).toBe(false);
  });

  it('should reject out-of-order observation at Stage 5', async () => {
    const prevObs = createSampleObservation([78.1198, 9.9252], 2000);
    vi.spyOn(repository, 'getLatestPositionByBusId').mockResolvedValue(prevObs);

    // Candidate has an older timestamp (3000ms ago vs 2000ms ago)
    const olderCandidate = createSampleObservation([78.1198, 9.9260], 3000);

    const result = await pipeline.processObservation(olderCandidate);

    expect(result.accepted).toBe(false);
    expect(result.validationResult.errorCode).toBe('OUT_OF_ORDER_TIMESTAMP');
    expect(result.persistedLatest).toBe(false);
  });

  it('should flag off-route observation as DEVIATED and SUSPECT without discarding coordinates', async () => {
    // Coordinate 800 meters off-corridor
    const offRouteCoord: [number, number] = [78.1300, 9.9100];
    const obs = createSampleObservation(offRouteCoord, 1000);

    const result = await pipeline.processObservation(obs, {
      routePolylineCoordinates: corridorCoords
    });

    expect(result.accepted).toBe(true); // Persisted for tracking/diagnostic visibility
    expect(result.observation.trackingStatus).toBe('DEVIATED');
    expect(result.observation.validationStatus).toBe('SUSPECT');
    expect(result.observation.validationErrors).toContain('EXCESSIVE_CROSS_TRACK_DEVIATION');
    // Original GPS coordinate must remain intact
    expect(result.observation.location.coordinates).toEqual(offRouteCoord);
  });

  it('should map fresh authorized physical GPS observation to LIVE', async () => {
    const obs = createSampleObservation([78.1198, 9.9252], 3000, 'AUTHORIZED_MOBILE_GPS');

    const result = await pipeline.processObservation(obs, {
      routePolylineCoordinates: corridorCoords
    });

    expect(result.accepted).toBe(true);
    expect(result.observation.trackingStatus).toBe('LIVE');
    expect(result.observation.source).toBe('AUTHORIZED_MOBILE_GPS');
  });

  it('should never map simulated observation to LIVE', async () => {
    const obs = createSampleObservation([78.1198, 9.9252], 1000, 'SIMULATOR');

    const result = await pipeline.processObservation(obs, {
      routePolylineCoordinates: corridorCoords
    });

    expect(result.accepted).toBe(true);
    expect(result.observation.trackingStatus).toBe('SIMULATED');
    expect(result.observation.trackingStatus).not.toBe('LIVE');
  });
});
