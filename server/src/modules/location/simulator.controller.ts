import { Request, Response, NextFunction } from 'express';
import { routeSimulator } from './simulator.service';
import { StartSimulatorBody } from './simulator.validation';
import { env } from '../../config/env';
import { ForbiddenError } from '../../common/errors';

export class SimulatorController {
  public async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = routeSimulator.getStatus();
      res.status(200).json({ data: status });
    } catch (err) {
      next(err);
    }
  }

  public async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!env.SIMULATOR_ENABLED) {
        throw new ForbiddenError(
          'Simulation engine is disabled by configuration (SIMULATOR_ENABLED=false)'
        );
      }

      const body = req.body as StartSimulatorBody;
      const status = await routeSimulator.start(body);
      res.status(200).json({
        message: 'Simulation session initiated successfully',
        data: status
      });
    } catch (err) {
      next(err);
    }
  }

  public async stop(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await routeSimulator.stop();
      res.status(200).json({
        message: 'Simulation session stopped',
        data: status
      });
    } catch (err) {
      next(err);
    }
  }

  public async reset(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!env.SIMULATOR_ENABLED) {
        throw new ForbiddenError(
          'Simulation engine is disabled by configuration (SIMULATOR_ENABLED=false)'
        );
      }

      const status = await routeSimulator.reset();
      res.status(200).json({
        message: 'Simulation session reset to initial route origin',
        data: status
      });
    } catch (err) {
      next(err);
    }
  }
}

export const simulatorController = new SimulatorController();
