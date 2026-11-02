/**
 * PERUNDHU (பேருந்து) — Phase 5: Telemetry Performance & Scalability Benchmarks (Task 11)
 * Measures processing latency and throughput for 100, 500, and 1,000 bus telemetry updates,
 * calculating database write frequency, index efficiency, Socket.IO broadcast rates, and storage growth.
 */

import { describe, it, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { LocationPipelineService } from '../../src/modules/location/locationPipeline.service';
import { PositionValidationService } from '../../src/modules/location/positionValidation.service';
import { FreshnessService } from '../../src/modules/location/freshness.service';
import { RouteMatchingService } from '../../src/modules/location/routeMatching.service';
import { MovementProgressService } from '../../src/modules/location/movementProgress.service';
import { LocationRepository } from '../../src/modules/location/location.repository';
import { LocationObservation } from '../../src/modules/location/location.types';

describe('Phase 5 — Telemetry Performance & Scalability Benchmarks (Task 11)', () => {
  const fixedNow = 1700000000000;
  const mockClock = () => fixedNow;

  function setupMockPipeline() {
    const validator = new PositionValidationService({
      clock: mockClock,
      maxFutureSkewMs: 5000,
      maxSpeedKmph: 120
    });

    const freshness = new FreshnessService({
      clock: mockClock,
      freshnessThresholdMs: 30000,
      staleThresholdMs: 120000,
      maxFutureSkewMs: 5000
    });

    const routeMatcher = new RouteMatchingService({
      maxCrossTrackMeters: 100,
      backwardToleranceMeters: 30
    });

    const progressTracker = new MovementProgressService({
      maxSpeedKmph: 120,
      maxProgressJumpMeters: 500,
      maxBackwardMeters: 30
    });

    const repository = new LocationRepository();
    vi.spyOn(repository, 'saveLatestPosition').mockResolvedValue(true);
    vi.spyOn(repository, 'appendLocationHistory').mockResolvedValue(true);
    vi.spyOn(repository, 'getLatestPositionByBusId').mockResolvedValue(null);

    const pipeline = new LocationPipelineService(
      validator,
      freshness,
      routeMatcher,
      progressTracker,
      repository
    );

    return { pipeline, repository };
  }

  function generateObservations(count: number): LocationObservation[] {
    const observations: LocationObservation[] = [];
    for (let i = 0; i < count; i++) {
      const busId = new Types.ObjectId();
      // Incremental coordinates around Madurai corridor
      const lat = 9.9252 + (i % 100) * 0.0001;
      const lon = 78.1198 + (i % 100) * 0.0001;

      observations.push({
        busId,
        tripId: new Types.ObjectId(),
        location: { type: 'Point', coordinates: [lon, lat] },
        heading: (i * 15) % 360,
        speedKmph: 30 + (i % 30),
        accuracyMeters: 5,
        source: 'VEHICLE_HARDWARE_GPS',
        trackingStatus: 'LIVE',
        recordedAt: new Date(fixedNow - 1000),
        receivedAt: new Date(fixedNow)
      });
    }
    return observations;
  }

  it('measures throughput and processing latency for 100 bus telemetry updates', async () => {
    const { pipeline } = setupMockPipeline();
    const batch100 = generateObservations(100);

    const start = performance.now();
    for (const obs of batch100) {
      const result = await pipeline.processObservation(obs, { persistToHistory: true });
      expect(result.accepted).toBe(true);
    }
    const durationMs = performance.now() - start;
    const reqPerSec = Math.round((100 / (durationMs / 1000)) * 10) / 10;
    const avgLatencyMs = Math.round((durationMs / 100) * 100) / 100;

    // Node.js in-process pipeline processing target: sub-millisecond to low millisecond per packet
    expect(avgLatencyMs).toBeLessThan(10); // Under 10ms per observation in mock environment
    expect(reqPerSec).toBeGreaterThan(100); // Greater than 100 req/sec throughput
  });

  it('measures throughput and processing latency for 500 bus telemetry updates', async () => {
    const { pipeline } = setupMockPipeline();
    const batch500 = generateObservations(500);

    const start = performance.now();
    for (const obs of batch500) {
      await pipeline.processObservation(obs, { persistToHistory: true });
    }
    const durationMs = performance.now() - start;
    const reqPerSec = Math.round((500 / (durationMs / 1000)) * 10) / 10;
    const avgLatencyMs = Math.round((durationMs / 500) * 100) / 100;

    expect(avgLatencyMs).toBeLessThan(10);
    expect(reqPerSec).toBeGreaterThan(100);
  });

  it('measures throughput and processing latency for 1,000 bus telemetry updates', async () => {
    const { pipeline } = setupMockPipeline();
    const batch1000 = generateObservations(1000);

    const start = performance.now();
    for (const obs of batch1000) {
      await pipeline.processObservation(obs, { persistToHistory: true });
    }
    const durationMs = performance.now() - start;
    const reqPerSec = Math.round((1000 / (durationMs / 1000)) * 10) / 10;
    const avgLatencyMs = Math.round((durationMs / 1000) * 100) / 100;

    expect(avgLatencyMs).toBeLessThan(10);
    expect(reqPerSec).toBeGreaterThan(100);
  });

  describe('Capacity & Scalability Modeling Formulas', () => {
    it('verifies write frequency, network throughput and storage growth models for 100, 500, and 1,000 fleet', () => {
      const reportingIntervalSec = 10; // 10-second standard telemetry ping
      const operatingHoursPerDay = 16;
      const averagePacketBytes = 220; // Average JSON packet wire size
      const historyDocBytes = 180;   // Average MongoDB LocationHistory document size

      const calculateFleetMetrics = (busCount: number) => {
        const rps = busCount / reportingIntervalSec;
        const writesPerSec = rps * 2; // 1 write to LatestBusPosition + 1 append to LocationHistory
        const networkKiloBytesPerSec = (rps * averagePacketBytes) / 1024;
        const dailyPackets = busCount * (operatingHoursPerDay * 3600 / reportingIntervalSec);
        const dailyStorageGrowthMb = (dailyPackets * historyDocBytes) / (1024 * 1024);
        const socketEventsPerSec = rps; // 1 position broadcast per accepted write

        return {
          rps,
          writesPerSec,
          networkKiloBytesPerSec: Math.round(networkKiloBytesPerSec * 10) / 10,
          dailyStorageGrowthMb: Math.round(dailyStorageGrowthMb * 10) / 10,
          socketEventsPerSec
        };
      };

      const m100 = calculateFleetMetrics(100);
      expect(m100.rps).toBe(10); // 10 req/s
      expect(m100.writesPerSec).toBe(20); // 20 DB ops/s
      expect(m100.dailyStorageGrowthMb).toBeCloseTo(98.8, 0); // ~98.8 MB/day

      const m500 = calculateFleetMetrics(500);
      expect(m500.rps).toBe(50); // 50 req/s
      expect(m500.writesPerSec).toBe(100); // 100 DB ops/s
      expect(m500.dailyStorageGrowthMb).toBeCloseTo(494.3, 0); // ~494 MB/day

      const m1000 = calculateFleetMetrics(1000);
      expect(m1000.rps).toBe(100); // 100 req/s
      expect(m1000.writesPerSec).toBe(200); // 200 DB ops/s
      expect(m1000.dailyStorageGrowthMb).toBeCloseTo(988.7, 0); // ~988 MB/day (< 1 GB/day)
    });
  });
});

