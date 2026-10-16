import { RouteSnappingResult } from './location.types';

const TO_RAD = Math.PI / 180;
const TO_DEG = 180 / Math.PI;
const EARTH_MEAN_RADIUS_METERS = 6371000;

/**
 * Calculates Great-Circle distance in meters between two GeoJSON points using the Haversine formula.
 * @param coord1 - [longitude, latitude]
 * @param coord2 - [longitude, latitude]
 */
export function haversineDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  if (lon1 === lon2 && lat1 === lat2) {
    return 0;
  }

  const dLat = (lat2 - lat1) * TO_RAD;
  const dLon = (lon2 - lon1) * TO_RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * TO_RAD) * Math.cos(lat2 * TO_RAD) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_MEAN_RADIUS_METERS * c * 100) / 100;
}

/**
 * Calculates initial forward compass bearing in degrees (0 to 360) from coord1 to coord2.
 * 0° = North, 90° = East, 180° = South, 270° = West.
 */
export function computeBearingDegrees(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  if (lon1 === lon2 && lat1 === lat2) {
    return 0;
  }

  const phi1 = lat1 * TO_RAD;
  const phi2 = lat2 * TO_RAD;
  const deltaLambda = (lon2 - lon1) * TO_RAD;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = (theta * TO_DEG + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

/**
 * Linearly interpolates between two [longitude, latitude] coordinates by a fraction [0, 1].
 */
export function interpolateCoordinate(
  coord1: [number, number],
  coord2: [number, number],
  fraction: number
): [number, number] {
  const clamped = Math.max(0, Math.min(1, fraction));
  const lon = coord1[0] + (coord2[0] - coord1[0]) * clamped;
  const lat = coord1[1] + (coord2[1] - coord1[1]) * clamped;
  return [Math.round(lon * 1e7) / 1e7, Math.round(lat * 1e7) / 1e7];
}

/**
 * Precomputes cumulative segment distances in meters along an array of GeoJSON coordinates.
 * Index 0 is always 0. Index i is total distance from coordinate 0 to coordinate i.
 */
export function computePolylineCumulativeDistances(
  coordinates: [number, number][]
): number[] {
  if (!coordinates || coordinates.length <= 1) {
    return [0];
  }

  const cumDistances: number[] = [0];
  let runningTotal = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const dist = haversineDistanceMeters(coordinates[i - 1], coordinates[i]);
    runningTotal += dist;
    cumDistances.push(Math.round(runningTotal * 100) / 100);
  }

  return cumDistances;
}

export interface InterpolatedRoutePosition {
  location: [number, number]; // [lng, lat]
  heading: number;           // 0 to 360 degrees
  segmentIndex: number;      // index of the segment start coordinate
  distanceAlongRouteMeters: number;
  totalRouteDistanceMeters: number;
  progressRatio: number;     // 0.0 to 1.0
}

/**
 * Deterministically interpolates vehicle position along an ordered route polyline
 * at a specified distance in meters from the route origin.
 */
export function interpolatePositionAlongPolyline(
  coordinates: [number, number][],
  cumulativeDistances: number[],
  distanceMeters: number
): InterpolatedRoutePosition {
  if (!coordinates || coordinates.length === 0) {
    return {
      location: [0, 0],
      heading: 0,
      segmentIndex: 0,
      distanceAlongRouteMeters: 0,
      totalRouteDistanceMeters: 0,
      progressRatio: 0
    };
  }

  if (coordinates.length === 1) {
    return {
      location: coordinates[0],
      heading: 0,
      segmentIndex: 0,
      distanceAlongRouteMeters: 0,
      totalRouteDistanceMeters: 0,
      progressRatio: 1
    };
  }

  const totalLength = cumulativeDistances[cumulativeDistances.length - 1];

  if (totalLength <= 0) {
    const heading = computeBearingDegrees(coordinates[0], coordinates[1]);
    return {
      location: coordinates[0],
      heading,
      segmentIndex: 0,
      distanceAlongRouteMeters: 0,
      totalRouteDistanceMeters: 0,
      progressRatio: 0
    };
  }

  // Clamped at origin
  if (distanceMeters <= 0) {
    const heading = computeBearingDegrees(coordinates[0], coordinates[1]);
    return {
      location: coordinates[0],
      heading,
      segmentIndex: 0,
      distanceAlongRouteMeters: 0,
      totalRouteDistanceMeters: totalLength,
      progressRatio: 0
    };
  }

  // Clamped at destination
  if (distanceMeters >= totalLength) {
    const lastIdx = coordinates.length - 1;
    const heading = computeBearingDegrees(
      coordinates[lastIdx - 1],
      coordinates[lastIdx]
    );
    return {
      location: coordinates[lastIdx],
      heading,
      segmentIndex: lastIdx - 1,
      distanceAlongRouteMeters: totalLength,
      totalRouteDistanceMeters: totalLength,
      progressRatio: 1
    };
  }

  // Binary search or linear scan for segment containing distanceMeters
  let segIdx = 0;
  for (let i = 0; i < cumulativeDistances.length - 1; i++) {
    if (
      distanceMeters >= cumulativeDistances[i] &&
      distanceMeters <= cumulativeDistances[i + 1]
    ) {
      segIdx = i;
      break;
    }
  }

  const segStartDist = cumulativeDistances[segIdx];
  const segEndDist = cumulativeDistances[segIdx + 1];
  const segLength = segEndDist - segStartDist;

  const fraction = segLength > 0 ? (distanceMeters - segStartDist) / segLength : 0;
  const location = interpolateCoordinate(
    coordinates[segIdx],
    coordinates[segIdx + 1],
    fraction
  );
  const heading = computeBearingDegrees(
    coordinates[segIdx],
    coordinates[segIdx + 1]
  );

  return {
    location,
    heading,
    segmentIndex: segIdx,
    distanceAlongRouteMeters: Math.round(distanceMeters * 100) / 100,
    totalRouteDistanceMeters: totalLength,
    progressRatio: Math.round((distanceMeters / totalLength) * 10000) / 10000
  };
}

/**
 * Projects a point P onto a geodesic line segment AB using local metric projection.
 * Coordinates are [longitude, latitude].
 */
export function projectPointOntoSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): {
  snappedPoint: [number, number];
  crossTrackDistanceMeters: number;
  alongSegmentDistanceMeters: number;
  segmentLengthMeters: number;
  fraction: number;
} {
  const [lonP, latP] = p;
  const [lonA, latA] = a;
  const [lonB, latB] = b;

  const segLength = haversineDistanceMeters(a, b);

  // Zero-length segment or identical points: point projects directly to A
  if (segLength < 0.01) {
    const crossTrack = haversineDistanceMeters(p, a);
    return {
      snappedPoint: [a[0], a[1]],
      crossTrackDistanceMeters: Math.round(crossTrack * 100) / 100,
      alongSegmentDistanceMeters: 0,
      segmentLengthMeters: 0,
      fraction: 0
    };
  }

  // Local mean latitude for equirectangular metric projection
  const meanLatRad = ((latA + latB + latP) / 3) * TO_RAD;
  const metersPerDegLat = (Math.PI / 180) * EARTH_MEAN_RADIUS_METERS;
  const metersPerDegLon = metersPerDegLat * Math.cos(meanLatRad);

  // Convert A, B, P to local Cartesian coordinates (meters) with origin at A
  const xB = (lonB - lonA) * metersPerDegLon;
  const yB = (latB - latA) * metersPerDegLat;

  const xP = (lonP - lonA) * metersPerDegLon;
  const yP = (latP - latA) * metersPerDegLat;

  const dot = xP * xB + yP * yB;
  const lenSq = xB * xB + yB * yB;

  let fraction = 0;
  if (lenSq > 0.0001) {
    fraction = Math.max(0, Math.min(1, dot / lenSq));
  }

  const snappedPoint = interpolateCoordinate(a, b, fraction);
  const crossTrackDistanceMeters = haversineDistanceMeters(p, snappedPoint);
  const alongSegmentDistanceMeters = Math.round(fraction * segLength * 100) / 100;

  return {
    snappedPoint,
    crossTrackDistanceMeters: Math.round(crossTrackDistanceMeters * 100) / 100,
    alongSegmentDistanceMeters,
    segmentLengthMeters: Math.round(segLength * 100) / 100,
    fraction
  };
}

export interface SnappingOptions {
  previousProgressMeters?: number;
  maxCrossTrackMeters?: number;
  backwardToleranceMeters?: number;
}

/**
 * Projects a point onto an ordered route polyline, returning the closest point,
 * cross-track deviation, and progress along the route.
 * Handles loops, repeated stops, and zero-length segments safely.
 */
export function projectPointOntoPolyline(
  point: [number, number],
  coordinates: [number, number][],
  cumulativeDistances?: number[],
  options?: SnappingOptions
): RouteSnappingResult {
  const maxCrossTrack = options?.maxCrossTrackMeters ?? 100;
  const backwardTolerance = options?.backwardToleranceMeters ?? 30;
  const prevProgress = options?.previousProgressMeters;

  if (!coordinates || coordinates.length === 0) {
    return {
      snappedCoordinates: [point[0], point[1]],
      crossTrackDistanceMeters: 0,
      segmentIndex: 0,
      alongRouteDistanceMeters: 0,
      totalRouteDistanceMeters: 0,
      progressRatio: 0,
      progressPercent: 0,
      isOffRoute: true,
      isAmbiguous: false
    };
  }

  if (coordinates.length === 1) {
    const dist = haversineDistanceMeters(point, coordinates[0]);
    return {
      snappedCoordinates: [coordinates[0][0], coordinates[0][1]],
      crossTrackDistanceMeters: Math.round(dist * 100) / 100,
      segmentIndex: 0,
      alongRouteDistanceMeters: 0,
      totalRouteDistanceMeters: 0,
      progressRatio: 1,
      progressPercent: 100,
      isOffRoute: dist > maxCrossTrack,
      isAmbiguous: false
    };
  }

  const cumDistances =
    cumulativeDistances && cumulativeDistances.length === coordinates.length
      ? cumulativeDistances
      : computePolylineCumulativeDistances(coordinates);

  const totalLength = cumDistances[cumDistances.length - 1];

  let bestSegmentIndex = 0;
  let bestCrossTrack = Infinity;
  let bestAlongRoute = 0;
  let bestSnappedCoord: [number, number] = coordinates[0];
  let bestScore = Infinity;
  let ambiguousCandidatesCount = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const segProj = projectPointOntoSegment(point, coordinates[i], coordinates[i + 1]);
    const candidateAlongRoute = cumDistances[i] + segProj.alongSegmentDistanceMeters;
    const crossTrack = segProj.crossTrackDistanceMeters;

    // Base score is the cross-track distance in meters
    let score = crossTrack;

    // Disambiguation for looping routes, closed paths, or repeated stops:
    // If prior accepted progress exists, penalize segments that violate forward progress
    if (prevProgress !== undefined && totalLength > 0) {
      let deltaProgress = candidateAlongRoute - prevProgress;

      // Check for valid wrap-around on a closed route or loop (e.g. approaching terminus -> restarting at 0)
      const isLoopWrapAround =
        prevProgress > 0.9 * totalLength && candidateAlongRoute < 0.1 * totalLength;
      if (isLoopWrapAround) {
        deltaProgress = candidateAlongRoute + totalLength - prevProgress;
      }

      if (deltaProgress < -backwardTolerance) {
        // Significant backward movement: heavily penalize candidate
        score += 5000 + Math.abs(deltaProgress) * 5;
      } else {
        // Favor segments closer to expected forward progress (minimal forward jump)
        score += Math.abs(deltaProgress) * 0.05;
      }
    }

    if (crossTrack <= maxCrossTrack && Math.abs(crossTrack - bestCrossTrack) < 5) {
      ambiguousCandidatesCount++;
    }

    if (score < bestScore) {
      bestScore = score;
      bestCrossTrack = crossTrack;
      bestAlongRoute = candidateAlongRoute;
      bestSegmentIndex = i;
      bestSnappedCoord = segProj.snappedPoint;
    }
  }

  const isOffRoute = bestCrossTrack > maxCrossTrack;
  const progressRatio =
    totalLength > 0
      ? Math.max(0, Math.min(1, Math.round((bestAlongRoute / totalLength) * 10000) / 10000))
      : 0;
  const progressPercent = Math.round(progressRatio * 10000) / 100;

  return {
    snappedCoordinates: bestSnappedCoord,
    crossTrackDistanceMeters: Math.round(bestCrossTrack * 100) / 100,
    segmentIndex: bestSegmentIndex,
    alongRouteDistanceMeters: Math.round(bestAlongRoute * 100) / 100,
    totalRouteDistanceMeters: Math.round(totalLength * 100) / 100,
    progressRatio,
    progressPercent,
    isOffRoute,
    isAmbiguous: ambiguousCandidatesCount > 1
  };
}
