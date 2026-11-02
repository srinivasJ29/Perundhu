/**
 * PERUNDHU (பேருந்து) — Phase 12 Operations Controller
 */

import { Request, Response, NextFunction } from 'express';
import { operationsService } from './operations.service';
import {
  AssignTripBusBody,
  AssignTripDriverBody,
  AssignTripConductorBody,
  AddTripRemarkBody,
  ExportReportQuery
} from './operations.validation';

export class OperationsController {
  public async getTransportAdminDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await operationsService.getTransportAdminDashboard(req.user!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getDepotManagerDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { depotId } = req.query as { depotId?: string };
      const data = await operationsService.getDepotManagerDashboard(req.user!, depotId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getDispatcherDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { depotId, includeSimulated } = req.query as { depotId?: string; includeSimulated?: boolean };
      const data = await operationsService.getDispatcherDashboard(req.user!, depotId, includeSimulated);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getDriverDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await operationsService.getDriverDashboard(req.user!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async driverConfirmReady(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const result = await operationsService.driverConfirmReady(tripId, req.user!);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public async driverStartTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const result = await operationsService.driverStartTrip(tripId, req.user!);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public async driverCompleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const result = await operationsService.driverCompleteTrip(tripId, req.user!);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public async getConductorDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await operationsService.getConductorDashboard(req.user!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async assignTripBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId, busId } = req.body as AssignTripBusBody;
      const result = await operationsService.assignTripBus(tripId, busId, req.user!);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public async assignTripDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId, driverId } = req.body as AssignTripDriverBody;
      const result = await operationsService.assignTripDriver(tripId, driverId, req.user!);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public async assignTripConductor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId, conductorId } = req.body as AssignTripConductorBody;
      const result = await operationsService.assignTripConductor(tripId, conductorId, req.user!);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public async addTripRemark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tripId } = req.params;
      const { remark } = req.body as AddTripRemarkBody;
      const result = await operationsService.addTripRemark(tripId, remark, req.user!);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ExportReportQuery;
      const csv = await operationsService.exportReport(query, req.user!);
      const filename = `perundhu_${query.reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

export const operationsController = new OperationsController();

