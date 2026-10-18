/**
 * PERUNDHU (பேருந்து) — Hook to load route direction details and stop sequence
 */

import { useState, useEffect } from 'react';
import { routeService } from '../services/routeService';
import { RouteDirectionDetailDto } from '../../../types/domain';

export function useRouteDirection(routeId?: string, directionId?: string) {
  const [data, setData] = useState<RouteDirectionDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeId || !directionId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    routeService
      .getRouteDirectionDetails(routeId, directionId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Failed to load stop sequence from backend';
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [routeId, directionId]);

  return { data, isLoading, error };
}
