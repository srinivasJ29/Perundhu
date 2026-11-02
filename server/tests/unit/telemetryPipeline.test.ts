/**
 * PERUNDHU (பேருந்து) — Phase 5: Telemetry Pipeline & Source Priority Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import {
  LocationRepository,
  SOURCE_PRIORITY_RANK
} from '../../src/modules/location/location.repository';
import { PositionValidationService } from '../../src/modules/location/positionValidation.service';
import { FreshnessService } from '../../src/modules/location/freshness.service';
import { LocationPipelineService } from '../../src/modules/location/locationPipeline.service';
import { RouteMatchingService } from '../../src/modules/location/routeMatching.service';
import { MovementProgressService } from '../../src/modules/location/movementProgress.service';
import { DeviceHealthService } from '../../src/modules/devices/deviceHealth.service';
import { TelemetryMetricsService } from '../../src/modules/location/telemetryMetrics.service';
import { LocationObservation, LocationSource } from '../../src/modules/location/location.types';
import { LatestBusPosition, LocationHistory } from '../../src/models';

describe('Phase 5 — Telemetry Processing & Source Priority (Unit)', () => {
  let mockTime = 1700000000000;
  const getMockClock = () => mockTime;

  let validator: PositionValidationService;
  let freshness: FreshnessService;
  let repository: LocationRepository;
  let pipeline: LocationPipelineService;
  let deviceHealthService: DeviceHealthService;
  let metricsService: TelemetryMetricsService;

  const busId = new Types.ObjectId();
  const tripId = new Types.ObjectId();

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

    repository = new LocationRepository();
    deviceHealthService = new DeviceHealthService();
    metricsService = new TelemetryMetricsService();

    const routeMatcher = new RouteMatchingService();
    const progressTracker = new MovementProgressService();
    pipeline = new LocationPipelineService(
      validator,
      freshness,
      routeMatcher,
      progressTracker,
      repository
    );
  });

  function createObservation(
    source: LocationSource,
    ageMs = 2000,
    coords: [number, number] = [78.1198, 9.9252],
    speed = 40,
    heading = 90
  ): LocationObservation {
    return {
      busId,
      tripId,
      location: { type: 'Point', coordinates: coords },
      heading,
      speedKmph: speed,
      accuracyMeters: 5,
      source,
      trackingStatus: source === 'SIMULATOR' ? 'SIMULATED' : 'LIVE',
      recordedAt: new Date(mockTime - ageMs),
      receivedAt: new Date(mockTime)
    };
  }

  describe('Task 5 — Source Priority & Competing Telemetry Rules', () => {
    it('should verify defined priority rank order', () => {
      expect(SOURCE_PRIORITY_RANK.VEHICLE_HARDWARE_GPS).toBeGreaterThan(
        SOURCE_PRIORITY_RANK.OFFICIAL_FLEET_FEED
      );
      expect(SOURCE_PRIORITY_RANK.OFFICIAL_FLEET_FEED).toBeGreaterThan(
        SOURCE_PRIORITY_RANK.AUTHORIZED_MOBILE_GPS
      );
      expect(SOURCE_PRIORITY_RANK.AUTHORIZED_MOBILE_GPS).toBeGreaterThan(
        SOURCE_PRIORITY_RANK.ETM_GPS
      );
      expect(SOURCE_PRIORITY_RANK.ETM_GPS).toBeGreaterThan(
        SOURCE_PRIORITY_RANK.MANUAL_DISPATCH
      );
      expect(SOURCE_PRIORITY_RANK.MANUAL_DISPATCH).toBeGreaterThan(
        SOURCE_PRIORITY_RANK.SIMULATOR
      );
    });

    it('should strictly reject simulated observations when physical GPS is active on the bus', async () => {
      // Prior position is real vehicle hardware GPS
      const existingRealPosition = createObservation('VEHICLE_HARDWARE_GPS', 10000);
      vi.spyOn(repository, 'getLatestPositionByBusId').mockResolvedValue(existingRealPosition);
      const saveSpy = vi.spyOn(repository, 'saveLatestPosition');

      // Attempt to process simulated observation
      const simulatedObs = createObservation('SIMULATOR', 1000);
      const result = await pipeline.processObservation(simulatedObs);

      expect(result.accepted).toBe(false);
      expect(result.rejectionReason).toContain('Physical telemetry is active');
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should allow physical hardware GPS to immediately supersede simulator telemetry', async () => {
      // Prior position is simulator
      const existingSimulatedPosition = createObservation('SIMULATOR', 20000);
      vi.spyOn(repository, 'getLatestPositionByBusId').mockResolvedValue(existingSimulatedPosition);
      vi.spyOn(repository, 'saveLatestPosition').mockResolvedValue(true);

      // Ingest real hardware GPS
      const hardwareObs = createObservation('VEHICLE_HARDWARE_GPS', 5000);
      const result = await pipeline.processObservation(hardwareObs);

      expect(result.accepted).toBe(true);
      expect(result.observation.source).toBe('VEHICLE_HARDWARE_GPS');
      expect(result.observation.trackingStatus).toBe('LIVE');
    });

    it('should reject a lower-priority source from displacing active higher-priority telemetry', async () => {
      // Prior position is active hardware GPS (recorded 60 seconds ago, within 10-minute active window)
      const existingHardwarePosition = createObservation('VEHICLE_HARDWARE_GPS', 60000);
      vi.spyOn(repository, 'getLatestPositionByBusId').mockResolvedValue(existingHardwarePosition);
      const saveSpy = vi.spyOn(repository, 'saveLatestPosition');

      // Candidate is authorized mobile app GPS (priority 60 vs 100)
      const mobileObs = createObservation('AUTHORIZED_MOBILE_GPS', 10000);
      const result = await pipeline.processObservation(mobileObs);

      expect(result.accepted).toBe(false);
      expect(result.rejectionReason).toContain('Higher-priority telemetry source');
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should reject out-of-order/stale timestamp from overwriting newer latest position', async () => {
      const existingPosition = createObservation('VEHICLE_HARDWARE_GPS', 5000); // 5 seconds ago
      vi.spyOn(repository, 'getLatestPositionByBusId').mockResolvedValue(existingPosition);

      // Candidate timestamp is 15 seconds ago (older than existing 5s ago)
      const staleObs = createObservation('VEHICLE_HARDWARE_GPS', 15000);
      const result = await pipeline.processObservation(staleObs);

      expect(result.accepted).toBe(false);
      expect(result.validationResult.errorCode).toBe('OUT_OF_ORDER_TIMESTAMP');
      expect(result.persistedLatest).toBe(false);
    });
  });

  describe('Task 3 — Telemetry Validation', () => {
    it('should validate all supported location sources', async () => {
      const sources: LocationSource[] = [
        'VEHICLE_HARDWARE_GPS',
        'OFFICIAL_FLEET_FEED',
        'AUTHORIZED_MOBILE_GPS',
        'ETM_GPS',
        'MANUAL_DISPATCH',
        'SIMULATOR'
      ];

      for (const source of sources) {
        const obs = createObservation(source);
        const result = await validator.validateObservation(obs);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should reject invalid location source', async () => {
      const obs = createObservation('UNKNOWN_SOURCE' as any);
      const result = await validator.validateObservation(obs);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_SOURCE');
    });

    it('should reject non-finite and out-of-bound coordinates', async () => {
      const badLat = createObservation('VEHICLE_HARDWARE_GPS', 1000, [78.1198, 95]); // Lat > 90
      const resLat = await validator.validateObservation(badLat);
      expect(resLat.isValid).toBe(false);
      expect(resLat.errorCode).toBe('LATITUDE_OUT_OF_BOUNDS');

      const badLon = createObservation('VEHICLE_HARDWARE_GPS', 1000, [190, 9.9252]); // Lon > 180
      const resLon = await validator.validateObservation(badLon);
      expect(resLon.isValid).toBe(false);
      expect(resLon.errorCode).toBe('LONGITUDE_OUT_OF_BOUNDS');
    });
  });

  describe('Task 8 — Device Health Evaluation', () => {
    it('should classify device as HEALTHY when communication is within 30s with 3D GPS fix', () => {
      const lastCommunication = new Date(mockTime - 10000); // 10s ago
      const evaluation = deviceHealthService.evaluateDeviceHealth(
        lastCommunication,
        0,
        '3D',
        8,
        mockTime
      );

      expect(evaluation.healthStatus).toBe('HEALTHY');
      expect(evaluation.networkConnectivity).toBe('ONLINE');
      expect(evaluation.gpsSignalStatus).toBe('ACQUIRED_3D');
    });

    it('should distinguish network connectivity from GPS fix (distinguish online HTTP with NO_FIX)', () => {
      const lastCommunication = new Date(mockTime - 5000); // 5s ago (HTTP online)
      const evaluation = deviceHealthService.evaluateDeviceHealth(
        lastCommunication,
        0,
        'NO_FIX',
        2, // Insufficient satellites
        mockTime
      );

      expect(evaluation.networkConnectivity).toBe('ONLINE'); // Network is working
      expect(evaluation.gpsSignalStatus).toBe('NO_FIX');    // GNSS fix is lost
      expect(evaluation.healthStatus).toBe('DELAYED');
      expect(evaluation.diagnosticSummary).toContain('NO FIX');
    });

    it('should classify device as DELAYED when communication is between 30s and 2 minutes', () => {
      const lastCommunication = new Date(mockTime - 60000); // 1 minute ago
      const evaluation = deviceHealthService.evaluateDeviceHealth(
        lastCommunication,
        0,
        '3D',
        6,
        mockTime
      );

      expect(evaluation.healthStatus).toBe('DELAYED');
      expect(evaluation.networkConnectivity).toBe('DELAYED');
    });

    it('should classify device as STALE when communication is between 2 and 10 minutes', () => {
      const lastCommunication = new Date(mockTime - 300000); // 5 minutes ago
      const evaluation = deviceHealthService.evaluateDeviceHealth(
        lastCommunication,
        0,
        '3D',
        6,
        mockTime
      );

      expect(evaluation.healthStatus).toBe('STALE');
      expect(evaluation.networkConnectivity).toBe('STALE');
    });

    it('should classify device as OFFLINE when communication exceeds 10 minutes', () => {
      const lastCommunication = new Date(mockTime - 900000); // 15 minutes ago
      const evaluation = deviceHealthService.evaluateDeviceHealth(
        lastCommunication,
        0,
        '3D',
        6,
        mockTime
      );

      expect(evaluation.healthStatus).toBe('OFFLINE');
      expect(evaluation.networkConnectivity).toBe('OFFLINE');
    });

    it('should classify device as FAULTY when consecutive failures reach 5', () => {
      const lastCommunication = new Date(mockTime - 10000);
      const evaluation = deviceHealthService.evaluateDeviceHealth(
        lastCommunication,
        5, // 5 consecutive failures
        '3D',
        6,
        mockTime
      );

      expect(evaluation.healthStatus).toBe('FAULTY');
      expect(evaluation.diagnosticSummary).toContain('failure threshold');
    });
  });

  describe('Task 10 — Telemetry Metrics Collection', () => {
    it('should record message receipts, acceptances, rejections, duplicates, and compute average latency', () => {
      metricsService.reset();

      // Simulate 3 received messages
      metricsService.recordReceived('VEHICLE_HARDWARE_GPS');
      metricsService.recordReceived('VEHICLE_HARDWARE_GPS');
      metricsService.recordReceived('SIMULATOR');

      // 2 accepted with latencies 10ms and 20ms
      metricsService.recordAccepted('VEHICLE_HARDWARE_GPS', 10);
      metricsService.recordAccepted('VEHICLE_HARDWARE_GPS', 20);

      // 1 rejected with latency 15ms
      metricsService.recordRejected('BUS_NOT_FOUND', 15);
      metricsService.recordDuplicate();
      metricsService.recordAuthFailure('INVALID_SIGNATURE');

      const summary = metricsService.getSummary();

      expect(summary.totalReceived).toBe(3);
      expect(summary.acceptedCount).toBe(2);
      expect(summary.rejectedCount).toBe(1);
      expect(summary.duplicateCount).toBe(1);
      expect(summary.authFailureCount).toBe(1);
      // Avg latency: (10 + 20 + 15) / 3 = 15.0ms
      expect(summary.averageProcessingLatencyMs).toBe(15);
      expect(summary.sourceDistribution['VEHICLE_HARDWARE_GPS']).toBe(2);
      expect(summary.sourceDistribution['SIMULATOR']).toBe(1);
      expect(summary.rejectionReasons['BUS_NOT_FOUND']).toBe(1);
    });
  });
});
