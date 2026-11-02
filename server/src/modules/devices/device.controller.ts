import { Request, Response, NextFunction } from 'express';
import { deviceService } from './device.service';
import {
  ListDevicesQuery,
  CreateEtmBody,
  UpdateEtmBody,
  CreateGpsTrackerBody,
  UpdateGpsTrackerBody,
  UpdateDeviceStatusBody,
  AssignBusEtmBody,
  AssignBusGpsBody,
  AssignConductorEtmBody,
  AssignDriverBusBody,
  ListAssignmentsQuery
} from './device.validation';

export class DeviceController {
  public async listEtms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = { ...(req.query as unknown as ListDevicesQuery), deviceCategory: 'ETM' as const };
      const result = await deviceService.listDevices(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getEtmById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await deviceService.getDeviceById(id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async createEtm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateEtmBody;
      const result = await deviceService.createEtm(body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateEtm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as UpdateEtmBody;
      const result = await deviceService.updateEtm(id, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listGpsTrackers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = { ...(req.query as unknown as ListDevicesQuery), deviceCategory: 'GPS_TRACKER' as const };
      const result = await deviceService.listDevices(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getGpsTrackerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await deviceService.getDeviceById(id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async createGpsTracker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateGpsTrackerBody;
      const result = await deviceService.createGpsTracker(body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateGpsTracker(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as UpdateGpsTrackerBody;
      const result = await deviceService.updateGpsTracker(id, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateDeviceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body as UpdateDeviceStatusBody;
      const result = await deviceService.updateDeviceStatus(id, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // -------------------------------------------------------------------------
  // Assignment Handlers
  // -------------------------------------------------------------------------

  public async assignBusEtm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as AssignBusEtmBody;
      const assignedBy = (req as any).user?.id || (req as any).user?.email || 'SYSTEM_ADMIN';
      const result = await deviceService.assignBusEtm(body, assignedBy);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async assignBusGps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as AssignBusGpsBody;
      const assignedBy = (req as any).user?.id || (req as any).user?.email || 'SYSTEM_ADMIN';
      const result = await deviceService.assignBusGps(body, assignedBy);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async assignConductorEtm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as AssignConductorEtmBody;
      const assignedBy = (req as any).user?.id || (req as any).user?.email || 'SYSTEM_ADMIN';
      const result = await deviceService.assignConductorEtm(body, assignedBy);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async assignDriverBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as AssignDriverBusBody;
      const assignedBy = (req as any).user?.id || (req as any).user?.email || 'SYSTEM_ADMIN';
      const result = await deviceService.assignDriverBus(body, assignedBy);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListAssignmentsQuery;
      const result = await deviceService.listAssignments(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getFleetAndDeviceStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await deviceService.getFleetAndDeviceMonitoringStats();
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async rotateCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await deviceService.rotateDeviceCredentials(id);
      res.status(200).json({
        message: 'Device credentials rotated successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const deviceController = new DeviceController();

