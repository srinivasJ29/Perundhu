import { Types } from 'mongoose';
import { Route, RouteDirection, RouteStopSequence, StopDocument } from '../../models';
import { NotFoundError } from '../../common/errors';
import { GeoJsonLineString, GeoJsonPoint } from '../../models/geojson';

export interface RouteSummaryDto {
  id: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  serviceCategory: string;
}

export interface StopDetailDto {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  location: GeoJsonPoint;
  landmark?: string;
}

export interface DirectionStopSequenceDto {
  sequenceOrder: number;
  distanceFromOriginKm: number;
  cumulativeDurationMinutes: number;
  isFareStage: boolean;
  stop: StopDetailDto;
}

export interface RouteDirectionDetailDto {
  route: RouteSummaryDto;
  direction: {
    id: string;
    directionCode: 'OUTBOUND' | 'INBOUND';
    totalDistanceKm: number;
    estimatedDurationMins: number;
    originStopId: string;
    destinationStopId: string;
    routePolyline: GeoJsonLineString | null;
    stopsCount: number;
    stops: DirectionStopSequenceDto[];
  };
}

export class RouteService {
  /**
   * Retrieves full direction itinerary, ordered stop sequence, and geometry.
   */
  public async getRouteDirectionDetails(
    routeId: string,
    directionId: string
  ): Promise<RouteDirectionDetailDto> {
    const routeObjectId = new Types.ObjectId(routeId);
    const directionObjectId = new Types.ObjectId(directionId);

    // 1. Verify route exists and is active
    const route = await Route.findOne({ _id: routeObjectId, isActive: true })
      .select('_id routeNumber displayTitleEn displayTitleTa serviceCategory')
      .lean();

    if (!route) {
      throw new NotFoundError(`Route with ID '${routeId}' not found or inactive`);
    }

    // 2. Verify direction exists, is active, and belongs to this route
    const direction = await RouteDirection.findOne({
      _id: directionObjectId,
      routeId: routeObjectId,
      isActive: true
    })
      .select('_id directionCode totalDistanceKm estimatedDurationMins originStopId destinationStopId routePolyline')
      .lean();

    if (!direction) {
      throw new NotFoundError(
        `Route direction with ID '${directionId}' not found for Route '${route.routeNumber}'`
      );
    }

    // 3. Fetch ordered stop sequence for this direction
    const sequenceDocs = await RouteStopSequence.find({
      directionId: directionObjectId,
      isActive: true
    })
      .sort({ sequenceOrder: 1 })
      .populate<{ stopId: StopDocument }>({
        path: 'stopId',
        select: '_id code nameEn nameTa location landmark isActive'
      })
      .lean();

    // 4. Map and filter valid stops (preserving sequence order and repeated stop occurrences)
    const stops: DirectionStopSequenceDto[] = sequenceDocs
      .filter((item) => item.stopId && item.stopId.isActive !== false)
      .map((item) => ({
        sequenceOrder: item.sequenceOrder,
        distanceFromOriginKm: item.distanceFromOriginKm,
        cumulativeDurationMinutes: item.cumulativeDurationMinutes,
        isFareStage: item.isFareStage,
        stop: {
          id: item.stopId._id.toString(),
          code: item.stopId.code,
          nameEn: item.stopId.nameEn,
          nameTa: item.stopId.nameTa,
          location: item.stopId.location,
          landmark: item.stopId.landmark
        }
      }));

    // 5. Handle route geometry cleanly without fabricating fake coordinates
    const hasValidPolyline =
      direction.routePolyline &&
      direction.routePolyline.type === 'LineString' &&
      Array.isArray(direction.routePolyline.coordinates) &&
      direction.routePolyline.coordinates.length >= 2;

    const routePolyline: GeoJsonLineString | null = hasValidPolyline
      ? {
          type: 'LineString',
          coordinates: direction.routePolyline.coordinates
        }
      : null;

    return {
      route: {
        id: route._id.toString(),
        routeNumber: route.routeNumber,
        displayTitleEn: route.displayTitleEn,
        displayTitleTa: route.displayTitleTa,
        serviceCategory: route.serviceCategory
      },
      direction: {
        id: direction._id.toString(),
        directionCode: direction.directionCode,
        totalDistanceKm: direction.totalDistanceKm,
        estimatedDurationMins: direction.estimatedDurationMins,
        originStopId: direction.originStopId.toString(),
        destinationStopId: direction.destinationStopId.toString(),
        routePolyline,
        stopsCount: stops.length,
        stops
      }
    };
  }
}

export const routeService = new RouteService();
