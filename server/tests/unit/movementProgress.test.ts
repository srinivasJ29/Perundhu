import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { MovementProgressService } from '../../src/modules/location/movementProgress.service';
import { LocationObservation } from '../../src/modules/location/location.types';

describe('Movement Progress & Anomaly Detection (Unit)', () => {
  const progressService = new MovementProgressService({
    maxSpeedKmph: 120,
    maxProgressJumpMeters: 500,
    maxBackwardMeters: 30
  });

  const busId = new Types.ObjectId();
  const tripId = new Types.ObjectId();

  function makeObs(
    coords: [number, number],
    timestampMs: number,
    distanceAlongRoute = 0,
    totalDistance = 5000,
    customTripId = tripId
  ): LocationObservation {
    return {
      busId,
      tripId: customTripId,
      location: { type: 'Point', coordinates: coords },
      heading: 90,
      speedKmph: 30,
      accuracyMeters: 5,
      source: 'SIMULATOR',
      trackingStatus: 'SIMULATED',
      recordedAt: new Date(timestampMs),
      receivedAt: new Date(timestampMs + 500),
      distanceAlongRouteMeters: distanceAlongRoute,
      totalRouteDistanceMeters: totalDistance,
      progressRatio: totalDistance > 0 ? distanceAlongRoute / totalDistance : 0
    };
  }

  it('should accept initial observation when no prior accepted position exists', () => {
    const candidate = makeObs([78.1198, 9.9252], 1700000000000, 100, 5000);
    const result = progressService.evaluateProgress(candidate, null);

    expect(result.isValidMovement).toBe(true);
    expect(result.distanceTraveledMeters).toBe(0);
    expect(result.anomaly).toBeUndefined();
  });

  it('should treat candidate as new baseline if tripId changed', () => {
    const prevTripId = new Types.ObjectId();
    const newTripId = new Types.ObjectId();

    const prev = makeObs([78.1198, 9.9252], 1700000000000, 4800, 5000, prevTripId);
    const candidate = makeObs([78.1198, 9.9252], 1700000010000, 0, 5000, newTripId);

    const result = progressService.evaluateProgress(candidate, prev);
    expect(result.isValidMovement).toBe(true);
    expect(result.distanceTraveledMeters).toBe(0);
  });

  it('should reject out-of-order timestamp where candidate is older than previous', () => {
    const prev = makeObs([78.1198, 9.9252], 1700000010000, 200, 5000);
    const candidate = makeObs([78.1198, 9.9262], 1700000005000, 300, 5000); // 5s earlier

    const result = progressService.evaluateProgress(candidate, prev);
    expect(result.isValidMovement).toBe(false);
    expect(result.anomaly).toBe('OUT_OF_ORDER_TIMESTAMP');
  });

  it('should track smooth normal forward progress', () => {
    // 50 meters forward in 5 seconds = 10 m/s = 36 km/h
    const prev = makeObs([78.1198, 9.9252], 1700000000000, 100, 5000);
    const candidate = makeObs([78.1198, 9.9257], 1700000005000, 150, 5000);

    const result = progressService.evaluateProgress(candidate, prev);
    expect(result.isValidMovement).toBe(true);
    expect(result.elapsedSeconds).toBe(5);
    expect(result.effectiveSpeedKmph).toBeGreaterThan(30);
    expect(result.effectiveSpeedKmph).toBeLessThan(45);
    expect(result.anomaly).toBeUndefined();
  });

  it('should detect and flag implausible jump (teleportation anomaly)', () => {
    // Moving 2000 meters in 2 seconds = 1000 m/s = 3600 km/h
    const prev = makeObs([78.1198, 9.9252], 1700000000000, 100, 5000);
    const candidate = makeObs([78.1398, 9.9252], 1700000002000, 2100, 5000);

    const result = progressService.evaluateProgress(candidate, prev);
    expect(result.isValidMovement).toBe(false);
    expect(result.anomaly).toBe('IMPLAUSIBLE_JUMP');
    expect(result.warning).toContain('Implausible jump');
  });

  it('should detect backward movement anomaly along the route polyline', () => {
    // Moving backwards along route by 80 meters (tolerance is 30 meters)
    const prev = makeObs([78.1198, 9.9300], 1700000000000, 600, 5000);
    const candidate = makeObs([78.1198, 9.9290], 1700000005000, 520, 5000);

    const result = progressService.evaluateProgress(candidate, prev);
    expect(result.isValidMovement).toBe(false);
    expect(result.anomaly).toBe('BACKWARD_MOVEMENT');
    expect(result.warning).toContain('backward progress');
  });

  it('should accept legitimate terminal loop wrap-around without flagging backward anomaly', () => {
    // Total distance = 5000m.
    // Previous was at 4800m (96% of route, approaching terminus).
    // Candidate wrapped around to 50m (1% of route, new loop cycle).
    const prev = makeObs([78.1198, 9.9252], 1700000000000, 4800, 5000);
    const candidate = makeObs([78.1198, 9.9254], 1700000005000, 50, 5000);

    const result = progressService.evaluateProgress(candidate, prev);
    expect(result.isValidMovement).toBe(true);
    expect(result.anomaly).toBeUndefined();
  });
});
