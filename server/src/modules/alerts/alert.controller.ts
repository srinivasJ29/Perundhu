/**
 * PERUNDHU (பேருந்து) — Service Alert Controller
 */

import { Request, Response, NextFunction } from 'express';
import { alertService } from './alert.service';
import { NotFoundError } from '../../common/errors';

export class AlertController {
  public async listAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { districtCode, routeNumber, severity, alertType, isActive } = req.query as any;

      const alerts = await alertService.getAlerts({
        districtCode,
        routeNumber,
        severity,
        alertType,
        isActive
      });

      res.status(200).json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      next(error);
    }
  }

  public async getAlertById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { alertId } = req.params;
      const alert = await alertService.getAlertById(alertId);

      if (!alert) {
        throw new NotFoundError(`Service alert with ID '${alertId}' not found`);
      }

      res.status(200).json({
        success: true,
        data: alert
      });
    } catch (error) {
      next(error);
    }
  }
}

export const alertController = new AlertController();

