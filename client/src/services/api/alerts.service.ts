/**
 * PERUNDHU (பேருந்து) — Service Alerts & Transit Advisories API Client
 */

import { httpClient } from './client';
import { ServiceAlertDto, ServiceAlertType, ServiceAlertSeverity } from '../../types/domain';

export interface ListAlertsParams {
  districtCode?: string;
  routeNumber?: string;
  severity?: ServiceAlertSeverity;
  alertType?: ServiceAlertType;
  isActive?: boolean;
}

export const alertsService = {
  async getAlerts(params: ListAlertsParams = {}): Promise<ServiceAlertDto[]> {
    const res = await httpClient.get<{ success: boolean; data: ServiceAlertDto[]; count: number }>('/alerts', {
      params: {
        districtCode: params.districtCode,
        routeNumber: params.routeNumber,
        severity: params.severity,
        alertType: params.alertType,
        isActive: params.isActive !== undefined ? String(params.isActive) : undefined
      }
    });
    return res.data;
  },

  async getAlertById(alertId: string): Promise<ServiceAlertDto> {
    const res = await httpClient.get<{ success: boolean; data: ServiceAlertDto }>(`/alerts/${alertId}`);
    return res.data;
  }
};

