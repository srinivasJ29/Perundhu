/**
 * PERUNDHU (பேருந்து) — Map Data Service
 * Connects directly to verified backend REST endpoints without mock data.
 */

import { districtsService } from '../../../services/api/districts.service';
import { busStandsService } from '../../../services/api/busStands.service';
import { routesService } from '../../../services/api/routes.service';
import { tripsService } from '../../../services/api/trips.service';
import { busesService } from '../../../services/api/buses.service';
import {
  BusStandDto,
  NearbyBusStandDto,
  RouteDirectionDetailDto,
  StandRouteDto,
  ScheduledTripDto,
  BusDto
} from '../../../types/domain';

export const mapDataService = {
  /**
   * Fetches bus stands for a specified district.
   */
  async getDistrictBusStands(districtId: string): Promise<BusStandDto[]> {
    try {
      const res = await districtsService.getBusStandsByDistrict(districtId, { limit: 50 });
      return res.data || [];
    } catch (err) {
      console.warn(`Failed to fetch bus stands for district ${districtId}:`, err);
      return [];
    }
  },

  /**
   * Queries nearby bus stands using user's genuine GPS coordinates.
   */
  async getNearbyBusStands(
    lat: number,
    lng: number,
    radiusMeters = 10000
  ): Promise<NearbyBusStandDto[]> {
    try {
      const res = await busStandsService.getNearbyBusStands({
        lat,
        lng,
        radiusMeters
      });
      return res.data || [];
    } catch (err) {
      console.warn('Failed to query nearby bus stands:', err);
      return [];
    }
  },

  /**
   * Fetches detailed route geometry, ordered stop sequences, and direction metadata.
   */
  async getRouteDirectionDetails(
    routeId: string,
    directionId: string
  ): Promise<RouteDirectionDetailDto> {
    return routesService.getRouteDirectionDetails(routeId, directionId);
  },

  /**
   * Fetches routes serving a specific bus stand.
   */
  async getRoutesServingBusStand(standId: string): Promise<StandRouteDto[]> {
    try {
      const res = await busStandsService.getRoutesByBusStand(standId, { limit: 20 });
      return res.data || [];
    } catch (err) {
      console.warn(`Failed to fetch routes for bus stand ${standId}:`, err);
      return [];
    }
  },

  /**
   * Fetches active trips currently reporting transit.
   */
  async getActiveTrips(): Promise<ScheduledTripDto[]> {
    try {
      const res = await tripsService.getActiveTrips({ limit: 50 });
      return res.data || [];
    } catch (err) {
      console.warn('Failed to fetch active trips:', err);
      return [];
    }
  },

  /**
   * Fetches registered fleet buses.
   */
  async getRegisteredBuses(): Promise<BusDto[]> {
    try {
      const res = await busesService.getBuses({ limit: 50 });
      return res.data || [];
    } catch (err) {
      console.warn('Failed to fetch buses:', err);
      return [];
    }
  }
};
