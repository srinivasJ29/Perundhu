import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Types } from 'mongoose';
import {
  RouteSimulatorService,
  SimulatedBusState
} from '../../src/modules/location/simulator.service';
import { locationRepository } from '../../src/modules/location/location.repository';
import { computePolylineCumulativeDistances } from '../../src/modules/location/geoMath';

describe('Deterministic Route Simulator Engine (Unit)', () => {
  let mockTime = 1700000000000; // Base reference timestamp (ms)
  const getMockClock = () => mockTime;

  beforeEach(() => {
    mockTime = 1700000000000;
    vi.restoreAllMocks();
    vi.spyOn(locationRepository, 'saveLatestPosition').mockResolvedValue(true);
    vi.spyOn(locationRepository, 'appendLocationHistory').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createTestBusState(
    speedKmph = 36, // 36 km/h = 10 meters/second
    startTime = mockTime
  ): SimulatedBusState {
    // 3-point route: [78.0, 9.0] -> [78.0, 9.01] (~1110m) -> [78.0, 9.02] (~1110m)
    const coordinates: [number, number][] = [
      [78.0, 9.0],
      [78.0, 9.01],
      [78.0, 9.02]
    ];
    const cumulativeDistances = computePolylineCumulativeDistances(coordinates);
    const totalDistanceMeters = cumulativeDistances[cumulativeDistances.length - 1];

    const speedMetersPerSec = (speedKmph * 1000) / 3600; // 10 m/s

    return {
      busId: new Types.ObjectId(),
      registrationNumber: 'TN-58-N-TEST',
      fleetNumber: 'MDU-TEST-01',
      tripId: new Types.ObjectId(),
      tripCode: 'TRIP-SIM-01',
      routeId: new Types.ObjectId(),
      directionId: new Types.ObjectId(),
      directionCode: 'OUTBOUND',
      coordinates,
      cumulativeDistances,
      totalDistanceMeters,
      speedKmph,
      speedMetersPerSec,
      sessionStartTimeMs: startTime,
      currentDistanceMeters: 0,
      currentLocation: coordinates[0],
      currentHeading: 0,
      progressRatio: 0,
      isCompleted: false,
      ticksCount: 0
    };
  }

  it('should remain at origin at elapsed time t = 0', async () => {
    const simulator = new RouteSimulatorService({
      clock: getMockClock,
      tickIntervalMs: 1000,
      speedMultiplier: 1
    });

    const busState = createTestBusState(36, mockTime);
    simulator.addSimulatedBusForTest(busState);

    await simulator.tick();

    expect(busState.currentDistanceMeters).toBe(0);
    expect(busState.currentLocation).toEqual(busState.coordinates[0]);
    expect(busState.progressRatio).toBe(0);
    expect(busState.ticksCount).toBe(1);

    simulator.destroy();
  });

  it('should advance vehicle position deterministically with elapsed time', async () => {
    const simulator = new RouteSimulatorService({
      clock: getMockClock,
      tickIntervalMs: 1000,
      speedMultiplier: 1
    });

    const busState = createTestBusState(36, mockTime); // 10 m/s
    simulator.addSimulatedBusForTest(busState);

    // Advance clock by 50 seconds -> expected distance = 50s * 10 m/s = 500 meters
    mockTime += 50 * 1000;
    await simulator.tick();

    expect(busState.currentDistanceMeters).toBeCloseTo(500, 0);
    expect(busState.progressRatio).toBeGreaterThan(0.2);
    expect(busState.progressRatio).toBeLessThan(0.3);
    // Heading due North (0 degrees)
    expect(Math.round(busState.currentHeading)).toBe(0);

    simulator.destroy();
  });

  it('should double distance traveled when speedMultiplier is 2.0x', async () => {
    const simulator = new RouteSimulatorService({
      clock: getMockClock,
      tickIntervalMs: 1000,
      speedMultiplier: 2.0
    });

    const busState = createTestBusState(36, mockTime); // 10 m/s * 2 = 20 m/s effective
    simulator.addSimulatedBusForTest(busState);

    // Advance clock by 50 seconds -> expected distance = 50s * 20 m/s = 1000 meters
    mockTime += 50 * 1000;
    await simulator.tick();

    expect(busState.currentDistanceMeters).toBeCloseTo(1000, 0);

    simulator.destroy();
  });

  it('should loop back to origin when routeEndPolicy is LOOP and elapsed exceeds total distance', async () => {
    const simulator = new RouteSimulatorService({
      clock: getMockClock,
      tickIntervalMs: 1000,
      speedMultiplier: 1,
      routeEndPolicy: 'LOOP'
    });

    const busState = createTestBusState(36, mockTime); // total distance ~2223 meters
    simulator.addSimulatedBusForTest(busState);

    const totalDist = busState.totalDistanceMeters;
    // Time required for 1 full loop = totalDist / 10 m/s
    const secondsForFullLoop = totalDist / 10;

    // Advance clock by 1.25 loops
    mockTime += (secondsForFullLoop * 1.25) * 1000;
    await simulator.tick();

    // Distance along route should wrap around to 0.25 of total distance
    expect(busState.isCompleted).toBe(false);
    expect(busState.currentDistanceMeters).toBeCloseTo(totalDist * 0.25, 0);
    expect(busState.progressRatio).toBeCloseTo(0.25, 2);

    simulator.destroy();
  });

  it('should halt at destination when routeEndPolicy is COMPLETE and elapsed exceeds total distance', async () => {
    const simulator = new RouteSimulatorService({
      clock: getMockClock,
      tickIntervalMs: 1000,
      speedMultiplier: 1,
      routeEndPolicy: 'COMPLETE'
    });

    const busState = createTestBusState(36, mockTime);
    simulator.addSimulatedBusForTest(busState);

    const totalDist = busState.totalDistanceMeters;
    // Advance time well beyond arrival time
    mockTime += 5000 * 1000;
    await simulator.tick();

    expect(busState.isCompleted).toBe(true);
    expect(busState.currentDistanceMeters).toBe(totalDist);
    expect(busState.progressRatio).toBe(1);
    expect(busState.currentLocation).toEqual(busState.coordinates[2]);

    simulator.destroy();
  });

  it('should reset simulated buses back to origin and progress to 0 on reset()', async () => {
    const simulator = new RouteSimulatorService({
      clock: getMockClock,
      tickIntervalMs: 1000
    });

    const busState = createTestBusState(36, mockTime);
    simulator.addSimulatedBusForTest(busState);

    // Advance 50 seconds
    mockTime += 50 * 1000;
    await simulator.tick();
    expect(busState.currentDistanceMeters).toBeGreaterThan(0);

    // Reset
    await simulator.reset();
    expect(busState.currentDistanceMeters).toBe(0);
    expect(busState.currentLocation).toEqual(busState.coordinates[0]);
    expect(busState.progressRatio).toBe(0);
    expect(busState.isCompleted).toBe(false);

    simulator.destroy();
  });

  it('should dispatch typed observations to registered listeners on tick', async () => {
    const simulator = new RouteSimulatorService({
      clock: getMockClock,
      tickIntervalMs: 1000
    });

    const busState = createTestBusState(36, mockTime);
    simulator.addSimulatedBusForTest(busState);

    const observations: any[] = [];
    const unsubscribe = simulator.onObservation((obs) => {
      observations.push(obs);
    });

    mockTime += 10 * 1000;
    await simulator.tick();

    expect(observations).toHaveLength(1);
    expect(observations[0].source).toBe('SIMULATOR');
    expect(observations[0].trackingStatus).toBe('SIMULATED');
    expect(observations[0].busId).toEqual(busState.busId);

    unsubscribe();
    await simulator.tick();
    expect(observations).toHaveLength(1); // Unsubscribed, no new observation pushed

    simulator.destroy();
  });
});
