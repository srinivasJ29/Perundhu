import { Request, Response, NextFunction } from 'express';
import { districtService } from './district.service';
import { ListDistrictsQuery } from './district.validation';

export class DistrictController {
  public async listDistricts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListDistrictsQuery;
      const result = await districtService.getDistricts(query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async listBusStandsByDistrict(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { districtId } = req.params;
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await districtService.getBusStandsByDistrict(districtId, { page, limit });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const districtController = new DistrictController();
