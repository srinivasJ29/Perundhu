/**
 * PERUNDHU (பேருந்து) — Hook to manage district routes and selection state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { routeService } from '../services/routeService';
import { districtsService } from '../../../services/api/districts.service';
import { RouteListItem } from '../types';
import { STORAGE_KEYS } from '../../../config/constants';
import { safeGetItem, safeSetItem } from '../../../lib/storage';

export function useDistrictRoutes(districtCodeParam?: string) {
  const districtCode = (districtCodeParam || 'mdu').toUpperCase();
  const isMaduraiPilot = districtCode === 'MDU';

  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [districtName, setDistrictName] = useState({ en: 'Madurai', ta: 'மதுரை' });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const backendIdRef = useRef<string | null>(null);

  // Selected route state
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(() => {
    return safeGetItem<string | null>(STORAGE_KEYS.SELECTED_ROUTE, null);
  });

  const fetchRoutes = useCallback(async () => {
    if (!isMaduraiPilot) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Resolve backend district ID
      let backendId = backendIdRef.current;
      if (!backendId) {
        const districtsRes = await districtsService.getDistricts({ limit: 50 });
        const mdu = districtsRes.data.find((d) => d.code.toUpperCase() === 'MDU');
        if (mdu) {
          backendId = mdu.id;
          backendIdRef.current = mdu.id;
          setDistrictName({ en: mdu.nameEn, ta: mdu.nameTa });
        }
      }

      if (!backendId) {
        throw new Error('Pilot district record not found in backend database');
      }

      // 2. Fetch routes for the resolved district
      const items = await routeService.getRoutesForDistrict(backendId);
      setRoutes(items);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load routes from backend service';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isMaduraiPilot]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const selectRoute = (route: RouteListItem) => {
    setSelectedRouteId(route.id);
    safeSetItem(STORAGE_KEYS.SELECTED_ROUTE || 'perundhu:pref:route', route.id);
  };

  return {
    routes,
    isLoading,
    error,
    refetch: fetchRoutes,
    districtCode,
    districtName,
    isMaduraiPilot,
    selectedRouteId,
    selectRoute
  };
}
