import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Bus } from '../../models';
import { NotFoundError, ConflictError } from '../../common/errors';
import { locationPipelineService } from './locationPipeline.service';
import { locationRepository } from './location.repository';
import { LocationObservation } from './location.types';
import { IngestLocationBody, IngestBatchLocationBody } from './ingestion.validation';
import { telemetryMetricsService } from './telemetryMetrics.service';
import { deviceHealthService } from '../devices/deviceHealth.service';

// In-memory cache for duplicate offline batch detection (1-hour sliding TTL)
const BATCH_DEDUP_CACHE = new Map<string, number>();
const BATCH_DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Periodic cleanup of expired batch IDs
setInterval(() => {
  const now = Date.now();
  for (const [batchId, expiresAt] of BATCH_DEDUP_CACHE.entries()) {
    if (now >= expiresAt) {
      BATCH_DEDUP_CACHE.delete(batchId);
    }
  }
}, 5 * 60 * 1000).unref();

export class IngestionController {
  /**
   * Single telemetry observation ingestion endpoint.
   * Authenticated via HMAC-SHA256 signature, replay prevention, and device revocation checks.
   */
  public async ingest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    try {
      const body = req.body as IngestLocationBody;
      const deviceId = ((req as any).deviceId as string) || 'UNKNOWN_DEVICE';
      telemetryMetricsService.recordReceived(body.source);

      // 1. Verify that the referenced Bus exists
      const bus = await Bus.findById(body.busId).lean();
      if (!bus) {
        telemetryMetricsService.recordRejected('BUS_NOT_FOUND', Date.now() - startTime);
        throw new NotFoundError(`Bus with ID '${body.busId}' was not found`);
      }

      // 2. Validate Bus-Device Association
      const deviceDoc = (req as any).deviceDoc;
      if (deviceDoc && deviceDoc.currentAssignedBusId) {
        const assignedBusIdStr = deviceDoc.currentAssignedBusId.toString();
        if (assignedBusIdStr !== body.busId) {
          const reason = `Conflicting device assignment: Device '${deviceId}' is assigned to bus '${assignedBusIdStr}', not bus '${body.busId}'`;
          telemetryMetricsService.recordRejected('BUS_DEVICE_MISMATCH', Date.now() - startTime);
          await deviceHealthService.recordRejectedMessage(deviceId, 'BUS_DEVICE_MISMATCH');
          throw new ConflictError(reason);
        }
      }

      // 3. Build typed LocationObservation
      const recordedAt = new Date(body.recordedAt);
      const observation: LocationObservation = {
        busId: new Types.ObjectId(body.busId),
        tripId: body.tripId ? new Types.ObjectId(body.tripId) : undefined,
        routeId: body.routeId ? new Types.ObjectId(body.routeId) : undefined,
        directionId: body.directionId ? new Types.ObjectId(body.directionId) : undefined,
        location: {
          type: 'Point',
          coordinates: [body.longitude, body.latitude]
        },
        heading: body.heading,
        speedKmph: body.speedKmph,
        accuracyMeters: body.accuracyMeters,
        satellitesCount: body.satellitesCount,
        altitudeMeters: body.altitudeMeters,
        gpsFixStatus: body.gpsFixStatus,
        batteryPercent: body.batteryPercent,
        networkSignalDbm: body.networkSignalDbm,
        source: body.source,
        sourceDeviceId: deviceId,
        trackingStatus: 'LIVE',
        recordedAt,
        receivedAt: new Date()
      };

      // 4. Process through universal 6-stage location pipeline
      const pipelineResult = await locationPipelineService.processObservation(observation, {
        persistToHistory: true
      });

      if (!pipelineResult.accepted) {
        const reason = pipelineResult.rejectionReason ?? 'Location observation failed pipeline validation';
        telemetryMetricsService.recordRejected(reason, Date.now() - startTime);
        await deviceHealthService.recordRejectedMessage(deviceId, reason);

        res.status(422).json({
          error: {
            code: 'OBSERVATION_REJECTED',
            message: reason,
            details: pipelineResult.validationResult.errors,
            timestamp: new Date().toISOString(),
            ...(req.id && { requestId: req.id })
          }
        });
        return;
      }

      // 5. Update Device Communication Health and Metrics
      await deviceHealthService.recordSuccessfulObservation(deviceId, observation);
      telemetryMetricsService.recordAccepted(body.source, Date.now() - startTime);

      // 6. Return accepted confirmation
      res.status(202).json({
        message: 'GPS observation accepted and processed through pipeline',
        data: {
          busId: body.busId,
          fleetNumber: bus.fleetNumber,
          source: observation.source,
          trackingStatus: observation.trackingStatus,
          validationStatus: observation.validationStatus,
          coordinates: observation.location.coordinates,
          distanceAlongRouteMeters: observation.distanceAlongRouteMeters,
          recordedAt: observation.recordedAt.toISOString(),
          persistedLatest: pipelineResult.persistedLatest,
          persistedHistory: pipelineResult.persistedHistory
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Offline Queue and Recovery: Ingests an ordered batch of delayed telemetry points
   * from a device that was operating through temporary network dead zones (Task 7).
   */
  public async ingestBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    try {
      const body = req.body as IngestBatchLocationBody;
      const deviceId = ((req as any).deviceId as string) || 'UNKNOWN_DEVICE';

      // 1. Duplicate Batch Protection
      if (body.batchId) {
        if (BATCH_DEDUP_CACHE.has(body.batchId)) {
          telemetryMetricsService.recordDuplicate();
          throw new ConflictError(`Batch '${body.batchId}' has already been processed`);
        }
        BATCH_DEDUP_CACHE.set(body.batchId, Date.now() + BATCH_DEDUP_WINDOW_MS);
      }

      // 2. Sort batch observations chronologically (ascending by recordedAt)
      const sortedRecords = [...body.records].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );

      let persistedHistoryCount = 0;
      let latestObservationToProcess: LocationObservation | null = null;
      let targetBusDoc: any = null;

      for (const record of sortedRecords) {
        telemetryMetricsService.recordReceived(record.source);

        if (!targetBusDoc) {
          targetBusDoc = await Bus.findById(record.busId).lean();
          if (!targetBusDoc) {
            telemetryMetricsService.recordRejected('BUS_NOT_FOUND', Date.now() - startTime);
            throw new NotFoundError(`Bus with ID '${record.busId}' was not found`);
          }
        }

        // Validate Bus-Device Association
        const deviceDoc = (req as any).deviceDoc;
        if (deviceDoc && deviceDoc.currentAssignedBusId) {
          const assignedBusIdStr = deviceDoc.currentAssignedBusId.toString();
          if (assignedBusIdStr !== record.busId) {
            telemetryMetricsService.recordRejected('BUS_DEVICE_MISMATCH', Date.now() - startTime);
            await deviceHealthService.recordRejectedMessage(deviceId, 'BUS_DEVICE_MISMATCH');
            throw new ConflictError(
              `Conflicting device assignment in batch: Device '${deviceId}' is assigned to bus '${assignedBusIdStr}', not bus '${record.busId}'`
            );
          }
        }

        const recordedAt = new Date(record.recordedAt);
        const obs: LocationObservation = {
          busId: new Types.ObjectId(record.busId),
          tripId: record.tripId ? new Types.ObjectId(record.tripId) : undefined,
          routeId: record.routeId ? new Types.ObjectId(record.routeId) : undefined,
          directionId: record.directionId ? new Types.ObjectId(record.directionId) : undefined,
          location: {
            type: 'Point',
            coordinates: [record.longitude, record.latitude]
          },
          heading: record.heading,
          speedKmph: record.speedKmph,
          accuracyMeters: record.accuracyMeters,
          satellitesCount: record.satellitesCount,
          altitudeMeters: record.altitudeMeters,
          gpsFixStatus: record.gpsFixStatus,
          batteryPercent: record.batteryPercent,
          networkSignalDbm: record.networkSignalDbm,
          source: record.source,
          sourceDeviceId: deviceId,
          trackingStatus: 'DELAYED',
          recordedAt,
          receivedAt: new Date()
        };

        // Persist every valid observation from the offline batch to LocationHistory
        const savedHistory = await locationRepository.appendLocationHistory(obs);
        if (savedHistory) {
          persistedHistoryCount++;
        }

        latestObservationToProcess = obs;
      }

      // 3. Process the newest point in the batch through the pipeline
      // If it is strictly newer than current LatestBusPosition, it safely updates latest position
      // If it is older than current position, LatestBusPosition is left untouched
      let latestPositionUpdated = false;
      if (latestObservationToProcess) {
        const pipelineResult = await locationPipelineService.processObservation(
          latestObservationToProcess,
          { persistToHistory: false }
        );
        latestPositionUpdated = pipelineResult.persistedLatest;

        if (latestPositionUpdated) {
          await deviceHealthService.recordSuccessfulObservation(deviceId, latestObservationToProcess);
          telemetryMetricsService.recordAccepted(latestObservationToProcess.source, Date.now() - startTime);
        }
      }

      res.status(202).json({
        message: 'Batch offline telemetry ingested and processed successfully',
        data: {
          batchId: body.batchId,
          totalReceived: body.records.length,
          persistedHistoryCount,
          latestPositionUpdated,
          processingTimeMs: Date.now() - startTime
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Observability and Monitoring: Returns aggregated telemetry ingestion metrics (Task 10).
   */
  public getMetrics(_req: Request, res: Response): void {
    const summary = telemetryMetricsService.getSummary();
    res.status(200).json({
      message: 'Telemetry ingestion metrics retrieved',
      data: summary
    });
  }
}

export const ingestionController = new IngestionController();
