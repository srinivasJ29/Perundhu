import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import {
  routePerformanceQuerySchema,
  scheduleAdherenceQuerySchema,
  demandQuerySchema,
  fleetUtilizationQuerySchema,
  recommendationsQuerySchema,
  reviewRecommendationSchema,
  reportExportQuerySchema
} from './analytics.validation';

export class AnalyticsController {
  public async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getFleetOverviewKpi();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getRoutePerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = routePerformanceQuerySchema.parse(req.query);
      const data = await analyticsService.getRoutePerformance(query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getScheduleAdherence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = scheduleAdherenceQuerySchema.parse(req.query);
      const data = await analyticsService.getScheduleAdherence(query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = demandQuerySchema.parse(req.query);
      const data = await analyticsService.getDemandAnalytics(query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getFleetUtilization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = fleetUtilizationQuerySchema.parse(req.query);
      const data = await analyticsService.getFleetUtilization(query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = recommendationsQuerySchema.parse(req.query);
      const data = await analyticsService.getRecommendations(query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async reviewRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = reviewRecommendationSchema.parse(req.body);
      const { id } = req.params;
      const user = req.user as any;
      const reviewer = {
        id: user?.id || 'unknown',
        email: user?.email || 'admin@perundhu.tn.gov.in',
        role: user?.role || 'ADMIN'
      };

      const data = await analyticsService.reviewRecommendation(id, body, reviewer);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = reportExportQuerySchema.parse(req.query);
      const report = await analyticsService.exportReport(query);

      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.status(200).send(report.data);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();

