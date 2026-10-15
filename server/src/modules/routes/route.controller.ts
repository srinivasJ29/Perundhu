import { Request, Response, NextFunction } from 'express';
import { routeService } from './route.service';

export class RouteController {
  public async getDirectionDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { routeId, directionId } = req.params;
      const result = await routeService.getRouteDirectionDetails(routeId, directionId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const routeController = new RouteController();
