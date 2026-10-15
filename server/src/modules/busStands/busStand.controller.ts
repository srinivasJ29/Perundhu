import { Request, Response, NextFunction } from 'express';
import { busStandService } from './busStand.service';
import { NearbyBusStandsQuery } from './busStand.validation';

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
}

export const busStandController = new BusStandController();
