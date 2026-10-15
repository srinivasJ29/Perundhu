import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import {
  District,
  BusStand,
  Stop,
  Route,
  RouteDirection,
  RouteStopSequence,
  Bus,
  ScheduledTrip,
  TripStopTime,
  LatestBusPosition,
  LocationHistory
} from '../../src/models';

describe('Data Models & Schema Validations', () => {
  describe('District Model', () => {
    it('should validate a complete district', () => {
      const doc = new District({
        code: 'mdu',
        nameEn: 'Madurai',
        nameTa: 'மதுரை',
        headquarters: 'Madurai'
      });
      const err = doc.validateSync();
      expect(err).toBeUndefined();
      expect(doc.code).toBe('MDU'); // Auto-uppercased
    });

    it('should fail when required fields are missing', () => {
      const doc = new District({});
      const err = doc.validateSync();
      expect(err?.errors['code']).toBeDefined();
      expect(err?.errors['nameEn']).toBeDefined();
      expect(err?.errors['nameTa']).toBeDefined();
      expect(err?.errors['headquarters']).toBeDefined();
    });

    it('should have a unique index on code', () => {
      const indexes = District.schema.indexes();
      const codeIndex = indexes.find(([spec]) => spec.code === 1);
      expect(codeIndex).toBeDefined();
      expect(codeIndex?.[1]?.unique).toBe(true);
    });
  });

  describe('BusStand Model', () => {
    it('should validate a valid bus stand with 2dsphere index', () => {
      const doc = new BusStand({
        districtId: new Types.ObjectId(),
        code: 'MDU-MGR',
        nameEn: 'Mattuthavani',
        nameTa: 'மாட்டுத்தாவணி',
        location: {
          type: 'Point',
          coordinates: [78.1633, 9.9472]
        },
        standType: 'INTERCITY_TERMINAL',
        totalPlatforms: 8
      });
      expect(doc.validateSync()).toBeUndefined();

      const indexes = BusStand.schema.indexes();
      const geoIndex = indexes.find(([spec]) => spec.location === '2dsphere');
      expect(geoIndex).toBeDefined();
    });

    it('should reject invalid bus stand type enum', () => {
      const doc = new BusStand({
        districtId: new Types.ObjectId(),
        code: 'MDU-TEST',
        nameEn: 'Test',
        nameTa: 'டெஸ்ட்',
        location: { type: 'Point', coordinates: [78.1, 9.9] },
        standType: 'AIRPORT_TERMINAL' as any
      });
      const err = doc.validateSync();
      expect(err?.errors['standType']).toBeDefined();
    });
  });

  describe('Stop Model', () => {
    it('should register a 2dsphere index and unique code index', () => {
      const indexes = Stop.schema.indexes();
      const geoIndex = indexes.find(([spec]) => spec.location === '2dsphere');
      const codeIndex = indexes.find(([spec]) => spec.code === 1);
      expect(geoIndex).toBeDefined();
      expect(codeIndex?.[1]?.unique).toBe(true);
    });
  });

  describe('Route and RouteDirection Models', () => {
    it('should validate Route serviceCategory enum and require routeNumber', () => {
      const route = new Route({
        districtId: new Types.ObjectId(),
        routeNumber: '77',
        displayTitleEn: 'Mattuthavani to Thirumangalam',
        displayTitleTa: 'மாட்டுத்தாவணி - திருமங்கலம்',
        serviceCategory: 'TOWN_SERVICE'
      });
      expect(route.validateSync()).toBeUndefined();

      const invalidRoute = new Route({
        serviceCategory: 'BULLET_TRAIN' as any
      });
      const err = invalidRoute.validateSync();
      expect(err?.errors['routeNumber']).toBeDefined();
      expect(err?.errors['serviceCategory']).toBeDefined();
    });

    it('should validate RouteDirection with LineString polyline and 2dsphere index', () => {
      const dir = new RouteDirection({
        routeId: new Types.ObjectId(),
        directionCode: 'OUTBOUND',
        originStopId: new Types.ObjectId(),
        destinationStopId: new Types.ObjectId(),
        totalDistanceKm: 22.8,
        estimatedDurationMins: 55,
        routePolyline: {
          type: 'LineString',
          coordinates: [
            [78.1633, 9.9472],
            [78.0011, 9.8244]
          ]
        }
      });
      expect(dir.validateSync()).toBeUndefined();

      const indexes = RouteDirection.schema.indexes();
      const polyIndex = indexes.find(([spec]) => spec.routePolyline === '2dsphere');
      expect(polyIndex).toBeDefined();
    });
  });

  describe('Bus Fleet Model', () => {
    it('should validate registration number and operational status', () => {
      const bus = new Bus({
        registrationNumber: 'TN-58-N-2144',
        fleetNumber: 'MDU-MGR-084',
        depotName: 'Madurai Central Depot',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'IN_SERVICE'
      });
      expect(bus.validateSync()).toBeUndefined();

      const indexes = Bus.schema.indexes();
      const regIndex = indexes.find(([spec]) => spec.registrationNumber === 1);
      expect(regIndex?.[1]?.unique).toBe(true);
    });
  });

  describe('ScheduledTrip & TripStopTime Models', () => {
    it('should enforce HH:mm 24-hour time format regex on departure/arrival', () => {
      const validTrip = new ScheduledTrip({
        tripCode: 'TRIP-77-OUT-0830',
        routeDirectionId: new Types.ObjectId(),
        departureTime: '08:30',
        arrivalTime: '09:25'
      });
      expect(validTrip.validateSync()).toBeUndefined();

      const invalidTrip = new ScheduledTrip({
        tripCode: 'TRIP-BAD',
        routeDirectionId: new Types.ObjectId(),
        departureTime: '8:30 AM', // Invalid format
        arrivalTime: '25:99'     // Invalid hour and minute
      });
      const err = invalidTrip.validateSync();
      expect(err?.errors['departureTime']).toBeDefined();
      expect(err?.errors['arrivalTime']).toBeDefined();
    });
  });

  describe('LocationHistory Model', () => {
    it('should configure native MongoDB TTL index on expireAt', () => {
      const indexes = LocationHistory.schema.indexes();
      const ttlIndex = indexes.find(([spec]) => spec.expireAt === 1);
      expect(ttlIndex).toBeDefined();
      expect(ttlIndex?.[1]?.expireAfterSeconds).toBe(0);
    });
  });
});
