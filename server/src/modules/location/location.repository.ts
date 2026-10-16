import { Types } from 'mongoose';
import {
  LatestBusPosition,
  LocationHistory
} from '../../models';
import { logger } from '../../common/logger';
import { LocationObservation } from './location.types';

export class LocationRepository {
  /**
   * Persists latest position observation with safety guard:
   * A simulated observation will NEVER overwrite a newer or concurrent authorized real GPS observation.
   * Atomic operation with upsert and version increment.
   */
  public async saveLatestPosition(observation: LocationObservation): Promise<boolean> {
    try {
      const query = {
        busId: observation.busId,
        $or: [
          { source: 'SIMULATOR' },
          { recordedAt: { $lt: observation.recordedAt } }
        ]
      };

      const update = {
        $set: {
          busId: observation.busId,
          tripId: observation.tripId,
          routeId: observation.routeId,
          directionId: observation.directionId,
          location: observation.location,
          snappedLocation: observation.snappedLocation,
          crossTrackDistanceMeters: observation.crossTrackDistanceMeters,
          distanceAlongRouteMeters: observation.distanceAlongRouteMeters,
          totalRouteDistanceMeters: observation.totalRouteDistanceMeters,
          progressRatio: observation.progressRatio,
          heading: observation.heading,
          speedKmph: observation.speedKmph,
          accuracyMeters: observation.accuracyMeters,
          source: observation.source,
          sourceDeviceId: observation.sourceDeviceId,
          trackingStatus: observation.trackingStatus,
          validationStatus: observation.validationStatus ?? 'VALID',
          validationErrors: observation.validationErrors ?? [],
          recordedAt: observation.recordedAt,
          receivedAt: observation.receivedAt
        },
        $inc: { version: 1 }
      };

      const result = await LatestBusPosition.findOneAndUpdate(query, update, {
        upsert: true,
        new: true
      });

      return Boolean(result);
    } catch (err) {
      logger.error(
        { err, busId: observation.busId.toString() },
        'Failed to save latest bus position'
      );
      return false;
    }
  }

  /**
   * Appends location observation to history with native 24-hour TTL expiration.
   */
  public async appendLocationHistory(
    observation: LocationObservation,
    ttlHours = 24
  ): Promise<boolean> {
    try {
      const expireAt = new Date(
        observation.recordedAt.getTime() + ttlHours * 3600 * 1000
      );

      await LocationHistory.create({
        busId: observation.busId,
        tripId: observation.tripId,
        location: observation.location,
        heading: observation.heading,
        speedKmph: observation.speedKmph,
        source: observation.source,
        recordedAt: observation.recordedAt,
        expireAt
      });

      return true;
    } catch (err) {
      logger.error(
        { err, busId: observation.busId.toString() },
        'Failed to append location history entry'
      );
      return false;
    }
  }

  /**
   * Retrieves the current persisted latest position for a bus.
   */
  public async getLatestPositionByBusId(
    busId: string | Types.ObjectId
  ): Promise<LocationObservation | null> {
    const objectId = typeof busId === 'string' ? new Types.ObjectId(busId) : busId;
    const doc = await LatestBusPosition.findOne({ busId: objectId }).lean();

    if (!doc) return null;

    return {
      busId: doc.busId,
      tripId: doc.tripId,
      routeId: doc.routeId,
      directionId: doc.directionId,
      location: doc.location,
      snappedLocation: doc.snappedLocation,
      crossTrackDistanceMeters: doc.crossTrackDistanceMeters,
      distanceAlongRouteMeters: doc.distanceAlongRouteMeters,
      totalRouteDistanceMeters: doc.totalRouteDistanceMeters,
      progressRatio: doc.progressRatio,
      heading: doc.heading,
      speedKmph: doc.speedKmph,
      accuracyMeters: doc.accuracyMeters,
      source: doc.source,
      sourceDeviceId: doc.sourceDeviceId,
      trackingStatus: doc.trackingStatus,
      validationStatus: doc.validationStatus,
      validationErrors: doc.validationErrors,
      recordedAt: doc.recordedAt,
      receivedAt: doc.receivedAt
    };
  }
}

export const locationRepository = new LocationRepository();
