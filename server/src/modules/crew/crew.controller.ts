import { Request, Response, NextFunction } from 'express';
import { crewService } from './crew.service';
import {
  ListCrewQuery,
  CreateDriverBody,
  UpdateDriverBody,
  CreateConductorBody,
  UpdateConductorBody,
  UpdateCrewStatusBody
} from './crew.validation';

export class CrewController {
  public async listDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = { ...(req.query as unknown as ListCrewQuery), role: 'DRIVER' as const };
      const isAdmin = (req as any).user?.role === 'ADMIN';
      const result = await crewService.listCrewMembers(query, isAdmin);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getDriverById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId } = req.params;
      const isAdmin = (req as any).user?.role === 'ADMIN';
      const result = await crewService.getCrewMemberById(driverId, isAdmin);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateDriverBody;
      const result = await crewService.createDriver(body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId } = req.params;
      const body = req.body as UpdateDriverBody;
      const result = await crewService.updateDriver(driverId, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listConductors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = { ...(req.query as unknown as ListCrewQuery), role: 'CONDUCTOR' as const };
      const isAdmin = (req as any).user?.role === 'ADMIN';
      const result = await crewService.listCrewMembers(query, isAdmin);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getConductorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conductorId } = req.params;
      const isAdmin = (req as any).user?.role === 'ADMIN';
      const result = await crewService.getCrewMemberById(conductorId, isAdmin);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async createConductor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateConductorBody;
      const result = await crewService.createConductor(body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateConductor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conductorId } = req.params;
      const body = req.body as UpdateConductorBody;
      const result = await crewService.updateConductor(conductorId, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateCrewStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { crewId } = req.params;
      const body = req.body as UpdateCrewStatusBody;
      const result = await crewService.updateCrewStatus(crewId, body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async getCrewAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { crewId } = req.params;
      const result = await crewService.getCrewAssignments(crewId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const crewController = new CrewController();

