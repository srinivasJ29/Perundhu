import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../../common/errors';
import { Bus } from '../../models';
import { nextStopService } from './nextStop.service';
import { etaService } from './eta.service';

export class EtaController {
  /**
   * GET /api/v1/trips/:tripId/next-stop
   * Returns current next-stop detection and arrival status for an active trip.
   */
  public async getNextStop(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tripId } = req.params;
      const result = await nextStopService.detectNextStopForTrip(tripId);

      if (!result) {
        throw new NotFoundError(`Scheduled trip with ID '${tripId}' was not found`);
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/trips/:tripId/eta
   * Returns dynamic ETA predictions for the next stop and all downstream stops of a trip.
   */
  public async getTripEta(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { tripId } = req.params;
      const result = await etaService.calculateTripEta(tripId);

      if (!result) {
        throw new NotFoundError(`Scheduled trip with ID '${tripId}' was not found`);
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/buses/:busId/eta
   * Resolves the active scheduled trip for a bus and returns dynamic ETA predictions.
   */
  public async getBusEta(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { busId } = req.params;
      const bus = await Bus.findById(busId).lean();

      if (!bus) {
        throw new NotFoundError(`Bus with ID '${busId}' was not found`);
      }

      const result = await etaService.calculateBusEta(busId);

      if (!result) {
        res.status(200).json({
          success: true,
          data: {
            busId: bus._id.toString(),
            registrationNumber: bus.registrationNumber,
            fleetNumber: bus.fleetNumber,
            activeTrip: null,
            trackingStatus: 'UNAVAILABLE',
            source: 'SIMULATOR',
            isRealTimePrediction: false,
            predictionSource: 'UNAVAILABLE',
            message: 'Vehicle currently has no active scheduled trip',
            downstreamStops: []
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const etaController = new EtaController();
