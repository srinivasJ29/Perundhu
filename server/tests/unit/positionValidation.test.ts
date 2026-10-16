import { describe, it, expect, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { PositionValidationService } from '../../src/modules/location/positionValidation.service';
import { LocationObservation } from '../../src/modules/location/location.types';

describe('Position Validation Service (Unit)', () => {
  let mockClockTime = 1700000000000;
  const getMockClock = () => mockClockTime;
  let validationService: PositionValidationService;

  beforeEach(() => {
    mockClockTime = 1700000000000;
    validationService = new PositionValidationService({
      clock: getMockClock,
      maxFutureSkewMs: 5000,
      maxSpeedKmph: 120
    });
  });

  function createValidObservation(): LocationObservation {
    return {
      busId: new Types.ObjectId(),
      tripId: new Types.ObjectId(),
      routeId: new Types.ObjectId(),
      directionId: new Types.ObjectId(),
      location: {
        type: 'Point',
        coordinates: [78.1198, 9.9252] // Madurai coordinates
      },
      heading: 90,
      speedKmph: 35,
      accuracyMeters: 5,
      source: 'SIMULATOR',
      trackingStatus: 'SIMULATED',
      recordedAt: new Date(mockClockTime - 2000),
      receivedAt: new Date(mockClockTime)
    };
  }

  describe('Structural & Coordinate Validation', () => {
    it('should accept a completely valid location observation', async () => {
      const obs = createValidObservation();
      const res = await validationService.validateObservation(obs);

      expect(res.isValid).toBe(true);
      expect(res.status).toBe('VALID');
      expect(res.errors).toHaveLength(0);
    });

    it('should reject observation with missing or invalid busId', async () => {
      const obs = createValidObservation();
      (obs as any).busId = 'not-an-object-id';

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.status).toBe('MALFORMED');
      expect(res.errorCode).toBe('INVALID_BUS_ID');
    });

    it('should reject non-finite longitude or latitude coordinates', async () => {
      const obs = createValidObservation();
      obs.location.coordinates = [NaN, 9.9252];

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.status).toBe('MALFORMED');
      expect(res.errorCode).toBe('NON_FINITE_COORDINATES');

      obs.location.coordinates = [78.1198, Infinity];
      const res2 = await validationService.validateObservation(obs);
      expect(res2.isValid).toBe(false);
      expect(res2.errorCode).toBe('NON_FINITE_COORDINATES');
    });

    it('should reject coordinates outside global WGS84 bounds', async () => {
      const obs = createValidObservation();
      obs.location.coordinates = [185.0, 9.9252]; // Longitude > 180

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.status).toBe('MALFORMED');
      expect(res.errorCode).toBe('LONGITUDE_OUT_OF_BOUNDS');

      obs.location.coordinates = [78.1198, -95.0]; // Latitude < -90
      const res2 = await validationService.validateObservation(obs);
      expect(res2.isValid).toBe(false);
      expect(res2.errorCode).toBe('LATITUDE_OUT_OF_BOUNDS');
    });

    it('should warn when coordinate is outside Tamil Nadu regional bounds', async () => {
      const obs = createValidObservation();
      obs.location.coordinates = [0.0, 51.5]; // London, UK

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(true);
      expect(res.warnings.some((w) => w.includes('Tamil Nadu'))).toBe(true);
    });
  });

  describe('Timestamp & Clock Skew Validation', () => {
    it('should reject invalid or non-date recordedAt timestamps', async () => {
      const obs = createValidObservation();
      obs.recordedAt = new Date('invalid-date');

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.status).toBe('MALFORMED');
      expect(res.errorCode).toBe('INVALID_TIMESTAMP');
    });

    it('should accept timestamps within future clock-skew tolerance', async () => {
      const obs = createValidObservation();
      obs.recordedAt = new Date(mockClockTime + 3000); // 3s into the future (within 5s tolerance)

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(true);
    });

    it('should reject timestamps that exceed future clock-skew tolerance', async () => {
      const obs = createValidObservation();
      obs.recordedAt = new Date(mockClockTime + 10000); // 10s into the future (> 5s tolerance)

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.status).toBe('REJECTED');
      expect(res.errorCode).toBe('FUTURE_TIMESTAMP_CLOCK_SKEW');
    });
  });

  describe('Kinematic & Enum Validation', () => {
    it('should reject negative speed', async () => {
      const obs = createValidObservation();
      obs.speedKmph = -15;

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe('INVALID_SPEED');
    });

    it('should flag excessive speed exceeding vehicle limit as SUSPICIOUS', async () => {
      const obs = createValidObservation();
      obs.speedKmph = 145; // Limit is 120 km/h

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(true); // Still accepted, but flagged
      expect(res.status).toBe('SUSPICIOUS');
      expect(res.errorCode).toBe('EXCESSIVE_SPEED');
    });

    it('should reject invalid heading out of [0, 360] range', async () => {
      const obs = createValidObservation();
      obs.heading = 400;

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe('INVALID_HEADING');
    });

    it('should reject unrecognized source enum', async () => {
      const obs = createValidObservation();
      (obs as any).source = 'UNKNOWN_SATELLITE_FEED';

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe('INVALID_SOURCE');
    });

    it('should reject unrecognized tracking status enum', async () => {
      const obs = createValidObservation();
      (obs as any).trackingStatus = 'SUPER_FAST';

      const res = await validationService.validateObservation(obs);
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe('INVALID_TRACKING_STATUS');
    });
  });
});
