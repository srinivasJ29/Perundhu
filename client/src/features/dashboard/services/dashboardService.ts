/**
 * PERUNDHU (பேருந்து) — Dashboard Data Service
 * Connects directly to verified backend REST endpoints without mock data
 */

import { districtsService } from '../../../services/api/districts.service';
import { busStandsService } from '../../../services/api/busStands.service';
import { tripsService } from '../../../services/api/trips.service';
import { busesService } from '../../../services/api/buses.service';
import { routeService } from '../../routes/services/routeService';
import {
  NearbyBusStandDto,
  BusStandDto,
  RouteTimetableDto,
  BusDto
} from '../../../types/domain';
import { SearchLocationOption, LiveBusOverviewState } from '../types';

export const dashboardService = {
  /**
   * Fetches bus stands for a given district
   */
  async getDistrictBusStands(districtId: string): Promise<BusStandDto[]> {
    const res = await districtsService.getBusStandsByDistrict(districtId, { limit: 50 });
    return res.data || [];
  },

  /**
   * Fetches nearby bus stands using user's genuine WGS84 GPS coordinates
   */
  async getNearbyBusStands(
    lat: number,
    lng: number,
    radiusMeters = 10000
  ): Promise<NearbyBusStandDto[]> {
    const res = await busStandsService.getNearbyBusStands({
      lat,
      lng,
      radiusMeters
    });
    return res.data || [];
  },

  /**
   * Queries active reporting trips and fleet records from backend
   */
  async getLiveBusOverview(): Promise<Omit<LiveBusOverviewState, 'isLoading' | 'error'>> {
    const [tripsRes, busesRes] = await Promise.all([
      tripsService.getActiveTrips().catch((err) => {
        console.warn('Failed to query active trips:', err);
        return { data: [], pagination: { total: 0 } };
      }),
      busesService.getBuses({ limit: 50 }).catch((err) => {
        console.warn('Failed to query buses:', err);
        return { data: [], pagination: { total: 0 } };
      })
    ]);

    const activeTrips = tripsRes.data || [];
    const buses: BusDto[] = busesRes.data || [];

    // Filter active trips reporting telemetry
    const reportingCount = activeTrips.filter((t) => t.status === 'IN_TRANSIT').length;

    // Check if any trip explicitly carries simulated tags
    const isSimulatedSource = activeTrips.some(
      (t) => t.tripCode?.toLowerCase().includes('sim') || false
    );

    return {
      activeTripsCount: activeTrips.length,
      registeredFleetCount: buses.length,
      reportingBusesCount: reportingCount,
      isSimulatedSource,
      buses,
      lastCheckedTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  },

  /**
   * Fetches verified scheduled departure timetable for a route
   */
  async getRouteTimetable(routeId: string): Promise<RouteTimetableDto> {
    return tripsService.getRouteTimetable(routeId);
  },

  /**
   * Populates origin & destination search suggestions ONLY from verified backend stops and bus stands
   */
  async getLocationSuggestions(districtBackendId: string): Promise<SearchLocationOption[]> {
    const suggestionsMap = new Map<string, SearchLocationOption>();

    try {
      // 1. Add bus stands for the district
      const stands = await this.getDistrictBusStands(districtBackendId);
      for (const s of stands) {
        suggestionsMap.set(s.id, {
          id: s.id,
          code: s.code,
          nameEn: s.nameEn,
          nameTa: s.nameTa,
          type: 'BUS_STAND',
          landmark: `${s.totalPlatforms} Platforms`
        });
      }

      // 2. Fetch routes and inspect stop sequence to add verified intermediate bus stops
      const routes = await routeService.getRoutesForDistrict(districtBackendId);
      for (const route of routes) {
        const outbound = route.directions.find((d) => d.directionCode === 'OUTBOUND') || route.directions[0];
        if (outbound) {
          try {
            const detail = await routeService.getRouteDirectionDetails(route.id, outbound.id);
            if (detail?.direction?.stops) {
              for (const seq of detail.direction.stops) {
                if (!suggestionsMap.has(seq.stop.id)) {
                  suggestionsMap.set(seq.stop.id, {
                    id: seq.stop.id,
                    code: seq.stop.code,
                    nameEn: seq.stop.nameEn,
                    nameTa: seq.stop.nameTa,
                    type: 'BUS_STOP',
                    landmark: seq.stop.landmark
                  });
                }
              }
            }
          } catch {
            // Ignore individual direction details failure
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load location suggestions:', err);
    }

    return Array.from(suggestionsMap.values()).sort((a, b) =>
      a.nameEn.localeCompare(b.nameEn)
    );
  }
};
