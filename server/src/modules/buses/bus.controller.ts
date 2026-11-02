import { Request, Response, NextFunction } from 'express';
import { busService } from './bus.service';
import {
  ListBusesQuery,
  BusTripsQuery,
  CreateBusBody,
  UpdateBusStatusBody,
  UpdateBusBody,
  AssignBusDepotBody
} from './bus.validation';

export class BusController {
  public async listBuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListBusesQuery;
      const result = await busService.getBuses(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getBusById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;
      const result = await busService.getBusById(busId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async getBusTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;
      const query = req.query as unknown as BusTripsQuery;
      const result = await busService.getBusTrips(busId, query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async createBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateBusBody;
      const result = await busService.createBus(body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateBusStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;
      const body = req.body as UpdateBusStatusBody;
      const result = await busService.updateBusStatus(busId, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;
      const body = req.body as UpdateBusBody;
      const result = await busService.updateBus(busId, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async assignBusDepot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;
      const body = req.body as AssignBusDepotBody;
      const assignedBy = (req as any).user?.id || (req as any).user?.email || 'SYSTEM_ADMIN';
      const result = await busService.assignBusDepot(busId, body, assignedBy);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async getBusAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;
      const result = await busService.getBusAssignments(busId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const busController = new BusController();
