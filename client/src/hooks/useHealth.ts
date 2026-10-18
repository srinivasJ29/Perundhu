import { useQuery } from '@tanstack/react-query';
import { healthService } from '../services/api/health.service';

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => healthService.getHealth(),
    staleTime: 30000,
    retry: 1
  });
}

export function useSystemReadiness() {
  return useQuery({
    queryKey: ['system', 'readiness'],
    queryFn: () => healthService.getReadiness(),
    staleTime: 30000,
    retry: 1
  });
}
