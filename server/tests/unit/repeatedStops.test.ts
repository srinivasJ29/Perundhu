import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { RouteStopSequence } from '../../src/models';

describe('RouteStopSequence & Repeated Stops Support', () => {
  const directionId = new Types.ObjectId();
  const centralHubStopId = new Types.ObjectId(); // e.g. Periyar Bus Stand or Goripalayam

  it('should permit the exact same stop to appear at multiple sequence positions along a route', () => {
    // Stop sequence 1: Outbound start at central hub
    const firstVisit = new RouteStopSequence({
      directionId,
      stopId: centralHubStopId,
      sequenceOrder: 1,
      distanceFromOriginKm: 0.0,
      cumulativeDurationMinutes: 0,
      isFareStage: true
    });
    expect(firstVisit.validateSync()).toBeUndefined();

    // Stop sequence 9: Return loop visit to the same central hub
    const secondVisit = new RouteStopSequence({
      directionId,
      stopId: centralHubStopId,
      sequenceOrder: 9,
      distanceFromOriginKm: 18.5,
      cumulativeDurationMinutes: 45,
      isFareStage: true
    });
    expect(secondVisit.validateSync()).toBeUndefined();
  });

  it('should enforce unique compound index on { directionId, sequenceOrder } but NOT on { directionId, stopId }', () => {
    const indexes = RouteStopSequence.schema.indexes();

    // { directionId: 1, sequenceOrder: 1 } MUST be unique
    const sequenceOrderIndex = indexes.find(
      ([spec]) => spec.directionId === 1 && spec.sequenceOrder === 1
    );
    expect(sequenceOrderIndex).toBeDefined();
    expect(sequenceOrderIndex?.[1]?.unique).toBe(true);

    // { directionId: 1, stopId: 1 } MUST NOT be unique (to allow repeated stop visits)
    const stopLookupIndex = indexes.find(
      ([spec]) => spec.directionId === 1 && spec.stopId === 1
    );
    expect(stopLookupIndex).toBeDefined();
    expect(stopLookupIndex?.[1]?.unique).toBeFalsy();
  });

  it('should reject non-integer sequence orders or negative values', () => {
    const invalidDoc = new RouteStopSequence({
      directionId,
      stopId: centralHubStopId,
      sequenceOrder: 2.5, // float is invalid
      distanceFromOriginKm: -3.0, // negative distance is invalid
      cumulativeDurationMinutes: -10
    });

    const err = invalidDoc.validateSync();
    expect(err?.errors['sequenceOrder']).toBeDefined();
    expect(err?.errors['distanceFromOriginKm']).toBeDefined();
    expect(err?.errors['cumulativeDurationMinutes']).toBeDefined();
  });
});
