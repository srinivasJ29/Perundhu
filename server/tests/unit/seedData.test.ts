import { describe, it, expect } from 'vitest';
import {
  seedDistricts,
  seedBusStands,
  seedStops,
  seedRoutes,
  seedDirections,
  seedStopSequences,
  seedBuses,
  seedTrips,
  seedTripStopTimes
} from '../../src/seed/maduraiSeedData';
import { isValidCoordinatePair } from '../../src/models/geojson';

describe('Madurai Demonstration Seed Data Integrity', () => {
  // Tamil Nadu Bounding Box: Latitude ~8.0° N to 13.6° N, Longitude ~76.0° E to 80.5° E
  const isWithinTamilNaduBBox = ([lng, lat]: [number, number]): boolean => {
    return lng >= 76.0 && lng <= 80.5 && lat >= 8.0 && lat <= 13.6;
  };

  it('should have all bus stand coordinates within valid Tamil Nadu bounds', () => {
    expect(seedBusStands.length).toBeGreaterThanOrEqual(4);
    for (const stand of seedBusStands) {
      expect(isValidCoordinatePair(stand.coordinates)).toBe(true);
      expect(isWithinTamilNaduBBox(stand.coordinates)).toBe(true);
    }
  });

  it('should have all stop coordinates within valid Tamil Nadu bounds', () => {
    expect(seedStops.length).toBeGreaterThanOrEqual(14);
    for (const stop of seedStops) {
      expect(isValidCoordinatePair(stop.coordinates)).toBe(true);
      expect(isWithinTamilNaduBBox(stop.coordinates)).toBe(true);
    }
  });

  it('should verify referential integrity across seed entities', () => {
    const districtCodes = new Set(seedDistricts.map((d) => d.code));
    const standCodes = new Set(seedBusStands.map((s) => s.code));
    const stopCodes = new Set(seedStops.map((st) => st.code));
    const routeNumbers = new Set(seedRoutes.map((r) => r.routeNumber));
    const tripCodes = new Set(seedTrips.map((t) => t.tripCode));
    const busRegs = new Set(seedBuses.map((b) => b.registrationNumber));

    // 1. Bus stands reference valid districts
    for (const s of seedBusStands) {
      expect(districtCodes.has(s.districtCode)).toBe(true);
    }

    // 2. Stops reference valid districts and stands (if stand specified)
    for (const st of seedStops) {
      expect(districtCodes.has(st.districtCode)).toBe(true);
      if (st.busStandCode) {
        expect(standCodes.has(st.busStandCode)).toBe(true);
      }
    }

    // 3. Routes reference valid districts
    for (const r of seedRoutes) {
      expect(districtCodes.has(r.districtCode)).toBe(true);
    }

    // 4. Route Directions reference valid routes and stops
    for (const rd of seedDirections) {
      expect(routeNumbers.has(rd.routeNumber)).toBe(true);
      expect(stopCodes.has(rd.originStopCode)).toBe(true);
      expect(stopCodes.has(rd.destinationStopCode)).toBe(true);
      if (rd.originStandCode) expect(standCodes.has(rd.originStandCode)).toBe(true);
      if (rd.destinationStandCode) expect(standCodes.has(rd.destinationStandCode)).toBe(true);
      expect(rd.coordinates.length).toBeGreaterThanOrEqual(2);
      for (const pt of rd.coordinates) {
        expect(isValidCoordinatePair(pt)).toBe(true);
      }
    }

    // 5. Route Stop Sequences reference valid directions and stops
    for (const seq of seedStopSequences) {
      expect(routeNumbers.has(seq.routeNumber)).toBe(true);
      expect(stopCodes.has(seq.stopCode)).toBe(true);
      expect(seq.sequenceOrder).toBeGreaterThanOrEqual(1);
    }

    // 6. Scheduled Trips reference valid routes and assigned buses
    for (const t of seedTrips) {
      expect(routeNumbers.has(t.routeNumber)).toBe(true);
      if (t.busRegistrationNumber) {
        expect(busRegs.has(t.busRegistrationNumber)).toBe(true);
      }
    }

    // 7. Trip Stop Times reference valid trips and stops
    for (const tst of seedTripStopTimes) {
      expect(tripCodes.has(tst.tripCode)).toBe(true);
      expect(stopCodes.has(tst.stopCode)).toBe(true);
      expect(tst.stopSequence).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have unique codes across districts, stands, stops, and trips', () => {
    const standCodes = seedBusStands.map((s) => s.code);
    expect(new Set(standCodes).size).toBe(standCodes.length);

    const stopCodes = seedStops.map((st) => st.code);
    expect(new Set(stopCodes).size).toBe(stopCodes.length);

    const tripCodes = seedTrips.map((t) => t.tripCode);
    expect(new Set(tripCodes).size).toBe(tripCodes.length);

    const busRegs = seedBuses.map((b) => b.registrationNumber);
    expect(new Set(busRegs).size).toBe(busRegs.length);
  });
});
