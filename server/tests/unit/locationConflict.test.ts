import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { locationRepository } from '../../src/modules/location/location.repository';
import { LatestBusPosition, LocationHistory } from '../../src/models';
import { LocationObservation } from '../../src/modules/location/location.types';

describe('Location Repository & Conflict Prevention (Unit)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const busId = new Types.ObjectId();
  const tripId = new Types.ObjectId();

  const simulatedObs: LocationObservation = {
    busId,
    tripId,
    location: { type: 'Point', coordinates: [78.1633, 9.9472] },
    heading: 90,
    speedKmph: 35,
    accuracyMeters: 5,
    source: 'SIMULATOR',
    trackingStatus: 'SIMULATED',
    recordedAt: new Date('2026-10-15T10:00:00Z'),
    receivedAt: new Date('2026-10-15T10:00:01Z')
  };

  describe('saveLatestPosition', () => {
    it('should save a simulated observation using findOneAndUpdate with safety query filter', async () => {
      const mockResult = {
        _id: new Types.ObjectId(),
        ...simulatedObs,
        version: 1
      };

      const findOneAndUpdateSpy = vi
        .spyOn(LatestBusPosition, 'findOneAndUpdate')
        .mockResolvedValue(mockResult as any);

      const success = await locationRepository.saveLatestPosition(simulatedObs);

      expect(success).toBe(true);
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          busId,
          $or: [
            { source: 'SIMULATOR' },
            { recordedAt: { $lt: simulatedObs.recordedAt } }
          ]
        }),
        expect.objectContaining({
          $set: expect.objectContaining({
            source: 'SIMULATOR',
            trackingStatus: 'SIMULATED'
          }),
          $inc: { version: 1 }
        }),
        expect.objectContaining({ upsert: true, new: true })
      );
    });

    it('should return false if database operation fails or is rejected', async () => {
      vi.spyOn(LatestBusPosition, 'findOneAndUpdate').mockRejectedValue(
        new Error('Database write failure')
      );

      const success = await locationRepository.saveLatestPosition(simulatedObs);
      expect(success).toBe(false);
    });
  });

  describe('appendLocationHistory', () => {
    it('should calculate expireAt matching specified TTL (default 24h) and create record', async () => {
      const createSpy = vi.spyOn(LocationHistory, 'create').mockResolvedValue({} as any);

      const success = await locationRepository.appendLocationHistory(simulatedObs, 24);
      expect(success).toBe(true);

      const expectedExpireAt = new Date(
        simulatedObs.recordedAt.getTime() + 24 * 3600 * 1000
      );

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          busId,
          source: 'SIMULATOR',
          recordedAt: simulatedObs.recordedAt,
          expireAt: expectedExpireAt
        })
      );
    });
  });

  describe('getLatestPositionByBusId', () => {
    it('should return null when no record exists for the busId', async () => {
      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const res = await locationRepository.getLatestPositionByBusId(busId);
      expect(res).toBeNull();
    });

    it('should return mapped observation when position exists', async () => {
      const mockDoc = {
        busId,
        tripId,
        location: { type: 'Point', coordinates: [78.1158, 9.9178] },
        heading: 180,
        speedKmph: 40,
        accuracyMeters: 5,
        source: 'SIMULATOR',
        trackingStatus: 'SIMULATED',
        recordedAt: new Date('2026-10-15T10:05:00Z'),
        receivedAt: new Date('2026-10-15T10:05:01Z')
      };

      vi.spyOn(LatestBusPosition, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDoc)
      } as any);

      const res = await locationRepository.getLatestPositionByBusId(busId);
      expect(res).not.toBeNull();
      expect(res?.speedKmph).toBe(40);
      expect(res?.source).toBe('SIMULATOR');
      expect(res?.trackingStatus).toBe('SIMULATED');
    });
  });
});
