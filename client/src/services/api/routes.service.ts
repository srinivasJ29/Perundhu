import { httpClient } from './client';
import { RouteDirectionDetailDto } from '../../types/domain';

export const routesService = {
  async getRouteDirectionDetails(
    routeId: string,
    directionId: string
  ): Promise<RouteDirectionDetailDto> {
    return httpClient.get<RouteDirectionDetailDto>(
      `/routes/${routeId}/directions/${directionId}`
    );
  }
};
