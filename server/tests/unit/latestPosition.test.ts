import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { LatestBusPosition } from '../../src/models';

describe('LatestBusPosition Schema & Ingestion Constraints', () => {
  it('should validate a complete location record separating source from trackingStatus', () => {
    const doc = new LatestBusPosition({
      busId: new Types.ObjectId(),
      tripId: new Types.ObjectId(),
      routeId: new Types.ObjectId(),
      location: {
        type: 'Point',
        coordinates: [78.1322, 9.9288] // Goripalayam
      },
      heading: 180,
      speedKmph: 32.5,
      accuracyMeters: 4.2,
      source: 'SIMULATOR',            // Data source clearly identified
      trackingStatus: 'SIMULATED',    // Freshness/lifecycle state separate
      validationStatus: 'VALID',
      recordedAt: new Date('2026-10-14T10:00:00Z'),
      receivedAt: new Date('2026-10-14T10:00:01Z'),
      version: 1
    });

    expect(doc.validateSync()).toBeUndefined();
    expect(doc.source).toBe('SIMULATOR');
    expect(doc.trackingStatus).toBe('SIMULATED');
    expect(doc.version).toBe(1);
  });

  it('should validate support for future authorized mobile GPS or vehicle hardware source', () => {
    const mobileGpsDoc = new LatestBusPosition({
      busId: new Types.ObjectId(),
      location: {
        type: 'Point',
        coordinates: [78.1132, 9.9168]
      },
      source: 'AUTHORIZED_MOBILE_GPS',
      sourceDeviceId: 'DEVICE-SAMSUNG-A54-TN01',
      trackingStatus: 'LIVE',
      recordedAt: new Date(),
      receivedAt: new Date()
    });

    expect(mobileGpsDoc.validateSync()).toBeUndefined();
    expect(mobileGpsDoc.source).toBe('AUTHORIZED_MOBILE_GPS');
    expect(mobileGpsDoc.sourceDeviceId).toBe('DEVICE-SAMSUNG-A54-TN01');
    expect(mobileGpsDoc.trackingStatus).toBe('LIVE');
  });

  it('should reject invalid source or trackingStatus enums', () => {
    const invalidDoc = new LatestBusPosition({
      busId: new Types.ObjectId(),
      location: { type: 'Point', coordinates: [78.1, 9.9] },
      source: 'UNVERIFIED_SCRAPED_FEED' as any,
      trackingStatus: 'TELEPORTING' as any,
      recordedAt: new Date(),
      receivedAt: new Date()
    });

    const err = invalidDoc.validateSync();
    expect(err?.errors['source']).toBeDefined();
    expect(err?.errors['trackingStatus']).toBeDefined();
  });

  it('should require provider recordedAt and server receivedAt timestamps', () => {
    const missingTimestamps = new LatestBusPosition({
      busId: new Types.ObjectId(),
      location: { type: 'Point', coordinates: [78.1, 9.9] },
      source: 'SIMULATOR',
      trackingStatus: 'SIMULATED'
    });

    const err = missingTimestamps.validateSync();
    expect(err?.errors['recordedAt']).toBeDefined();
    expect(err?.errors['receivedAt']).toBeDefined();
  });

  it('should maintain indexes for low-latency spatial and temporal queries', () => {
    const indexes = LatestBusPosition.schema.indexes();

    const uniqueBusIndex = indexes.find(([spec]) => spec.busId === 1);
    expect(uniqueBusIndex).toBeDefined();
    expect(uniqueBusIndex?.[1]?.unique).toBe(true);

    const geoIndex = indexes.find(([spec]) => spec.location === '2dsphere');
    expect(geoIndex).toBeDefined();

    const temporalIndex = indexes.find(([spec]) => spec.recordedAt === -1);
    expect(temporalIndex).toBeDefined();
  });
});
