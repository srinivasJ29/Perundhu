import { TAMIL_NADU_BOUNDS } from '../../config/constants';
import { LatLngCoordinate } from '../map/types';

export interface GeolocationResult {
  coordinates: LatLngCoordinate;
  accuracyMeters: number;
  isWithinTamilNadu: boolean;
  timestamp: number;
}

/**
 * Validates whether the given coordinate falls within the geographic boundary of Tamil Nadu.
 */
export function isCoordinateInTamilNadu(lat: number, lng: number): boolean {
  return (
    lat >= TAMIL_NADU_BOUNDS.MIN_LAT &&
    lat <= TAMIL_NADU_BOUNDS.MAX_LAT &&
    lng >= TAMIL_NADU_BOUNDS.MIN_LNG &&
    lng <= TAMIL_NADU_BOUNDS.MAX_LNG
  );
}

/**
 * Requests user browser geolocation ON-DEMAND upon explicit user action.
 * NEVER invoked automatically on application startup.
 */
export async function requestUserGeolocation(): Promise<GeolocationResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const isWithinTamilNadu = isCoordinateInTamilNadu(lat, lng);

        resolve({
          coordinates: { lat, lng },
          accuracyMeters: position.coords.accuracy,
          isWithinTamilNadu,
          timestamp: position.timestamp
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission was denied. Please allow location access to find nearby bus stands.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is currently unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('An unknown error occurred while retrieving location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  });
}
