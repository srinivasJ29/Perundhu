import { DeviceRegistry, DeviceHealthStatus } from '../../models';
import { logger } from '../../common/logger';
import { LocationObservation } from '../location/location.types';

export interface DeviceHealthEvaluation {
  healthStatus: DeviceHealthStatus;
  networkConnectivity: 'ONLINE' | 'DELAYED' | 'STALE' | 'OFFLINE';
  gpsSignalStatus: 'ACQUIRED_3D' | 'ACQUIRED_2D' | 'NO_FIX' | 'UNKNOWN';
  diagnosticSummary: string;
}

export class DeviceHealthService {
  // Configurable thresholds for device communication health
  private readonly healthyThresholdMs = 30 * 1000;    // 30 seconds
  private readonly delayedThresholdMs = 120 * 1000;   // 2 minutes
  private readonly staleThresholdMs = 600 * 1000;     // 10 minutes
  private readonly maxConsecutiveFailures = 5;

  /**
   * Evaluates the health and connectivity classification of a device without mutating database state.
   * Crucially distinguishes network connectivity (HTTP packet delivery) from GPS GNSS fix status.
   */
  public evaluateDeviceHealth(
    lastCommunicationAt?: Date,
    consecutiveFailures = 0,
    lastGpsFixStatus?: string,
    lastSatellitesCount?: number,
    nowMs: number = Date.now()
  ): DeviceHealthEvaluation {
    if (!lastCommunicationAt) {
      return {
        healthStatus: 'OFFLINE',
        networkConnectivity: 'OFFLINE',
        gpsSignalStatus: 'UNKNOWN',
        diagnosticSummary: 'Device has never communicated with backend'
      };
    }

    const elapsedMs = nowMs - lastCommunicationAt.getTime();

    // 1. Determine Network Connectivity based on communication freshness
    let networkConnectivity: 'ONLINE' | 'DELAYED' | 'STALE' | 'OFFLINE';
    if (elapsedMs <= this.healthyThresholdMs) {
      networkConnectivity = 'ONLINE';
    } else if (elapsedMs <= this.delayedThresholdMs) {
      networkConnectivity = 'DELAYED';
    } else if (elapsedMs <= this.staleThresholdMs) {
      networkConnectivity = 'STALE';
    } else {
      networkConnectivity = 'OFFLINE';
    }

    // 2. Determine GPS Fix Status (Do NOT infer fix status from successful network packet alone)
    let gpsSignalStatus: 'ACQUIRED_3D' | 'ACQUIRED_2D' | 'NO_FIX' | 'UNKNOWN' = 'UNKNOWN';
    if (lastGpsFixStatus === '3D' || (lastSatellitesCount !== undefined && lastSatellitesCount >= 4)) {
      gpsSignalStatus = 'ACQUIRED_3D';
    } else if (lastGpsFixStatus === '2D' || (lastSatellitesCount !== undefined && lastSatellitesCount === 3)) {
      gpsSignalStatus = 'ACQUIRED_2D';
    } else if (lastGpsFixStatus === 'NO_FIX' || (lastSatellitesCount !== undefined && lastSatellitesCount < 3)) {
      gpsSignalStatus = 'NO_FIX';
    }

    // 3. Determine Overall Device Health Classification
    let healthStatus: DeviceHealthStatus;
    let diagnosticSummary: string;

    if (consecutiveFailures >= this.maxConsecutiveFailures) {
      healthStatus = 'FAULTY';
      diagnosticSummary = `Device has exceeded failure threshold (${consecutiveFailures} consecutive rejections)`;
    } else if (networkConnectivity === 'OFFLINE') {
      healthStatus = 'OFFLINE';
      diagnosticSummary = `Device offline: no communication for ${Math.round(elapsedMs / 1000)} seconds`;
    } else if (networkConnectivity === 'STALE') {
      healthStatus = 'STALE';
      diagnosticSummary = `Device stale: last heartbeat was ${Math.round(elapsedMs / 1000)}s ago`;
    } else if (gpsSignalStatus === 'NO_FIX') {
      healthStatus = 'DELAYED';
      diagnosticSummary = 'Network connected, but GPS GNSS receiver has NO FIX (insufficient satellites)';
    } else if (networkConnectivity === 'DELAYED') {
      healthStatus = 'DELAYED';
      diagnosticSummary = `Telemetry delayed: interval exceeded normal window (${Math.round(elapsedMs / 1000)}s)`;
    } else {
      healthStatus = 'HEALTHY';
      diagnosticSummary = 'Device communication and GNSS fix are healthy';
    }

    return {
      healthStatus,
      networkConnectivity,
      gpsSignalStatus,
      diagnosticSummary
    };
  }

  /**
   * Records a successful telemetry observation on the DeviceRegistry:
   * Updates lastCommunicationAt, lastAcceptedLocationAt, resets communicationFailureCount,
   * stores last valid coordinates, fix status, and recalculates healthStatus.
   */
  public async recordSuccessfulObservation(
    deviceId: string,
    observation: LocationObservation
  ): Promise<void> {
    try {
      const normalizedId = deviceId.trim().toUpperCase();
      const now = new Date();

      const evaluation = this.evaluateDeviceHealth(
        now,
        0,
        observation.gpsFixStatus,
        observation.satellitesCount,
        now.getTime()
      );

      const updateFields: Record<string, any> = {
        lastCommunicationAt: now,
        lastHeartbeatAt: now,
        lastAcceptedLocationAt: now,
        lastTelemetrySource: observation.source,
        communicationFailureCount: 0,
        healthStatus: evaluation.healthStatus,
        rejectionReason: undefined
      };

      if (observation.location?.coordinates && !isNaN(observation.location.coordinates[0])) {
        updateFields.lastValidLocation = observation.location;
      }
      if (observation.satellitesCount !== undefined) {
        updateFields.lastSatellitesCount = observation.satellitesCount;
      }
      if (observation.gpsFixStatus) {
        updateFields.lastGpsFixStatus = observation.gpsFixStatus;
      }
      if (observation.batteryPercent !== undefined) {
        updateFields.batteryHealthPercent = observation.batteryPercent;
      }

      await DeviceRegistry.findOneAndUpdate(
        { $or: [{ deviceId: normalizedId }, { serialNumber: deviceId }, { imei: deviceId }] },
        { $set: updateFields }
      );
    } catch (err) {
      logger.error({ err, deviceId }, 'Failed to record device success health update');
    }
  }

  /**
   * Records a telemetry rejection on the DeviceRegistry:
   * Increments communicationFailureCount, updates lastRejectedMessageAt, and sets rejectionReason.
   */
  public async recordRejectedMessage(
    deviceId: string,
    reason: string
  ): Promise<void> {
    try {
      const normalizedId = deviceId.trim().toUpperCase();
      const now = new Date();

      const device = await DeviceRegistry.findOne({
        $or: [{ deviceId: normalizedId }, { serialNumber: deviceId }, { imei: deviceId }]
      });

      if (!device) return;

      const newFailures = (device.communicationFailureCount || 0) + 1;
      const evaluation = this.evaluateDeviceHealth(
        device.lastCommunicationAt,
        newFailures,
        device.lastGpsFixStatus,
        device.lastSatellitesCount,
        now.getTime()
      );

      await DeviceRegistry.updateOne(
        { _id: device._id },
        {
          $set: {
            lastCommunicationAt: now,
            lastRejectedMessageAt: now,
            rejectionReason: reason,
            communicationFailureCount: newFailures,
            healthStatus: evaluation.healthStatus
          }
        }
      );
    } catch (err) {
      logger.error({ err, deviceId }, 'Failed to record device rejection health update');
    }
  }
}

export const deviceHealthService = new DeviceHealthService();
