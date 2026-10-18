import { describe, it, expect } from 'vitest';
import { isCoordinateInTamilNadu } from '../src/features/location/geolocation';
import { geoJsonToLatLng, latLngToGeoJson } from '../src/features/map/types';

describe('Geolocation & Map Boundary Foundation', () => {
  it('should validate coordinates within Tamil Nadu bounding box', () => {
    // Madurai (Pilot)
    expect(isCoordinateInTamilNadu(9.9252, 78.1198)).toBe(true);

    // Chennai
    expect(isCoordinateInTamilNadu(13.0827, 80.2707)).toBe(true);

    // Kanyakumari
    expect(isCoordinateInTamilNadu(8.0883, 77.5385)).toBe(true);

    // Out of bounds: Delhi
    expect(isCoordinateInTamilNadu(28.6139, 77.209)).toBe(false);

    // Out of bounds: Mumbai
    expect(isCoordinateInTamilNadu(19.076, 72.8777)).toBe(false);
  });

  it('should accurately convert between GeoJSON [lng, lat] and LatLng { lat, lng }', () => {
    const geoJsonTuple: [number, number] = [78.1198, 9.9252];
    const latLng = geoJsonToLatLng(geoJsonTuple);

    expect(latLng.lat).toBe(9.9252);
    expect(latLng.lng).toBe(78.1198);

    const reversed = latLngToGeoJson(latLng);
    expect(reversed[0]).toBe(78.1198);
    expect(reversed[1]).toBe(9.9252);
  });
});
