/**
 * PERUNDHU (பேருந்து) — Phase 12 Operations API Client
 * Type-safe interface to administrative, depot manager, dispatcher, driver,
 * and conductor backend endpoints.
 */

import { httpClient } from './client';
import {
  TransportAdminDashboardData,
  DepotManagerDashboardData,
  DispatcherDashboardData,
  DriverDashboardData,
  ConductorDashboardData,
  ReportType
} from '../../types/domain';

export class OperationsApiService {
  /**
   * Transport Administrator Command Centre
   */
  public async getTransportAdminDashboard(): Promise<TransportAdminDashboardData> {
    const res = await httpClient.get<{ success: boolean; data: TransportAdminDashboardData }>(
      '/operations/dashboard/transport-admin'
    );
    return res.data;
  }

  /**
   * Depot Manager Operational Dashboard
   */
  public async getDepotManagerDashboard(depotId?: string): Promise<DepotManagerDashboardData> {
    const query = depotId ? `?depotId=${encodeURIComponent(depotId)}` : '';
    const res = await httpClient.get<{ success: boolean; data: DepotManagerDashboardData }>(
      `/operations/dashboard/depot-manager${query}`
    );
    return res.data;
  }

  /**
   * Dispatcher Live Operations Feed
   */
  public async getDispatcherDashboard(
    depotId?: string,
    includeSimulated = false
  ): Promise<DispatcherDashboardData> {
    const params = new URLSearchParams();
    if (depotId) params.append('depotId', depotId);
    if (includeSimulated) params.append('includeSimulated', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await httpClient.get<{ success: boolean; data: DispatcherDashboardData }>(
      `/operations/dashboard/dispatcher${queryString}`
    );
    return res.data;
  }

  /**
   * Driver Mobile-First Portal
   */
  public async getDriverDashboard(): Promise<DriverDashboardData> {
    const res = await httpClient.get<{ success: boolean; data: DriverDashboardData }>(
      '/operations/dashboard/driver'
    );
    return res.data;
  }

  public async driverConfirmReady(tripId: string): Promise<{ success: boolean; tripId: string }> {
    const res = await httpClient.post<{ success: boolean; data: { success: boolean; tripId: string } }>(
      `/operations/driver/trips/${tripId}/ready`,
      {}
    );
    return res.data;
  }

  public async driverStartTrip(
    tripId: string
  ): Promise<{ success: boolean; tripId: string; status: string }> {
    const res = await httpClient.post<{ success: boolean; data: { success: boolean; tripId: string; status: string } }>(
      `/operations/driver/trips/${tripId}/start`,
      {}
    );
    return res.data;
  }

  public async driverCompleteTrip(
    tripId: string
  ): Promise<{ success: boolean; tripId: string; status: string }> {
    const res = await httpClient.post<{ success: boolean; data: { success: boolean; tripId: string; status: string } }>(
      `/operations/driver/trips/${tripId}/complete`,
      {}
    );
    return res.data;
  }

  /**
   * Conductor Mobile-First Portal
   */
  public async getConductorDashboard(): Promise<ConductorDashboardData> {
    const res = await httpClient.get<{ success: boolean; data: ConductorDashboardData }>(
      '/operations/dashboard/conductor'
    );
    return res.data;
  }

  /**
   * Depot Manager Trip Assignments
   */
  public async assignTripBus(
    tripId: string,
    busId: string
  ): Promise<{ success: boolean; tripId: string; busId: string }> {
    const res = await httpClient.post<{ success: boolean; data: { success: boolean; tripId: string; busId: string } }>(
      '/operations/assignments/trip-bus',
      { tripId, busId }
    );
    return res.data;
  }

  public async assignTripDriver(
    tripId: string,
    driverId: string
  ): Promise<{ success: boolean; tripId: string; driverId: string }> {
    const res = await httpClient.post<{ success: boolean; data: { success: boolean; tripId: string; driverId: string } }>(
      '/operations/assignments/trip-driver',
      { tripId, driverId }
    );
    return res.data;
  }

  public async assignTripConductor(
    tripId: string,
    conductorId: string
  ): Promise<{ success: boolean; tripId: string; conductorId: string }> {
    const res = await httpClient.post<{ success: boolean; data: { success: boolean; tripId: string; conductorId: string } }>(
      '/operations/assignments/trip-conductor',
      { tripId, conductorId }
    );
    return res.data;
  }

  public async addTripRemark(
    tripId: string,
    remark: string
  ): Promise<{ success: boolean; tripId: string }> {
    const res = await httpClient.post<{ success: boolean; data: { success: boolean; tripId: string } }>(
      `/operations/trips/${tripId}/remarks`,
      { remark }
    );
    return res.data;
  }

  /**
   * Role-Authorized CSV Export
   */
  public async exportReport(reportType: ReportType, depotId?: string): Promise<string> {
    const params = new URLSearchParams({ reportType });
    if (depotId) params.append('depotId', depotId);

    // Using raw window.fetch or httpClient to fetch CSV text
    const res = await httpClient.get<string>(`/operations/reports/export?${params.toString()}`);
    return res as unknown as string;
  }
}

export const operationsService = new OperationsApiService();

