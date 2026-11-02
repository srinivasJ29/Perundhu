import { Request, Response, NextFunction } from 'express';
import { busStandService } from './busStand.service';
import {
  NearbyBusStandsQuery,
  ListBusStandsQuery,
  CreateBusStandBody,
  UpdateBusStandBody
} from './busStand.validation';

export class BusStandController {
  public async getNearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as NearbyBusStandsQuery;
      const result = await busStandService.getNearbyBusStands(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { standId } = req.params;
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await busStandService.getRoutesByBusStand(standId, { page, limit });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async listBusStands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListBusStandsQuery;
      const result = await busStandService.listBusStands(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getBusStandById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { standId } = req.params;
      const result = await busStandService.getBusStandById(standId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async createBusStand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateBusStandBody;
      const result = await busStandService.createBusStand(body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateBusStand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { standId } = req.params;
      const body = req.body as UpdateBusStandBody;
      const result = await busStandService.updateBusStand(standId, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const busStandController = new BusStandController();
