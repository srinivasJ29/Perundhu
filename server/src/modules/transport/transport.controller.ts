import { Request, Response, NextFunction } from 'express';
import { transportService } from './transport.service';

export class TransportController {
  // =========================================================================
  // 1. Organization
  // =========================================================================

  public async createOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.createOrganization(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getOrganizations(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getOrganizationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getOrganizationById(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 2. Division
  // =========================================================================

  public async createDivision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.createDivision(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listDivisions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDivisions(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getDivisionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDivisionById(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 3. Depot
  // =========================================================================

  public async createDepot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.createDepot(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listDepots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDepots(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getDepotById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDepotById(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateDepot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.updateDepot(req.params.id, req.body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 4. Workshop
  // =========================================================================

  public async createWorkshop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.createWorkshop(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listWorkshops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getWorkshops(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getWorkshopById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getWorkshopById(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 5. Crew Member
  // =========================================================================

  public async createCrewMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.createCrewMember(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listCrewMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = (req as any).user?.role === 'ADMIN';
      const result = await transportService.getCrewMembers(req.query as any, isAdmin);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getCrewMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = (req as any).user?.role === 'ADMIN';
      const result = await transportService.getCrewMemberById(req.params.id, isAdmin);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateCrewMemberStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.updateCrewMemberStatus(req.params.id, req.body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 6. Device Registry
  // =========================================================================

  public async createDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.createDevice(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDevices(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getDeviceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDeviceById(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async assignDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.assignDevice(req.params.id, req.body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 7. Maintenance Records
  // =========================================================================

  public async createMaintenanceRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.createMaintenanceRecord(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listMaintenanceRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getMaintenanceRecords(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getMaintenanceRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getMaintenanceRecordById(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateMaintenanceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.updateMaintenanceStatus(req.params.id, req.body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 8. Vehicle Replacement Records
  // =========================================================================

  public async createVehicleReplacement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authorizedBy = (req as any).user?.email || (req as any).user?.sub || 'AUTHORIZED_OFFICER';
      const result = await transportService.createVehicleReplacement(req.body, authorizedBy);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listVehicleReplacements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getVehicleReplacements(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getVehicleReplacementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getVehicleReplacementById(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateReplacementStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const performedBy = (req as any).user?.email || (req as any).user?.sub || 'AUTHORIZED_OFFICER';
      const result = await transportService.updateReplacementStatus(req.params.id, req.body, performedBy);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 9. Phase 2: Depot Fleet, Backup Depots, Reserves & Transfers
  // =========================================================================

  public async getDepotBuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDepotBuses(req.params.id, req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getBackupDepots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getBackupDepots(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async reassignBackupDepot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.reassignBackupDepot(
        req.params.id,
        req.body.newPrimaryDepotId
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateDepotStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.updateDepotStatus(req.params.id, req.body.status);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async getReserveFleet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getReserveFleet(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async setBusReserveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.setBusReserveStatus(
        req.params.id,
        req.body.isReserveFleet,
        req.body.reason
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async updateWorkshop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.updateWorkshop(req.params.id, req.body);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async requestDepotTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestedBy = (req as any).user?.email || (req as any).user?.sub || 'AUTHORIZED_OFFICER';
      const result = await transportService.requestDepotTransfer(req.body, requestedBy);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async approveDepotTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const approvedBy = (req as any).user?.email || (req as any).user?.sub || 'AUTHORIZED_OFFICER';
      const result = await transportService.approveDepotTransfer(
        req.params.id,
        approvedBy,
        req.body?.notes
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async rejectDepotTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rejectedBy = (req as any).user?.email || (req as any).user?.sub || 'AUTHORIZED_OFFICER';
      const result = await transportService.rejectDepotTransfer(
        req.params.id,
        rejectedBy,
        req.body?.notes
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async startDepotTransferTransit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const performedBy = (req as any).user?.email || (req as any).user?.sub || 'AUTHORIZED_OFFICER';
      const result = await transportService.startDepotTransferTransit(
        req.params.id,
        performedBy,
        req.body?.notes
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async completeDepotTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const completedBy = (req as any).user?.email || (req as any).user?.sub || 'AUTHORIZED_OFFICER';
      const result = await transportService.completeDepotTransfer(
        req.params.id,
        completedBy,
        req.body?.notes
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async cancelDepotTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cancelledBy = (req as any).user?.email || (req as any).user?.sub || 'AUTHORIZED_OFFICER';
      const result = await transportService.cancelDepotTransfer(
        req.params.id,
        cancelledBy,
        req.body?.notes
      );
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async listDepotTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDepotTransfers(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getDepotTransferById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDepotTransferById(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async getDepotStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getDepotStats(req.params.id);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  public async getGlobalTransportStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await transportService.getGlobalTransportStats();
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const transportController = new TransportController();

