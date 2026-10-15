import { Schema } from 'mongoose';

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][]; // [[longitude, latitude], ...]
}

/**
 * Validates that an array is a valid [longitude, latitude] pair.
 * Longitude: [-180, 180], Latitude: [-90, 90]
 */
export function isValidCoordinatePair(coords: unknown): coords is [number, number] {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return false;
  }
  const [lng, lat] = coords;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    !isNaN(lng) &&
    !isNaN(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

/**
 * Reusable Mongoose schema for a GeoJSON Point with strict coordinate validation.
 */
export const GeoJsonPointSchema = new Schema<GeoJsonPoint>(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: isValidCoordinatePair,
        message:
          'Coordinates must be a valid [longitude, latitude] pair with longitude between -180 and 180, and latitude between -90 and 90.'
      }
    }
  },
  { _id: false }
);

/**
 * Reusable Mongoose schema for a GeoJSON LineString with strict coordinate validation.
 */
export const GeoJsonLineStringSchema = new Schema<GeoJsonLineString>(
  {
    type: {
      type: String,
      enum: ['LineString'],
      required: true,
      default: 'LineString'
    },
    coordinates: {
      type: [[Number]],
      required: true,
      validate: {
        validator: (coords: unknown) => {
          if (!Array.isArray(coords) || coords.length < 2) {
            return false;
          }
          return coords.every(isValidCoordinatePair);
        },
        message:
          'LineString coordinates must be an array of at least 2 valid [longitude, latitude] coordinate pairs.'
      }
    }
  },
  { _id: false }
);
