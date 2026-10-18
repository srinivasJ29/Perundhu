import { httpClient } from './client';
import {
  ScheduledTripDto,
  NextStopDetectionDto,
  DynamicTripEtaDto,
  RouteTimetableDto,
  StopDeparturesDto
} from '../../types/domain';
import { PaginatedResult, ApiSuccessResponse } from '../../types/api';

export interface ListTripsParams {
  page?: number;
  limit?: number;
  status?: string;
  routeDirectionId?: string;
}

export interface ActiveTripsParams {
  page?: number;
  limit?: number;
}

export interface RouteTimetableParams {
  dayOfWeek?: string;
}

export interface StopDeparturesParams {
  fromTime?: string;
  toTime?: string;
}

export const tripsService = {
  async getTrips(params: ListTripsParams = {}): Promise<PaginatedResult<ScheduledTripDto>> {
    return httpClient.get<PaginatedResult<ScheduledTripDto>>('/trips', {
      params: {
        page: params.page,
        limit: params.limit,
        status: params.status,
        routeDirectionId: params.routeDirectionId
      }
    });
  },

  async getActiveTrips(params: ActiveTripsParams = {}): Promise<PaginatedResult<ScheduledTripDto>> {
    return httpClient.get<PaginatedResult<ScheduledTripDto>>('/trips/active', {
      params: {
        page: params.page,
        limit: params.limit
      }
    });
  },

  async getTripById(tripId: string): Promise<ScheduledTripDto> {
    const res = await httpClient.get<ApiSuccessResponse<ScheduledTripDto>>(`/trips/${tripId}`);
    return res.data;
  },

  async getNextStop(tripId: string): Promise<NextStopDetectionDto> {
    const res = await httpClient.get<{ success: boolean; data: NextStopDetectionDto }>(
      `/trips/${tripId}/next-stop`
    );
    return res.data;
  },

  async getTripEta(tripId: string): Promise<DynamicTripEtaDto> {
    const res = await httpClient.get<{ success: boolean; data: DynamicTripEtaDto }>(
      `/trips/${tripId}/eta`
    );
    return res.data;
  },

  async getRouteTimetable(
    routeId: string,
    params: RouteTimetableParams = {}
  ): Promise<RouteTimetableDto> {
    return httpClient.get<RouteTimetableDto>(`/routes/${routeId}/timetable`, {
      params: {
        dayOfWeek: params.dayOfWeek
      }
    });
  },

  async getStopDepartures(
    stopId: string,
    params: StopDeparturesParams = {}
  ): Promise<StopDeparturesDto> {
    return httpClient.get<StopDeparturesDto>(`/stops/${stopId}/departures`, {
      params: {
        fromTime: params.fromTime,
        toTime: params.toTime
      }
    });
  }
};
