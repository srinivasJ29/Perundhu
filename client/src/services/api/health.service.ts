import { httpClient } from './client';
import { SystemHealthDto, SystemReadinessDto } from '../../types/domain';

export const healthService = {
  async getHealth(): Promise<SystemHealthDto> {
    return httpClient.get<SystemHealthDto>('/health', { skipAuth: true });
  },

  async getReadiness(): Promise<SystemReadinessDto> {
    return httpClient.get<SystemReadinessDto>('/ready', { skipAuth: true });
  }
};
