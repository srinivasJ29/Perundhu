/**
 * PERUNDHU (பேருந்து) — Route Filtering and Search Utility
 * Supports English and Tamil script search, category filtering, and whitespace normalization
 */

import { RouteListItem } from '../types';

export function filterRoutes(
  routes: RouteListItem[],
  query: string,
  categoryFilter: string = 'ALL'
): RouteListItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return routes.filter((route) => {
    // 1. Category Filter
    if (categoryFilter !== 'ALL' && route.serviceCategory !== categoryFilter) {
      return false;
    }

    // 2. Query Search
    if (!normalizedQuery) {
      return true;
    }

    // Check route number (e.g., "70", "77")
    if (route.routeNumber.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Check English display title
    if (route.displayTitleEn.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Check Tamil display title (Unicode comparison)
    if (route.displayTitleTa.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Check serving bus stands
    const matchesBusStand = route.servingBusStands.some((stand) =>
      stand.toLowerCase().includes(normalizedQuery)
    );
    if (matchesBusStand) {
      return true;
    }

    return false;
  });
}
