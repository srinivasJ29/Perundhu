import { httpClient } from './client';
import { NearbyBusStandDto, StandRouteDto } from '../../types/domain';
import { PaginatedResult } from '../../types/api';

export interface NearbyBusStandsParams {
  lat: number;
  lng: number;
  radiusMeters?: number;
  page?: number;
  limit?: number;
}

export interface StandRoutesParams {
  page?: number;
  limit?: number;
}

export const busStandsService = {
  async getNearbyBusStands(
    params: NearbyBusStandsParams
  ): Promise<PaginatedResult<NearbyBusStandDto>> {
    return httpClient.get<PaginatedResult<NearbyBusStandDto>>('/bus-stands/nearby', {
      params: {
        lat: params.lat,
        lng: params.lng,
        radiusMeters: params.radiusMeters ?? 10000,
        page: params.page,
        limit: params.limit
      }
    });
  },

  async getRoutesByBusStand(
    standId: string,
    params: StandRoutesParams = {}
  ): Promise<PaginatedResult<StandRouteDto>> {
    return httpClient.get<PaginatedResult<StandRouteDto>>(`/bus-stands/${standId}/routes`, {
      params: {
        page: params.page,
        limit: params.limit
      }
    });
  }
};
