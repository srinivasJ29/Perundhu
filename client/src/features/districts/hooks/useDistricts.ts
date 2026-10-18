import { useState, useEffect, useCallback, useMemo } from 'react';
import { DistrictItem } from '../types';
import { TAMIL_NADU_DISTRICTS, ACTIVE_PILOT_DISTRICT_CODE } from '../data/tamilNaduDistricts';
import { districtsService } from '../../../services/api/districts.service';
import { safeGetItem, safeSetItem } from '../../../lib/storage';
import { STORAGE_KEYS } from '../../../config/constants';
import { logger } from '../../../lib/logger';

interface UseDistrictsResult {
  districts: DistrictItem[];
  isLoading: boolean;
  isBackendSynced: boolean;
  selectedDistrict: DistrictItem | null;
  selectDistrict: (district: DistrictItem) => boolean;
  clearSelectedDistrict: () => void;
  error: Error | null;
}

export function useDistricts(): UseDistrictsResult {
  const [districts, setDistricts] = useState<DistrictItem[]>(TAMIL_NADU_DISTRICTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendSynced, setIsBackendSynced] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize selected district from safeStorage
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem | null>(() => {
    const savedCode = safeGetItem<string | null>(STORAGE_KEYS.SELECTED_DISTRICT, null);
    if (savedCode) {
      const match = TAMIL_NADU_DISTRICTS.find(
        (d) => d.code === savedCode || d.id === savedCode
      );
      if (match && match.status === 'AVAILABLE') {
        return match;
      }
    }
    return null;
  });

  // Reconcile 38 catalogue districts with live backend records
  useEffect(() => {
    let isMounted = true;

    async function syncBackendDistricts() {
      setIsLoading(true);
      try {
        const response = await districtsService.getDistricts({ limit: 100 });

        if (!isMounted) return;

        if (response && Array.isArray(response.data)) {
          const backendMap = new Map(
            response.data.map((bd) => [bd.code.toUpperCase(), bd])
          );

          // Merge backend metadata into canonical 38-district list
          const reconciled = TAMIL_NADU_DISTRICTS.map((district) => {
            const backendMatch = backendMap.get(district.code.toUpperCase());

            if (backendMatch) {
              return {
                ...district,
                backendId: backendMatch.id,
                // If backend supports district, mark it available
                status: 'AVAILABLE' as const,
                isPilot: district.code === ACTIVE_PILOT_DISTRICT_CODE
              };
            }

            return district;
          });

          setDistricts(reconciled);
          setIsBackendSynced(true);

          // Update active selected district reference if needed
          setSelectedDistrict((prev) => {
            if (prev) {
              const updated = reconciled.find((d) => d.code === prev.code);
              return updated || prev;
            }
            return null;
          });
        }
      } catch (err) {
        logger.warn('Backend district sync fallback: utilizing canonical catalogue', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to sync districts'));
          // Keep default catalogue intact
          setDistricts(TAMIL_NADU_DISTRICTS);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    syncBackendDistricts();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectDistrict = useCallback((district: DistrictItem): boolean => {
    // Only available/supported districts can be selected
    if (district.status !== 'AVAILABLE') {
      return false;
    }

    setSelectedDistrict(district);
    safeSetItem(STORAGE_KEYS.SELECTED_DISTRICT, district.code);
    return true;
  }, []);

  const clearSelectedDistrict = useCallback(() => {
    setSelectedDistrict(null);
    safeSetItem(STORAGE_KEYS.SELECTED_DISTRICT, null);
  }, []);

  return useMemo(
    () => ({
      districts,
      isLoading,
      isBackendSynced,
      selectedDistrict,
      selectDistrict,
      clearSelectedDistrict,
      error
    }),
    [districts, isLoading, isBackendSynced, selectedDistrict, selectDistrict, clearSelectedDistrict, error]
  );
}
