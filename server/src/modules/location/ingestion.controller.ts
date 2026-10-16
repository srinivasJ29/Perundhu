import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Bus } from '../../models';
import { NotFoundError } from '../../common/errors';
import { locationPipelineService } from './locationPipeline.service';
import { LocationObservation } from './location.types';
import { IngestLocationBody } from './ingestion.validation';

export class IngestionController {
  public async ingest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as IngestLocationBody;
      const deviceId = (req as any).deviceId as string;

      // 1. Verify that the referenced Bus exists
      const bus = await Bus.findById(body.busId).lean();
      if (!bus) {
        throw new NotFoundError(`Bus with ID '${body.busId}' was not found`);
      }

      // 2. Build LocationObservation
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
        source: body.source,
        sourceDeviceId: deviceId,
        trackingStatus: 'LIVE',
        recordedAt,
        receivedAt: new Date()
      };

      // 3. Process through universal 6-stage location pipeline
      const pipelineResult = await locationPipelineService.processObservation(observation, {
        persistToHistory: true
      });

      if (!pipelineResult.accepted) {
        res.status(422).json({
          error: {
            code: 'OBSERVATION_REJECTED',
            message: pipelineResult.rejectionReason ?? 'Location observation failed pipeline validation',
            details: pipelineResult.validationResult.errors,
            timestamp: new Date().toISOString(),
            ...(req.id && { requestId: req.id })
          }
        });
        return;
      }

      // 4. Return accepted confirmation
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
}

export const ingestionController = new IngestionController();
