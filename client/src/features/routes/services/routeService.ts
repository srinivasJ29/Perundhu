/**
 * PERUNDHU (பேருந்து) — Route Data Service
 * Integrates directly with verified backend REST endpoints:
 * - GET /api/v1/districts/:districtId/bus-stands
 * - GET /api/v1/bus-stands/:standId/routes
 * - GET /api/v1/routes/:routeId/directions/:directionId
 */

import { districtsService } from '../../../services/api/districts.service';
import { busStandsService } from '../../../services/api/busStands.service';
import { routesService } from '../../../services/api/routes.service';
import { RouteListItem } from '../types';
import { RouteDirectionDetailDto } from '../../../types/domain';

export const routeService = {
  /**
   * Fetches and aggregates all routes serving bus stands in the specified district.
   * Deduplicates multiple stops/directions for clean passenger presentation.
   */
  async getRoutesForDistrict(districtBackendId: string): Promise<RouteListItem[]> {
    // 1. Fetch bus stands in the district
    const standsResult = await districtsService.getBusStandsByDistrict(districtBackendId, {
      limit: 50
    });

    const stands = standsResult.data || [];
    if (stands.length === 0) {
      return [];
    }

    // 2. Fetch routes serving each bus stand in parallel
    const routeMap = new Map<string, RouteListItem>();

    const routePromises = stands.map(async (stand) => {
      try {
        const routesResult = await busStandsService.getRoutesByBusStand(stand.id, { limit: 50 });
        const standRoutes = routesResult.data || [];

        for (const sr of standRoutes) {
          const existing = routeMap.get(sr.id) || routeMap.get(sr.routeNumber);
          if (existing) {
            // Merge unique directions
            for (const d of sr.directions) {
              const hasDir = existing.directions.some(
                (ed) => ed.id === d.id || ed.directionCode === d.directionCode
              );
              if (!hasDir) {
                existing.directions.push(d);
              }
            }
            if (!existing.servingBusStands.includes(stand.nameEn)) {
              existing.servingBusStands.push(stand.nameEn);
            }
          } else {
            routeMap.set(sr.id, {
              id: sr.id,
              routeNumber: sr.routeNumber,
              displayTitleEn: sr.displayTitleEn,
              displayTitleTa: sr.displayTitleTa,
              serviceCategory: sr.serviceCategory,
              directions: [...sr.directions],
              servingBusStands: [stand.nameEn]
            });
          }
        }
      } catch (err) {
        // Individual stand fetch failure logged, continuing with remaining stands
        console.warn(`Could not load routes for stand ${stand.id}:`, err);
      }
    });

    await Promise.all(routePromises);

    // Sort routes by route number (natural order: 70 before 77)
    return Array.from(routeMap.values()).sort((a, b) => {
      const numA = parseInt(a.routeNumber, 10);
      const numB = parseInt(b.routeNumber, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.routeNumber.localeCompare(b.routeNumber);
    });
  },

  /**
   * Fetches detailed direction itinerary and ordered stop sequences for a route.
   */
  async getRouteDirectionDetails(
    routeId: string,
    directionId: string
  ): Promise<RouteDirectionDetailDto> {
    return routesService.getRouteDirectionDetails(routeId, directionId);
  }
};
