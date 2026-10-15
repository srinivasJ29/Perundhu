import { FilterQuery } from 'mongoose';
import { District, DistrictDocument, BusStand, BusStandDocument } from '../../models';
import { NotFoundError } from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';
import { ListDistrictsQuery } from './district.validation';

export interface DistrictDto {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  headquarters: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusStandDto {
  id: string;
  districtId: string;
  code: string;
  nameEn: string;
  nameTa: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  standType: string;
  totalPlatforms: number;
  createdAt: string;
  updatedAt: string;
}

export class DistrictService {
  /**
   * Retrieves active districts with optional search filter and bounded pagination.
   */
  public async getDistricts(query: ListDistrictsQuery): Promise<PaginatedResult<DistrictDto>> {
    const { page, limit, q } = query;
    const filter: FilterQuery<DistrictDocument> = { isActive: true };

    if (q && q.trim().length > 0) {
      const sanitizedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitizedQ, 'i');
      filter.$or = [{ nameEn: regex }, { nameTa: regex }, { code: regex }];
    }

    const [total, docs] = await Promise.all([
      District.countDocuments(filter),
      District.find(filter)
        .sort({ nameEn: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('_id code nameEn nameTa headquarters createdAt updatedAt')
        .lean()
    ]);

    const data: DistrictDto[] = docs.map((doc) => ({
      id: doc._id.toString(),
      code: doc.code,
      nameEn: doc.nameEn,
      nameTa: doc.nameTa,
      headquarters: doc.headquarters,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    }));

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Retrieves active bus stands belonging to an active district.
   */
  public async getBusStandsByDistrict(
    districtId: string,
    query: { page: number; limit: number }
  ): Promise<PaginatedResult<BusStandDto>> {
    const { page, limit } = query;

    // Verify district exists and is active
    const district = await District.findOne({ _id: districtId, isActive: true }).select('_id').lean();
    if (!district) {
      throw new NotFoundError(`District with ID '${districtId}' not found or inactive`);
    }

    const filter: FilterQuery<BusStandDocument> = { districtId, isActive: true };

    const [total, docs] = await Promise.all([
      BusStand.countDocuments(filter),
      BusStand.find(filter)
        .sort({ nameEn: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('_id districtId code nameEn nameTa location standType totalPlatforms createdAt updatedAt')
        .lean()
    ]);

    const data: BusStandDto[] = docs.map((doc) => ({
      id: doc._id.toString(),
      districtId: doc.districtId.toString(),
      code: doc.code,
      nameEn: doc.nameEn,
      nameTa: doc.nameTa,
      location: doc.location,
      standType: doc.standType,
      totalPlatforms: doc.totalPlatforms,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    }));

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }
}

export const districtService = new DistrictService();
