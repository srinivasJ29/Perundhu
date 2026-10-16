import { Request, Response, NextFunction } from 'express';
import { tripService } from './trip.service';
import {
  ListTripsQuery,
  ActiveTripsQuery,
  CreateTripBody,
  AssignBusBody,
  UpdateTripStatusBody,
  UpdateTripStopTimesBody
} from './trip.validation';

export class TripController {
  public async listTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListTripsQuery;
      const result = await tripService.getTrips(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getTripById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const result = await tripService.getTripById(tripId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async getActiveTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ActiveTripsQuery;
      const result = await tripService.getActiveTrips(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateTripBody;
      const result = await tripService.createTrip(body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async assignBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const { busId } = req.body as AssignBusBody;
      const result = await tripService.assignBus(tripId, busId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateTripStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const { status } = req.body as UpdateTripStatusBody;
      const result = await tripService.updateTripStatus(tripId, status);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateTripStopTimes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const body = req.body as UpdateTripStopTimesBody;
      const result = await tripService.updateTripStopTimes(tripId, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const tripController = new TripController();
