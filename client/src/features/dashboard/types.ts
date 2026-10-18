/**
 * PERUNDHU (பேருந்து) — Step 6 Home Dashboard Types
 * Aligned strictly with verified backend DTOs and contracts
 */

import {
  BusStandDto,
  NearbyBusStandDto,
  RouteTimetableDto,
  BusDto
} from '../../types/domain';

export interface DashboardDistrictInfo {
  id?: string;
  code: string;
  nameEn: string;
  nameTa: string;
  isPilot: boolean;
}

export interface DashboardRouteSummary {
  id: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  serviceCategory: string;
  activeDirectionId: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  originNameEn: string;
  originNameTa: string;
  destinationNameEn: string;
  destinationNameTa: string;
  totalDistanceKm: number;
  estimatedDurationMins: number;
  stopsCount: number;
}

export interface SearchLocationOption {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  type: 'BUS_STAND' | 'BUS_STOP';
  landmark?: string;
}

export interface DirectRouteMatch {
  routeNumber: string;
  routeId: string;
  displayTitleEn: string;
  displayTitleTa: string;
  directionId: string;
  fromStopName: string;
  toStopName: string;
}

export interface LiveBusOverviewState {
  isLoading: boolean;
  activeTripsCount: number;
  registeredFleetCount: number;
  reportingBusesCount: number;
  isSimulatedSource: boolean;
  buses: BusDto[];
  lastCheckedTime: string;
  error?: string | null;
}

export interface NearbyStandsState {
  isLoading: boolean;
  permissionRequested: boolean;
  permissionDenied: boolean;
  errorMessage: string | null;
  stands: (NearbyBusStandDto | BusStandDto)[];
  userCoordinates: { lat: number; lng: number } | null;
}

export interface TimetableModalState {
  isOpen: boolean;
  isLoading: boolean;
  routeNumber: string;
  data: RouteTimetableDto | null;
  error: string | null;
}
