/**
 * PERUNDHU (பேருந்து) — Route Selection Module Types (Step 5)
 * Strictly aligned with verified backend domain schemas
 */

import {
  RouteSummaryDto,
  RouteDirectionDetailDto,
  StandRouteDirectionDto,
  DirectionStopSequenceDto
} from '../../types/domain';

export type ServiceCategory = 'TOWN_SERVICE' | 'MOFUSSIL' | 'EXPRESS';

export type DirectionCode = 'OUTBOUND' | 'INBOUND';

export interface RouteListItem {
  id: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  serviceCategory: string;
  directions: StandRouteDirectionDto[];
  servingBusStands: string[];
}

export interface RouteFilterOptions {
  query?: string;
  category?: 'ALL' | ServiceCategory;
  busStandId?: string;
}

export interface SelectedRouteState {
  routeId: string;
  routeNumber: string;
  directionId: string;
  directionCode: DirectionCode;
  districtCode: string;
}

export type {
  RouteSummaryDto,
  RouteDirectionDetailDto,
  StandRouteDirectionDto,
  DirectionStopSequenceDto
};
