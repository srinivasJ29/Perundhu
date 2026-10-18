import { httpClient } from './client';
import { DistrictDto, BusStandDto } from '../../types/domain';
import { PaginatedResult } from '../../types/api';

export interface ListDistrictsParams {
  page?: number;
  limit?: number;
  q?: string;
}

export interface ListDistrictBusStandsParams {
  page?: number;
  limit?: number;
}

export const districtsService = {
  async getDistricts(params: ListDistrictsParams = {}): Promise<PaginatedResult<DistrictDto>> {
    return httpClient.get<PaginatedResult<DistrictDto>>('/districts', {
      params: {
        page: params.page,
        limit: params.limit,
        q: params.q
      }
    });
  },

  async getBusStandsByDistrict(
    districtId: string,
    params: ListDistrictBusStandsParams = {}
  ): Promise<PaginatedResult<BusStandDto>> {
    return httpClient.get<PaginatedResult<BusStandDto>>(`/districts/${districtId}/bus-stands`, {
      params: {
        page: params.page,
        limit: params.limit
      }
    });
  }
};
