import { httpClient } from './client';
import {
  BusDto,
  ScheduledTripDto,
  DynamicBusEtaDto
} from '../../types/domain';
import { PaginatedResult, ApiSuccessResponse } from '../../types/api';

export interface ListBusesParams {
  page?: number;
  limit?: number;
  status?: string;
  vehicleType?: string;
}

export interface BusTripsParams {
  dayOfWeek?: string;
  page?: number;
  limit?: number;
}

export const busesService = {
  async getBuses(params: ListBusesParams = {}): Promise<PaginatedResult<BusDto>> {
    return httpClient.get<PaginatedResult<BusDto>>('/buses', {
      params: {
        page: params.page,
        limit: params.limit,
        status: params.status,
        vehicleType: params.vehicleType
      }
    });
  },

  async getBusById(busId: string): Promise<BusDto> {
    const res = await httpClient.get<ApiSuccessResponse<BusDto>>(`/buses/${busId}`);
    return res.data;
  },

  async getBusTrips(
    busId: string,
    params: BusTripsParams = {}
  ): Promise<PaginatedResult<ScheduledTripDto>> {
    return httpClient.get<PaginatedResult<ScheduledTripDto>>(`/buses/${busId}/trips`, {
      params: {
        dayOfWeek: params.dayOfWeek,
        page: params.page,
        limit: params.limit
      }
    });
  },

  async getBusEta(busId: string): Promise<DynamicBusEtaDto> {
    const res = await httpClient.get<{ success: boolean; data: DynamicBusEtaDto }>(
      `/buses/${busId}/eta`
    );
    return res.data;
  }
};
