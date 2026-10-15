import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  isValidCoordinatePair,
  GeoJsonPointSchema,
  GeoJsonLineStringSchema
} from '../../src/models/geojson';

describe('GeoJSON Coordinate Validation', () => {
  describe('isValidCoordinatePair helper', () => {
    it('should return true for valid Madurai coordinates [lng, lat]', () => {
      // Mattuthavani coordinates: 78.1633° E, 9.9472° N
      expect(isValidCoordinatePair([78.1633, 9.9472])).toBe(true);
    });

    it('should return false for inverted or out-of-range coordinates', () => {
      expect(isValidCoordinatePair([195.0, 10.0])).toBe(false); // Longitude > 180
      expect(isValidCoordinatePair([-190.0, 10.0])).toBe(false); // Longitude < -180
      expect(isValidCoordinatePair([78.0, 95.0])).toBe(false);  // Latitude > 90
      expect(isValidCoordinatePair([78.0, -95.0])).toBe(false); // Latitude < -90
    });

    it('should return false for malformed arrays or non-numeric inputs', () => {
      expect(isValidCoordinatePair([78.0])).toBe(false); // Only 1 element
      expect(isValidCoordinatePair([78.0, 9.0, 100.0])).toBe(false); // 3 elements
      expect(isValidCoordinatePair(['78.0' as any, 9.0])).toBe(false);
      expect(isValidCoordinatePair(null)).toBe(false);
      expect(isValidCoordinatePair(undefined)).toBe(false);
      expect(isValidCoordinatePair([NaN, 9.0])).toBe(false);
    });
  });

  describe('GeoJsonPointSchema and GeoJsonLineStringSchema', () => {
    const TestPointModel = mongoose.model(
      'TestGeoPoint',
      new mongoose.Schema({ location: { type: GeoJsonPointSchema, required: true } })
    );

    const TestLineModel = mongoose.model(
      'TestGeoLine',
      new mongoose.Schema({ polyline: { type: GeoJsonLineStringSchema, required: true } })
    );

    it('should validate a valid GeoJSON Point', async () => {
      const doc = new TestPointModel({
        location: {
          type: 'Point',
          coordinates: [78.1132, 9.9168]
        }
      });
      const err = doc.validateSync();
      expect(err).toBeUndefined();
    });

    it('should reject a GeoJSON Point with out-of-bounds latitude', async () => {
      const doc = new TestPointModel({
        location: {
          type: 'Point',
          coordinates: [78.1132, 105.0] // Lat > 90
        }
      });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['location.coordinates']).toBeDefined();
    });

    it('should validate a valid GeoJSON LineString with multiple waypoints', async () => {
      const doc = new TestLineModel({
        polyline: {
          type: 'LineString',
          coordinates: [
            [78.1633, 9.9472],
            [78.1322, 9.9288],
            [78.1132, 9.9168]
          ]
        }
      });
      const err = doc.validateSync();
      expect(err).toBeUndefined();
    });

    it('should reject a GeoJSON LineString with fewer than 2 coordinates', async () => {
      const doc = new TestLineModel({
        polyline: {
          type: 'LineString',
          coordinates: [[78.1633, 9.9472]] // Only 1 coordinate pair
        }
      });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['polyline.coordinates']).toBeDefined();
    });
  });
});
