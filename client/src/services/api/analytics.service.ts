/**
 * PERUNDHU (பேருந்து) — Fleet Analytics & Optimization API Client
 */

import { httpClient } from './client';
import {
  FleetOverviewKpiDto,
  RoutePerformanceDto,
  ScheduleAdherenceDto,
  DemandAnalyticsDto,
  FleetUtilizationDto,
  OptimizationRecommendationDto,
  HumanReviewStatus
} from '../../types/domain';

export interface RoutePerformanceFilter {
  [key: string]: string | number | boolean | null | undefined;
  routeId?: string;
  directionId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ScheduleAdherenceFilter {
  [key: string]: string | number | boolean | null | undefined;
  routeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DemandAnalyticsFilter {
  [key: string]: string | number | boolean | null | undefined;
  routeId?: string;
  stopId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FleetUtilizationFilter {
  [key: string]: string | number | boolean | null | undefined;
  depotId?: string;
  startDate?: string;
  endDate?: string;
}

export interface RecommendationsFilter {
  [key: string]: string | number | boolean | null | undefined;
  category?: string;
  status?: string;
  severity?: string;
}

export interface ReviewRecommendationPayload {
  status: HumanReviewStatus;
  decisionNotes?: string;
}

export interface ReportExportParams {
  [key: string]: string | number | boolean | null | undefined;
  reportType: 'FLEET_OVERVIEW' | 'ROUTE_PERFORMANCE' | 'SCHEDULE_ADHERENCE' | 'FLEET_UTILIZATION' | 'RECOMMENDATIONS';
  format: 'JSON' | 'CSV';
  routeId?: string;
  depotId?: string;
  startDate?: string;
  endDate?: string;
}

export const analyticsService = {
  async getFleetOverviewKpi(): Promise<FleetOverviewKpiDto> {
    const res = await httpClient.get<{ success: boolean; data: FleetOverviewKpiDto }>(
      '/analytics/overview'
    );
    return res.data;
  },

  async getRoutePerformance(params: RoutePerformanceFilter = {}): Promise<RoutePerformanceDto> {
    const res = await httpClient.get<{ success: boolean; data: RoutePerformanceDto }>(
      '/analytics/routes/performance',
      { params }
    );
    return res.data;
  },

  async getScheduleAdherence(params: ScheduleAdherenceFilter = {}): Promise<ScheduleAdherenceDto> {
    const res = await httpClient.get<{ success: boolean; data: ScheduleAdherenceDto }>(
      '/analytics/routes/schedule-adherence',
      { params }
    );
    return res.data;
  },

  async getDemandAnalytics(params: DemandAnalyticsFilter = {}): Promise<DemandAnalyticsDto> {
    const res = await httpClient.get<{ success: boolean; data: DemandAnalyticsDto }>(
      '/analytics/demand',
      { params }
    );
    return res.data;
  },

  async getFleetUtilization(params: FleetUtilizationFilter = {}): Promise<FleetUtilizationDto> {
    const res = await httpClient.get<{ success: boolean; data: FleetUtilizationDto }>(
      '/analytics/fleet/utilization',
      { params }
    );
    return res.data;
  },

  async getRecommendations(params: RecommendationsFilter = {}): Promise<OptimizationRecommendationDto[]> {
    const res = await httpClient.get<{ success: boolean; data: OptimizationRecommendationDto[] }>(
      '/analytics/recommendations',
      { params }
    );
    return res.data;
  },

  async reviewRecommendation(
    id: string,
    payload: ReviewRecommendationPayload
  ): Promise<OptimizationRecommendationDto> {
    const res = await httpClient.patch<{ success: boolean; data: OptimizationRecommendationDto }>(
      `/analytics/recommendations/${id}/review`,
      payload
    );
    return res.data;
  },

  async exportReport(params: ReportExportParams): Promise<{ data: string; contentType: string }> {
    const res = await httpClient.get<any>('/analytics/reports/export', {
      params
    });
    const isCsv = params.format === 'CSV';
    return {
      data: typeof res === 'string' ? res : JSON.stringify(res, null, 2),
      contentType: isCsv ? 'text/csv' : 'application/json'
    };
  }
};
