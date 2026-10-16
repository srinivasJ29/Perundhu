import { describe, it, expect } from 'vitest';
import { RouteMatchingService } from '../../src/modules/location/routeMatching.service';
import { projectPointOntoSegment } from '../../src/modules/location/geoMath';

describe('Route Matching & Snapping Service (Unit)', () => {
  const matchingService = new RouteMatchingService({
    maxCrossTrackMeters: 100,
    backwardToleranceMeters: 30
  });

  // Polyline along Madurai corridor:
  // Coord 0: [78.1198, 9.9252] (Periyar)
  // Coord 1: [78.1198, 9.9352] (Heading North ~1110m)
  // Coord 2: [78.1298, 9.9352] (Heading East ~1090m)
  const corridorCoords: [number, number][] = [
    [78.1198, 9.9252],
    [78.1198, 9.9352],
    [78.1298, 9.9352]
  ];

  describe('Point Projection onto Segments', () => {
    it('should project a point exactly on segment with 0 cross-track distance', () => {
      const a: [number, number] = [78.1198, 9.9252];
      const b: [number, number] = [78.1198, 9.9352];
      const p: [number, number] = [78.1198, 9.9302]; // Exactly at 50% midpoint

      const proj = projectPointOntoSegment(p, a, b);

      expect(proj.crossTrackDistanceMeters).toBeCloseTo(0, 1);
      expect(proj.fraction).toBeCloseTo(0.5, 2);
      expect(proj.snappedPoint[0]).toBeCloseTo(78.1198, 4);
      expect(proj.snappedPoint[1]).toBeCloseTo(9.9302, 4);
    });

    it('should calculate perpendicular cross-track distance for point offset from segment', () => {
      const a: [number, number] = [78.1198, 9.9252];
      const b: [number, number] = [78.1198, 9.9352];
      // Offset slightly to the east (approx 20-30 meters)
      const p: [number, number] = [78.1200, 9.9302];

      const proj = projectPointOntoSegment(p, a, b);

      expect(proj.crossTrackDistanceMeters).toBeGreaterThan(15);
      expect(proj.crossTrackDistanceMeters).toBeLessThan(35);
      // Snapped point should still be on the north-south line (longitude 78.1198)
      expect(proj.snappedPoint[0]).toBeCloseTo(78.1198, 4);
    });

    it('should safely handle zero-length segment without NaN or division by zero', () => {
      const a: [number, number] = [78.1198, 9.9252];
      const b: [number, number] = [78.1198, 9.9252]; // Identical point
      const p: [number, number] = [78.1200, 9.9252];

      const proj = projectPointOntoSegment(p, a, b);

      expect(Number.isFinite(proj.crossTrackDistanceMeters)).toBe(true);
      expect(proj.fraction).toBe(0);
      expect(proj.snappedPoint).toEqual(a);
    });
  });

  describe('Polyline Snapping & Off-Route Detection', () => {
    it('should snap point on segment 1 correctly with along-route distance and progress', () => {
      // Point at 50% of the second segment (eastward leg)
      const point: [number, number] = [78.1248, 9.9352];

      const result = matchingService.matchCoordinates(point, corridorCoords);

      expect(result.isOffRoute).toBe(false);
      expect(result.segmentIndex).toBe(1);
      expect(result.crossTrackDistanceMeters).toBeCloseTo(0, 1);
      expect(result.progressRatio).toBeGreaterThan(0.65);
      expect(result.progressRatio).toBeLessThan(0.8);
      expect(result.progressPercent).toBeGreaterThan(65);
    });

    it('should flag point exceeding maxCrossTrackMeters as isOffRoute: true', () => {
      // Point 500 meters away from the polyline
      const point: [number, number] = [78.1300, 9.9200];

      const result = matchingService.matchCoordinates(point, corridorCoords);

      expect(result.isOffRoute).toBe(true);
      expect(result.crossTrackDistanceMeters).toBeGreaterThan(100);
    });

    it('should handle empty or single-point polylines safely', () => {
      const emptyResult = matchingService.matchCoordinates([78.0, 9.0], []);
      expect(emptyResult.isOffRoute).toBe(true);
      expect(emptyResult.alongRouteDistanceMeters).toBe(0);

      const singleResult = matchingService.matchCoordinates([78.0, 9.0], [[78.0, 9.0]]);
      expect(singleResult.crossTrackDistanceMeters).toBe(0);
      expect(singleResult.alongRouteDistanceMeters).toBe(0);
    });

    it('should disambiguate looping routes using previousProgressMeters', () => {
      // Closed loop: [A -> B -> C -> D -> A]
      // Segment 0: A [0,0] -> B [0, 0.01] (~1110m)
      // Segment 1: B [0, 0.01] -> C [0.01, 0.01] (~1090m)
      // Segment 2: C [0.01, 0.01] -> D [0.01, 0] (~1110m)
      // Segment 3: D [0.01, 0] -> A [0, 0] (~1090m)
      const loopCoords: [number, number][] = [
        [78.0, 9.0],
        [78.0, 9.01],
        [78.01, 9.01],
        [78.01, 9.0],
        [78.0, 9.0]
      ];

      // A test point near A [78.0, 9.0] where Seg 0 starts AND Seg 3 ends
      const pointNearA: [number, number] = [78.0005, 9.0005];

      // Case 1: Initial bus progress at start (previousProgress = 50m)
      const startResult = matchingService.matchCoordinates(pointNearA, loopCoords, {
        previousProgressMeters: 50
      });
      // Should pick Segment 0 (outbound start)
      expect(startResult.segmentIndex).toBe(0);

      // Case 2: Bus returning home near end of trip (previousProgress = 4000m)
      const returnResult = matchingService.matchCoordinates(pointNearA, loopCoords, {
        previousProgressMeters: 4000
      });
      // Should pick Segment 3 (return leg approaching terminus)
      expect(returnResult.segmentIndex).toBe(3);
    });
  });
});
