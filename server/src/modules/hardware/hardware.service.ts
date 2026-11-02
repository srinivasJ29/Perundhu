import { Types } from 'mongoose';
import { logger } from '../../common/logger';
import { ValidationError } from '../../common/errors';
import { Bus, DeviceRegistry } from '../../models';
import { locationPipelineService } from '../location/locationPipeline.service';
import { LocationObservation } from '../location/location.types';
import {
  NormalizedGpsPayload,
  AdapterContext,
  HardwareIngestResult,
  DeviceAuthContext
} from './hardware.types';
import { gpsAdapterRegistry } from './hardware.registry';

// Tamil Nadu Operational Bounding Box (with regional interstate corridors: Kerala, Karnataka, Andhra border leeway)
const TN_BOUNDS = {
  minLat: 7.5,
  maxLat: 14.5,
  minLon: 75.0,
  maxLon: 81.5
};

export class HardwareIngestionService {
  /**
   * Main entry point: receives raw hardware payload, runs through adapter,
   * updates device health, resolves assigned bus, and feeds existing location pipeline.
   */
  public async ingestHardwareTelemetry(
    payload: unknown,
    context: AdapterContext,
    preferredAdapterId?: string
  ): Promise<HardwareIngestResult> {
    // 1. Resolve matching adapter
    const adapter = preferredAdapterId
      ? gpsAdapterRegistry.getAdapter(preferredAdapterId)
      : gpsAdapterRegistry.detectAdapter(payload, context.headers);

    if (!adapter) {
      throw new ValidationError(
        preferredAdapterId
          ? `Hardware adapter '${preferredAdapterId}' not found`
          : 'Unable to detect a suitable hardware telemetry adapter for this payload'
      );
    }

    // 2. Parse and normalize vendor payload
    const normalized = await adapter.parseAndNormalize(payload, context);

    // 3. Coordinate sanity validation
    this.validateCoordinates(normalized.coordinates);

    // 4. Resolve Device and Bus association
    const resolved = await this.resolveDeviceAndBus(normalized.deviceId, context.auth);

    // 5. Update Device Communication Health in DeviceRegistry
    if (resolved.deviceDoc) {
      await this.updateDeviceHealth(resolved.deviceDoc._id, normalized);
    }

    // 6. Check if this is explicitly marked as a TEST packet
    const isTest = Boolean(
      normalized.isTest ||
      context.headers?.['x-perundhu-test'] === 'true' ||
      (typeof payload === 'object' && payload !== null && (payload as any).isTest)
    );

    if (isTest) {
      logger.info(
        { deviceId: normalized.deviceId, coordinates: normalized.coordinates },
        'Hardware test packet received and validated (excluded from live passenger tracking)'
      );

      return {
        success: true,
        deviceId: normalized.deviceId,
        busId: resolved.busId ? resolved.busId.toString() : undefined,
        fleetNumber: resolved.fleetNumber,
        adapterUsed: adapter.adapterId,
        normalizedCoordinates: normalized.coordinates,
        recordedAt: normalized.timestamp.toISOString(),
        receivedAt: context.receiveTime.toISOString(),
        pipelineAccepted: true,
        source: normalized.telemetrySource,
        isDevTest: true
      };
    }

    // 7. If device is not assigned to a bus, we log telemetry health but do NOT push ghost coordinates
    if (!resolved.busId) {
      logger.debug(
        { deviceId: normalized.deviceId },
        'Hardware telemetry received for unassigned device; health recorded, bus tracking skipped'
      );

      return {
        success: true,
        deviceId: normalized.deviceId,
        adapterUsed: adapter.adapterId,
        normalizedCoordinates: normalized.coordinates,
        recordedAt: normalized.timestamp.toISOString(),
        receivedAt: context.receiveTime.toISOString(),
        pipelineAccepted: false,
        source: normalized.telemetrySource,
        rejectionReason: 'Device is not currently assigned to an active fleet bus'
      };
    }

    // 8. Construct standard LocationObservation for universal pipeline
    const observation: LocationObservation = {
      busId: resolved.busId,
      tripId: resolved.currentTripId,
      location: {
        type: 'Point',
        coordinates: normalized.coordinates // [longitude, latitude]
      },
      heading: normalized.heading,
      speedKmph: normalized.speedKmph,
      accuracyMeters: normalized.accuracyMeters,
      source: normalized.telemetrySource,
      sourceDeviceId: normalized.deviceId,
      trackingStatus: 'LIVE',
      recordedAt: normalized.timestamp,
      receivedAt: context.receiveTime
    };

    // 9. Feed into universal 6-stage location pipeline
    const pipelineResult = await locationPipelineService.processObservation(observation, {
      persistToHistory: true
    });

    return {
      success: pipelineResult.accepted,
      deviceId: normalized.deviceId,
      busId: resolved.busId.toString(),
      fleetNumber: resolved.fleetNumber,
      adapterUsed: adapter.adapterId,
      normalizedCoordinates: normalized.coordinates,
      recordedAt: normalized.timestamp.toISOString(),
      receivedAt: context.receiveTime.toISOString(),
      pipelineAccepted: pipelineResult.accepted,
      source: normalized.telemetrySource,
      rejectionReason: pipelineResult.rejectionReason
    };
  }

  /**
   * Validates coordinate values and sanity checks regional bounding box
   */
  private validateCoordinates(coords: [number, number]): void {
    const [lon, lat] = coords;

    if (isNaN(lon) || isNaN(lat)) {
      throw new ValidationError(`Coordinates must be valid numbers; received [${lon}, ${lat}]`);
    }

    if (lat < -90 || lat > 90) {
      throw new ValidationError(`Latitude ${lat} is out of bounds (must be between -90 and 90)`);
    }

    if (lon < -180 || lon > 180) {
      throw new ValidationError(`Longitude ${lon} is out of bounds (must be between -180 and 180)`);
    }

    // Regional Sanity Warning (does not reject, but logs if far out of Tamil Nadu)
    if (lat < TN_BOUNDS.minLat || lat > TN_BOUNDS.maxLat || lon < TN_BOUNDS.minLon || lon > TN_BOUNDS.maxLon) {
      logger.warn(
        { coordinates: coords },
        'Hardware telemetry coordinates fall outside Tamil Nadu & border corridors bounding box'
      );
    }
  }

  /**
   * Resolves device and currently assigned Bus
   */
  private async resolveDeviceAndBus(
    deviceId: string,
    authContext?: DeviceAuthContext
  ): Promise<{
    deviceDoc?: any;
    busId?: Types.ObjectId;
    fleetNumber?: string;
    currentTripId?: Types.ObjectId;
  }> {
    const normalizedDeviceId = deviceId.trim().toUpperCase();

    // 1. Look up device in DeviceRegistry
    const deviceDoc = await DeviceRegistry.findOne({
      $or: [
        { deviceId: normalizedDeviceId },
        { imei: deviceId.trim() },
        { serialNumber: deviceId.trim() }
      ]
    }).lean();

    let busObjectId: Types.ObjectId | undefined = authContext?.assignedBusId;

    if (!busObjectId && deviceDoc?.currentAssignedBusId) {
      busObjectId = new Types.ObjectId(deviceDoc.currentAssignedBusId);
    }

    let fleetNumber: string | undefined;
    let currentTripId: Types.ObjectId | undefined;

    if (busObjectId) {
      const bus = await Bus.findById(busObjectId).lean();
      if (bus) {
        fleetNumber = bus.fleetNumber;
        if (bus.currentAssignedTripId) {
          currentTripId = new Types.ObjectId(bus.currentAssignedTripId);
        }
      } else {
        busObjectId = undefined;
      }
    }

    return {
      deviceDoc,
      busId: busObjectId,
      fleetNumber,
      currentTripId
    };
  }

  /**
   * Updates real-time communication health, last fix, and battery on DeviceRegistry
   */
  private async updateDeviceHealth(
    deviceObjectId: Types.ObjectId,
    normalized: NormalizedGpsPayload
  ): Promise<void> {
    try {
      const updateFields: Record<string, any> = {
        lastCommunicationAt: new Date(),
        lastHeartbeatAt: new Date(),
        lastAcceptedLocationAt: new Date(),
        lastTelemetrySource: normalized.telemetrySource,
        communicationFailureCount: 0,
        healthStatus: 'HEALTHY'
      };

      if (normalized.coordinates && !isNaN(normalized.coordinates[0])) {
        updateFields.lastValidLocation = {
          type: 'Point',
          coordinates: normalized.coordinates
        };
      }

      if (normalized.satellitesCount !== undefined) {
        updateFields.lastSatellitesCount = normalized.satellitesCount;
      }

      if (normalized.fixStatus) {
        updateFields.lastGpsFixStatus = normalized.fixStatus;
      }

      if (normalized.batteryPercent !== undefined) {
        updateFields.batteryHealthPercent = normalized.batteryPercent;
      }

      await DeviceRegistry.findByIdAndUpdate(deviceObjectId, { $set: updateFields });
    } catch (err) {
      logger.error({ err, deviceObjectId }, 'Failed to update device health in registry');
    }
  }
}

export const hardwareIngestionService = new HardwareIngestionService();
