import { Request, Response, NextFunction } from 'express';
import { fleetService } from './fleet.service';
import { ListFleetPositionsQuery } from './fleet.validation';

export class FleetController {
  public async listFleetPositions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as ListFleetPositionsQuery;
      const result = await fleetService.getFleetPositions(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getBusLiveDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { busId } = req.params;
      const result = await fleetService.getBusLiveDetails(busId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const fleetController = new FleetController();

