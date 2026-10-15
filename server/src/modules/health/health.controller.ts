import { Request, Response } from 'express';
import { healthService } from './health.service';
import { env } from '../../config/env';

export class HealthController {
  public getHealth(_req: Request, res: Response): void {
    const health = healthService.getHealth(env.NODE_ENV);
    res.status(200).json(health);
  }

  public getReadiness(_req: Request, res: Response): void {
    const { isReady, data } = healthService.getReadiness();
    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json(data);
  }
}

export const healthController = new HealthController();
