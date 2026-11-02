import { Types } from 'mongoose';
import {
  LatestBusPosition,
  LocationHistory
} from '../../models';
import { logger } from '../../common/logger';
import { LocationObservation, LocationSource } from './location.types';

/**
 * Strict source-priority ranking matrix (Task 5):
 * 1. VEHICLE_HARDWARE_GPS (Rank 100): Certified tamper-proof vehicle tracker (AIS-140)
 * 2. OFFICIAL_FLEET_FEED (Rank 80): Authorized central vendor gateway / webhook
 * 3. AUTHORIZED_MOBILE_GPS (Rank 60): Approved driver mobile application
 * 4. ETM_GPS (Rank 40): Conductor Electronic Ticketing Machine (when physically verified)
 * 5. MANUAL_DISPATCH (Rank 20): Authorized depot manual entry
 * 6. SIMULATOR (Rank 10): Synthetic demonstration telemetry (lowest priority)
 */
export const SOURCE_PRIORITY_RANK: Record<LocationSource, number> = {
  VEHICLE_HARDWARE_GPS: 100,
  OFFICIAL_FLEET_FEED: 80,
  AUTHORIZED_MOBILE_GPS: 60,
  ETM_GPS: 40,
  MANUAL_DISPATCH: 20,
  SIMULATOR: 10
};

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
          satellitesCount: observation.satellitesCount,
          altitudeMeters: observation.altitudeMeters,
          gpsFixStatus: observation.gpsFixStatus,
          batteryPercent: observation.batteryPercent,
          networkSignalDbm: observation.networkSignalDbm,
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
      satellitesCount: doc.satellitesCount,
      altitudeMeters: doc.altitudeMeters,
      gpsFixStatus: doc.gpsFixStatus,
      batteryPercent: doc.batteryPercent,
      networkSignalDbm: doc.networkSignalDbm,
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
