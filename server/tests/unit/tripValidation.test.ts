import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import {
  createBusBodySchema,
  listBusesQuerySchema,
  updateBusStatusBodySchema
} from '../../src/modules/buses/bus.validation';
import {
  createTripBodySchema,
  assignBusBodySchema,
  updateTripStatusBodySchema,
  updateTripStopTimesBodySchema
} from '../../src/modules/trips/trip.validation';
import {
  routeTimetableQuerySchema,
  stopDeparturesQuerySchema
} from '../../src/modules/trips/timetable.validation';

describe('Phase 5 Validation Schemas (Unit)', () => {
  describe('createBusBodySchema', () => {
    it('should validate and uppercase registrationNumber and fleetNumber', () => {
      const valid = {
        registrationNumber: 'tn-58-n-2144',
        fleetNumber: 'mdu-mgr-084',
        depotName: 'Madurai Central',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'IN_SERVICE'
      };

      const result = createBusBodySchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.registrationNumber).toBe('TN-58-N-2144');
        expect(result.data.fleetNumber).toBe('MDU-MGR-084');
      }
    });

    it('should reject invalid registrationNumber shorter than 6 characters', () => {
      const invalid = {
        registrationNumber: 'TN58',
        fleetNumber: 'MDU-01',
        depotName: 'Depot'
      };
      const result = createBusBodySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject unrecognized vehicleType', () => {
      const invalid = {
        registrationNumber: 'TN-58-N-2144',
        fleetNumber: 'MDU-MGR-084',
        depotName: 'Madurai Central',
        vehicleType: 'HOVERCRAFT'
      };
      const result = createBusBodySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('updateBusStatusBodySchema', () => {
    it('should accept valid statuses: IN_SERVICE, MAINTENANCE, OFFLINE', () => {
      expect(updateBusStatusBodySchema.safeParse({ status: 'IN_SERVICE' }).success).toBe(true);
      expect(updateBusStatusBodySchema.safeParse({ status: 'MAINTENANCE' }).success).toBe(true);
      expect(updateBusStatusBodySchema.safeParse({ status: 'OFFLINE' }).success).toBe(true);
      expect(updateBusStatusBodySchema.safeParse({ status: 'DESTROYED' }).success).toBe(false);
    });
  });

  describe('createTripBodySchema', () => {
    it('should validate a complete scheduled trip payload', () => {
      const valid = {
        tripCode: 'trip-70-out-0800',
        routeDirectionId: new Types.ObjectId().toString(),
        departureTime: '08:00',
        arrivalTime: '08:50',
        operationalDays: ['MON', 'TUE', 'WED', 'THU', 'FRI']
      };

      const result = createTripBodySchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tripCode).toBe('TRIP-70-OUT-0800');
        expect(result.data.status).toBe('SCHEDULED');
      }
    });

    it('should reject invalid time formats', () => {
      const invalid = {
        tripCode: 'TRIP-BAD-TIME',
        routeDirectionId: new Types.ObjectId().toString(),
        departureTime: '8:00 AM',
        arrivalTime: '25:99'
      };

      const result = createTripBodySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('assignBusBodySchema', () => {
    it('should accept a valid ObjectId string or null to unassign', () => {
      const withId = { busId: new Types.ObjectId().toString() };
      expect(assignBusBodySchema.safeParse(withId).success).toBe(true);

      const withNull = { busId: null };
      expect(assignBusBodySchema.safeParse(withNull).success).toBe(true);

      const invalid = { busId: 'not-an-id' };
      expect(assignBusBodySchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('updateTripStatusBodySchema', () => {
    it('should accept SCHEDULED, IN_TRANSIT, COMPLETED, CANCELLED', () => {
      expect(updateTripStatusBodySchema.safeParse({ status: 'SCHEDULED' }).success).toBe(true);
      expect(updateTripStatusBodySchema.safeParse({ status: 'IN_TRANSIT' }).success).toBe(true);
      expect(updateTripStatusBodySchema.safeParse({ status: 'COMPLETED' }).success).toBe(true);
      expect(updateTripStatusBodySchema.safeParse({ status: 'CANCELLED' }).success).toBe(true);
      expect(updateTripStatusBodySchema.safeParse({ status: 'FLYING' }).success).toBe(false);
    });
  });

  describe('updateTripStopTimesBodySchema', () => {
    it('should require at least 2 stop waypoints', () => {
      const stop1 = {
        stopId: new Types.ObjectId().toString(),
        stopSequence: 1,
        scheduledArrivalTime: '08:00',
        scheduledDepartureTime: '08:02'
      };

      const singleStop = { stopTimes: [stop1] };
      expect(updateTripStopTimesBodySchema.safeParse(singleStop).success).toBe(false);

      const stop2 = {
        stopId: new Types.ObjectId().toString(),
        stopSequence: 2,
        scheduledArrivalTime: '08:15',
        scheduledDepartureTime: '08:16'
      };

      const twoStops = { stopTimes: [stop1, stop2] };
      expect(updateTripStopTimesBodySchema.safeParse(twoStops).success).toBe(true);
    });
  });

  describe('stopDeparturesQuerySchema', () => {
    it('should validate query parameters and defaults', () => {
      const query = {
        date: '2026-10-15',
        fromTime: '08:00',
        toTime: '12:00',
        limit: '15'
      };

      const result = stopDeparturesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fromTime).toBe('08:00');
        expect(result.data.toTime).toBe('12:00');
        expect(result.data.limit).toBe(15);
      }
    });
  });
});
