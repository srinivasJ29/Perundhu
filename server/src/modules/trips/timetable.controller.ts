import { Request, Response, NextFunction } from 'express';
import { timetableService } from './timetable.service';
import {
  RouteTimetableQuery,
  StopDeparturesQuery
} from './timetable.validation';

export class TimetableController {
  public async getRouteTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { routeId } = req.params;
      const query = req.query as unknown as RouteTimetableQuery;
      const result = await timetableService.getRouteTimetable(routeId, query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getStopDepartures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stopId } = req.params;
      const query = req.query as unknown as StopDeparturesQuery;
      const result = await timetableService.getStopDepartures(stopId, query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const timetableController = new TimetableController();
