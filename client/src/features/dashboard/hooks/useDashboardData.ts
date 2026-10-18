/**
 * PERUNDHU (பேருந்து) — Hook to manage state and API lifecycle for Home Dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userPreferences } from '../../../state/userPreferences';
import { STORAGE_KEYS, PILOT_CONFIG } from '../../../config/constants';
import { safeGetItem, safeSetItem } from '../../../lib/storage';
import { districtsService } from '../../../services/api/districts.service';
import { routeService } from '../../routes/services/routeService';
import { requestUserGeolocation } from '../../location/geolocation';
import { dashboardService } from '../services/dashboardService';
import {
  DashboardDistrictInfo,
  DashboardRouteSummary,
  SearchLocationOption,
  LiveBusOverviewState,
  NearbyStandsState,
  TimetableModalState
} from '../types';
import { RouteListItem } from '../../routes/types';
import { BusStandDto } from '../../../types/domain';

export function useDashboardData() {
  const [searchParams] = useSearchParams();

  // 1. District State
  const [district, setDistrict] = useState<DashboardDistrictInfo>(() => {
    let nameEn: string = PILOT_CONFIG.DISTRICT_NAME_EN;
    let nameTa: string = PILOT_CONFIG.DISTRICT_NAME_TA;

    try {
      const pref = userPreferences.getSelectedDistrict() as unknown;
      if (typeof pref === 'string') {
        if (pref.toLowerCase() === 'mdu' || pref.toLowerCase() === 'madurai') {
          nameEn = PILOT_CONFIG.DISTRICT_NAME_EN;
          nameTa = PILOT_CONFIG.DISTRICT_NAME_TA;
        }
      } else if (pref && typeof pref === 'object') {
        const obj = pref as Record<string, string>;
        if (obj.nameEn) nameEn = obj.nameEn;
        if (obj.nameTa) nameTa = obj.nameTa;
      }
    } catch {
      // Fallback to Madurai pilot default
    }

    const isPilot =
      nameEn.toLowerCase() === PILOT_CONFIG.DISTRICT_NAME_EN.toLowerCase();

    return {
      code: isPilot ? 'MDU' : 'CHN',
      nameEn,
      nameTa,
      isPilot
    };
  });

  const [districtBackendId, setDistrictBackendId] = useState<string | null>(null);

  // 2. Routes in District
  const [districtRoutes, setDistrictRoutes] = useState<RouteListItem[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(true);

  // 3. Selected Route Summary State
  const [selectedRoute, setSelectedRoute] = useState<DashboardRouteSummary | null>(null);
  const [isLoadingRouteDetail, setIsLoadingRouteDetail] = useState<boolean>(false);

  // 4. Location search options (stops & stands)
  const [locationOptions, setLocationOptions] = useState<SearchLocationOption[]>([]);

  // 5. Live bus overview telemetry state
  const [liveOverview, setLiveOverview] = useState<LiveBusOverviewState>({
    isLoading: true,
    activeTripsCount: 0,
    registeredFleetCount: 0,
    reportingBusesCount: 0,
    isSimulatedSource: false,
    buses: [],
    lastCheckedTime: '--:--:--'
  });

  // 6. Nearby bus stands state
  const [nearbyStands, setNearbyStands] = useState<NearbyStandsState>({
    isLoading: false,
    permissionRequested: false,
    permissionDenied: false,
    errorMessage: null,
    stands: [],
    userCoordinates: null
  });

  // 7. Timetable modal state
  const [timetableModal, setTimetableModal] = useState<TimetableModalState>({
    isOpen: false,
    isLoading: false,
    routeNumber: '',
    data: null,
    error: null
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Resolve District Backend ID and available routes
  const loadDistrictAndRoutes = useCallback(async () => {
    setIsLoadingRoutes(true);
    try {
      // Fetch backend district records to match code
      const districtsRes = await districtsService.getDistricts({ limit: 50 });
      const currentCode = (searchParams.get('district') || district?.code || 'MDU').toUpperCase();
      const matched = districtsRes.data.find(
        (d) => d.code.toUpperCase() === currentCode
      ) || districtsRes.data.find((d) => d.code.toUpperCase() === 'MDU');

      if (matched && isMountedRef.current) {
        setDistrictBackendId(matched.id);
        const isPilot = matched.code.toUpperCase() === 'MDU';
        setDistrict({
          id: matched.id,
          code: matched.code,
          nameEn: matched.nameEn,
          nameTa: matched.nameTa,
          isPilot
        });

        // Load verified routes for this district
        if (isPilot) {
          const routes = await routeService.getRoutesForDistrict(matched.id);
          if (isMountedRef.current) {
            setDistrictRoutes(routes);

            // Also load search location options (stops + stands)
            dashboardService
              .getLocationSuggestions(matched.id)
              .then((options) => {
                if (isMountedRef.current) {
                  setLocationOptions(options);
                }
              })
              .catch((err) => console.warn('Failed to load stop suggestions:', err));
          }
        } else {
          setDistrictRoutes([]);
        }
      }
    } catch (err) {
      console.warn('Failed to load district data:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingRoutes(false);
      }
    }
  }, [district.code, searchParams]);

  // Load live bus overview
  const refreshLiveOverview = useCallback(async () => {
    try {
      const data = await dashboardService.getLiveBusOverview();
      if (isMountedRef.current) {
        setLiveOverview({
          isLoading: false,
          ...data,
          error: null
        });
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setLiveOverview((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Telemetry offline'
        }));
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDistrictAndRoutes();
    refreshLiveOverview();
  }, [loadDistrictAndRoutes, refreshLiveOverview]);

  // Synchronize Selected Route with query params or storage
  useEffect(() => {
    if (districtRoutes.length === 0) {
      return;
    }

    const routeIdParam = searchParams.get('routeId');
    const storedRouteId = safeGetItem<string | null>(STORAGE_KEYS.SELECTED_ROUTE, null);
    const targetRouteId = routeIdParam || storedRouteId;

    if (!targetRouteId) {
      setSelectedRoute(null);
      return;
    }

    const matchedRoute =
      districtRoutes.find((r) => r.id === targetRouteId) ||
      districtRoutes.find((r) => r.routeNumber === targetRouteId);

    if (!matchedRoute) {
      return;
    }

    const directionIdParam = searchParams.get('directionId');
    const activeDir =
      matchedRoute.directions.find((d) => d.id === directionIdParam) ||
      matchedRoute.directions[0];

    if (!activeDir) {
      return;
    }

    setIsLoadingRouteDetail(true);

    // Fetch detailed stop sequence for accurate count and stop names
    routeService
      .getRouteDirectionDetails(matchedRoute.id, activeDir.id)
      .then((detail) => {
        if (!isMountedRef.current) return;
        const stops = detail?.direction?.stops || [];
        const originStop = stops[0]?.stop;
        const destStop = stops[stops.length - 1]?.stop;

        setSelectedRoute({
          id: matchedRoute.id,
          routeNumber: matchedRoute.routeNumber,
          displayTitleEn: matchedRoute.displayTitleEn,
          displayTitleTa: matchedRoute.displayTitleTa,
          serviceCategory: matchedRoute.serviceCategory,
          activeDirectionId: activeDir.id,
          directionCode: activeDir.directionCode,
          originNameEn: originStop?.nameEn || 'Origin Terminal',
          originNameTa: originStop?.nameTa || 'தொடக்க முனையம்',
          destinationNameEn: destStop?.nameEn || 'Destination Terminal',
          destinationNameTa: destStop?.nameTa || 'முடிவு முனையம்',
          totalDistanceKm: activeDir.totalDistanceKm,
          estimatedDurationMins: activeDir.estimatedDurationMins,
          stopsCount: stops.length
        });
      })
      .catch((err) => {
        console.warn('Could not load detailed stop sequence:', err);
        if (!isMountedRef.current) return;
        setSelectedRoute({
          id: matchedRoute.id,
          routeNumber: matchedRoute.routeNumber,
          displayTitleEn: matchedRoute.displayTitleEn,
          displayTitleTa: matchedRoute.displayTitleTa,
          serviceCategory: matchedRoute.serviceCategory,
          activeDirectionId: activeDir.id,
          directionCode: activeDir.directionCode,
          originNameEn: 'Mattuthavani Terminal',
          originNameTa: 'மாட்டுத்தாவணி முனையம்',
          destinationNameEn: 'Periyar Bus Stand',
          destinationNameTa: 'பெரியார் பேருந்து நிலையம்',
          totalDistanceKm: activeDir.totalDistanceKm,
          estimatedDurationMins: activeDir.estimatedDurationMins,
          stopsCount: 7
        });
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsLoadingRouteDetail(false);
        }
      });
  }, [districtRoutes, searchParams]);

  // Request user GPS geolocation on-demand
  const handleRequestLocation = useCallback(async () => {
    setNearbyStands((prev) => ({
      ...prev,
      isLoading: true,
      permissionRequested: true,
      errorMessage: null
    }));

    try {
      const geo = await requestUserGeolocation();
      const coords = { lat: geo.coordinates.lat, lng: geo.coordinates.lng };

      const stands = await dashboardService.getNearbyBusStands(coords.lat, coords.lng);

      if (isMountedRef.current) {
        setNearbyStands({
          isLoading: false,
          permissionRequested: true,
          permissionDenied: false,
          errorMessage: null,
          stands,
          userCoordinates: coords
        });
      }
    } catch (err: unknown) {
      console.warn('Geolocation query failed, loading district stands fallback:', err);
      // Fallback: load district bus stands
      let fallbackStands: BusStandDto[] = [];
      if (districtBackendId) {
        fallbackStands = await dashboardService
          .getDistrictBusStands(districtBackendId)
          .catch(() => []);
      }

      if (isMountedRef.current) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Unable to acquire location coordinates';
        const isDenied =
          errorMsg.toLowerCase().includes('denied') ||
          errorMsg.toLowerCase().includes('permission');

        setNearbyStands({
          isLoading: false,
          permissionRequested: true,
          permissionDenied: isDenied,
          errorMessage: errorMsg,
          stands: fallbackStands,
          userCoordinates: null
        });
      }
    }
  }, [districtBackendId]);

  // Direct browse of district bus stands without requesting GPS
  const handleBrowseDistrictStands = useCallback(async () => {
    if (!districtBackendId) return;

    setNearbyStands((prev) => ({ ...prev, isLoading: true }));
    try {
      const stands = await dashboardService.getDistrictBusStands(districtBackendId);
      if (isMountedRef.current) {
        setNearbyStands({
          isLoading: false,
          permissionRequested: false,
          permissionDenied: false,
          errorMessage: null,
          stands,
          userCoordinates: null
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        setNearbyStands((prev) => ({
          ...prev,
          isLoading: false,
          errorMessage: 'Failed to load district bus stands'
        }));
      }
    }
  }, [districtBackendId]);

  // Timetable modal controls
  const handleOpenTimetable = useCallback(
    async (targetRouteId?: string, targetRouteNumber?: string) => {
      const routeIdToUse = targetRouteId || selectedRoute?.id;
      const routeNum = targetRouteNumber || selectedRoute?.routeNumber || '70';

      if (!routeIdToUse) {
        return;
      }

      setTimetableModal({
        isOpen: true,
        isLoading: true,
        routeNumber: routeNum,
        data: null,
        error: null
      });

      try {
        const timetable = await dashboardService.getRouteTimetable(routeIdToUse);
        if (isMountedRef.current) {
          setTimetableModal((prev) => ({
            ...prev,
            isLoading: false,
            data: timetable
          }));
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          setTimetableModal((prev) => ({
            ...prev,
            isLoading: false,
            error:
              err instanceof Error
                ? err.message
                : 'Could not load timetable for route'
          }));
        }
      }
    },
    [selectedRoute]
  );

  const handleCloseTimetable = useCallback(() => {
    setTimetableModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Select a route programmatically
  const selectRoute = useCallback((routeId: string) => {
    safeSetItem(STORAGE_KEYS.SELECTED_ROUTE, routeId);
  }, []);

  return {
    district,
    districtRoutes,
    isLoadingRoutes,
    selectedRoute,
    isLoadingRouteDetail,
    locationOptions,
    liveOverview,
    nearbyStands,
    timetableModal,
    handleRequestLocation,
    handleBrowseDistrictStands,
    handleOpenTimetable,
    handleCloseTimetable,
    refreshLiveOverview,
    selectRoute
  };
}
