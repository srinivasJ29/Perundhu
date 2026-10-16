import { describe, it, expect, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { FreshnessService } from '../../src/modules/location/freshness.service';
import { LocationObservation } from '../../src/modules/location/location.types';

describe('Freshness Evaluation Service (Unit)', () => {
  let mockClockTime = 1700000000000;
  const getMockClock = () => mockClockTime;
  let freshnessService: FreshnessService;

  beforeEach(() => {
    mockClockTime = 1700000000000;
    freshnessService = new FreshnessService({
      clock: getMockClock,
      freshnessThresholdMs: 30000, // 30s
      staleThresholdMs: 120000,    // 120s
      maxFutureSkewMs: 5000       // 5s
    });
  });

  function createObsWithAge(
    ageSeconds: number,
    source: 'SIMULATOR' | 'AUTHORIZED_MOBILE_GPS' = 'SIMULATOR'
  ): LocationObservation {
    const recordedAt = new Date(mockClockTime - ageSeconds * 1000);
    return {
      busId: new Types.ObjectId(),
      location: { type: 'Point', coordinates: [78.1198, 9.9252] },
      heading: 90,
      speedKmph: 30,
      accuracyMeters: 5,
      source,
      trackingStatus: 'SIMULATED',
      recordedAt,
      receivedAt: new Date(mockClockTime)
    };
  }

  describe('Freshness Classification', () => {
    it('should classify an observation recorded 10 seconds ago as FRESH', () => {
      const obs = createObsWithAge(10);
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.classification).toBe('FRESH');
      expect(evalResult.isFresh).toBe(true);
      expect(evalResult.isDelayed).toBe(false);
      expect(evalResult.isStale).toBe(false);
      expect(evalResult.ageSeconds).toBe(10);
    });

    it('should classify an observation recorded 60 seconds ago as DELAYED', () => {
      const obs = createObsWithAge(60);
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.classification).toBe('DELAYED');
      expect(evalResult.isFresh).toBe(false);
      expect(evalResult.isDelayed).toBe(true);
      expect(evalResult.isStale).toBe(false);
      expect(evalResult.ageSeconds).toBe(60);
    });

    it('should classify an observation recorded 180 seconds ago as STALE', () => {
      const obs = createObsWithAge(180);
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.classification).toBe('STALE');
      expect(evalResult.isFresh).toBe(false);
      expect(evalResult.isDelayed).toBe(false);
      expect(evalResult.isStale).toBe(true);
      expect(evalResult.ageSeconds).toBe(180);
    });

    it('should classify an observation 10 seconds into the future as FUTURE_REJECTED', () => {
      const obs = createObsWithAge(-10); // Future timestamp
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.classification).toBe('FUTURE_REJECTED');
      expect(evalResult.isFuture).toBe(true);
      expect(evalResult.isFresh).toBe(false);
    });
  });

  describe('Source & Tracking Status Mapping', () => {
    it('should map fresh SIMULATOR data to SIMULATED (never LIVE)', () => {
      const obs = createObsWithAge(5, 'SIMULATOR');
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.assignedTrackingStatus).toBe('SIMULATED');
      expect(evalResult.assignedTrackingStatus).not.toBe('LIVE');
    });

    it('should map stale SIMULATOR data to STALE', () => {
      const obs = createObsWithAge(200, 'SIMULATOR');
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.assignedTrackingStatus).toBe('STALE');
    });

    it('should map fresh real GPS data to LIVE', () => {
      const obs = createObsWithAge(10, 'AUTHORIZED_MOBILE_GPS');
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.assignedTrackingStatus).toBe('LIVE');
    });

    it('should map delayed real GPS data to DELAYED', () => {
      const obs = createObsWithAge(45, 'AUTHORIZED_MOBILE_GPS');
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.assignedTrackingStatus).toBe('DELAYED');
    });

    it('should map stale real GPS data to STALE', () => {
      const obs = createObsWithAge(300, 'AUTHORIZED_MOBILE_GPS');
      const evalResult = freshnessService.evaluateObservation(obs);

      expect(evalResult.assignedTrackingStatus).toBe('STALE');
    });

    it('should preserve explicit OFFLINE operational status', () => {
      const obs = createObsWithAge(5, 'AUTHORIZED_MOBILE_GPS');
      obs.trackingStatus = 'OFFLINE';

      const evalResult = freshnessService.evaluateObservation(obs);
      expect(evalResult.assignedTrackingStatus).toBe('OFFLINE');
    });
  });
});
