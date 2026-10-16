import { describe, it, expect } from 'vitest';
import {
  haversineDistanceMeters,
  computeBearingDegrees,
  interpolateCoordinate,
  computePolylineCumulativeDistances,
  interpolatePositionAlongPolyline
} from '../../src/modules/location/geoMath';

describe('Geospatial Mathematical Utilities (geoMath)', () => {
  // Surveyed Madurai Points: Mattuthavani & Periyar Bus Stands
  const mattuthavani: [number, number] = [78.1633, 9.9472]; // [lng, lat]
  const periyar: [number, number] = [78.1158, 9.9178];       // [lng, lat]
  const arappalayam: [number, number] = [78.1075, 9.9328];   // [lng, lat]

  describe('haversineDistanceMeters', () => {
    it('should return 0 meters when comparing identical coordinates', () => {
      expect(haversineDistanceMeters(mattuthavani, mattuthavani)).toBe(0);
    });

    it('should compute plausible real-world distance between Madurai bus stands (~6.1 km)', () => {
      const distance = haversineDistanceMeters(mattuthavani, periyar);
      // Mattuthavani to Periyar straight line distance is ~6.15 km (6150 meters)
      expect(distance).toBeGreaterThan(6000);
      expect(distance).toBeLessThan(6300);
    });

    it('should be symmetric: dist(A, B) === dist(B, A)', () => {
      const distAB = haversineDistanceMeters(mattuthavani, arappalayam);
      const distBA = haversineDistanceMeters(arappalayam, mattuthavani);
      expect(distAB).toBe(distBA);
    });
  });

  describe('computeBearingDegrees', () => {
    it('should return 0 when comparing identical coordinates', () => {
      expect(computeBearingDegrees(mattuthavani, mattuthavani)).toBe(0);
    });

    it('should compute ~90° heading due East', () => {
      const origin: [number, number] = [78.0, 9.0];
      const dueEast: [number, number] = [79.0, 9.0];
      const bearing = computeBearingDegrees(origin, dueEast);
      expect(Math.round(bearing)).toBe(90);
    });

    it('should compute ~0° heading due North', () => {
      const origin: [number, number] = [78.0, 9.0];
      const dueNorth: [number, number] = [78.0, 10.0];
      const bearing = computeBearingDegrees(origin, dueNorth);
      expect(Math.round(bearing)).toBe(0);
    });

    it('should compute ~180° heading due South', () => {
      const origin: [number, number] = [78.0, 10.0];
      const dueSouth: [number, number] = [78.0, 9.0];
      const bearing = computeBearingDegrees(origin, dueSouth);
      expect(Math.round(bearing)).toBe(180);
    });

    it('should compute ~270° heading due West', () => {
      const origin: [number, number] = [79.0, 9.0];
      const dueWest: [number, number] = [78.0, 9.0];
      const bearing = computeBearingDegrees(origin, dueWest);
      expect(Math.round(bearing)).toBe(270);
    });
  });

  describe('interpolateCoordinate', () => {
    const start: [number, number] = [78.0, 10.0];
    const end: [number, number] = [78.2, 10.4];

    it('should return start coordinate at fraction 0.0', () => {
      const pt = interpolateCoordinate(start, end, 0);
      expect(pt).toEqual(start);
    });

    it('should return end coordinate at fraction 1.0', () => {
      const pt = interpolateCoordinate(start, end, 1);
      expect(pt).toEqual(end);
    });

    it('should return exact midpoint coordinate at fraction 0.5', () => {
      const pt = interpolateCoordinate(start, end, 0.5);
      expect(pt).toEqual([78.1, 10.2]);
    });

    it('should clamp fractions < 0 to 0 and > 1 to 1', () => {
      expect(interpolateCoordinate(start, end, -0.5)).toEqual(start);
      expect(interpolateCoordinate(start, end, 1.5)).toEqual(end);
    });
  });

  describe('computePolylineCumulativeDistances', () => {
    it('should return [0] for empty or single-point arrays', () => {
      expect(computePolylineCumulativeDistances([])).toEqual([0]);
      expect(computePolylineCumulativeDistances([mattuthavani])).toEqual([0]);
    });

    it('should compute monotonically increasing cumulative distances', () => {
      const polyline = [mattuthavani, arappalayam, periyar];
      const cumDistances = computePolylineCumulativeDistances(polyline);

      expect(cumDistances).toHaveLength(3);
      expect(cumDistances[0]).toBe(0);
      expect(cumDistances[1]).toBeGreaterThan(0);
      expect(cumDistances[2]).toBeGreaterThan(cumDistances[1]);
    });
  });

  describe('interpolatePositionAlongPolyline', () => {
    const polyline: [number, number][] = [
      [78.0, 10.0],
      [78.1, 10.0], // ~11 km East
      [78.1, 10.1]  // ~11 km North
    ];
    const cumDistances = computePolylineCumulativeDistances(polyline);
    const totalDist = cumDistances[cumDistances.length - 1];

    it('should return origin position and initial heading when distance is 0', () => {
      const pos = interpolatePositionAlongPolyline(polyline, cumDistances, 0);
      expect(pos.location).toEqual(polyline[0]);
      expect(pos.progressRatio).toBe(0);
      expect(pos.segmentIndex).toBe(0);
      expect(Math.round(pos.heading)).toBe(90); // Heading East
    });

    it('should return destination position when distance equals total distance', () => {
      const pos = interpolatePositionAlongPolyline(polyline, cumDistances, totalDist);
      expect(pos.location).toEqual(polyline[2]);
      expect(pos.progressRatio).toBe(1);
      expect(Math.round(pos.heading)).toBe(0); // Heading North
    });

    it('should interpolate along segment 0 at distance less than segment 0 length', () => {
      const halfSeg0 = cumDistances[1] / 2;
      const pos = interpolatePositionAlongPolyline(polyline, cumDistances, halfSeg0);

      expect(pos.segmentIndex).toBe(0);
      expect(pos.location[0]).toBeCloseTo(78.05, 3);
      expect(pos.location[1]).toBeCloseTo(10.0, 3);
      expect(Math.round(pos.heading)).toBe(90);
    });

    it('should interpolate along segment 1 at distance greater than segment 0 length', () => {
      const halfSeg1 = cumDistances[1] + (totalDist - cumDistances[1]) / 2;
      const pos = interpolatePositionAlongPolyline(polyline, cumDistances, halfSeg1);

      expect(pos.segmentIndex).toBe(1);
      expect(pos.location[0]).toBeCloseTo(78.1, 3);
      expect(pos.location[1]).toBeCloseTo(10.05, 3);
      expect(Math.round(pos.heading)).toBe(0);
    });

    it('should handle degenerate or empty polyline gracefully without throwing', () => {
      const emptyResult = interpolatePositionAlongPolyline([], [0], 100);
      expect(emptyResult.location).toEqual([0, 0]);

      const singleResult = interpolatePositionAlongPolyline([[78.0, 10.0]], [0], 100);
      expect(singleResult.location).toEqual([78.0, 10.0]);
    });
  });
});
