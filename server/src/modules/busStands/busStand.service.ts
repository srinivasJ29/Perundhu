import { Types, PipelineStage } from 'mongoose';
import { BusStand, Stop, RouteDirection, RouteStopSequence, RouteDocument } from '../../models';
import { NotFoundError, ConflictError } from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';
import { NearbyBusStandsQuery, ListBusStandsQuery, CreateBusStandBody, UpdateBusStandBody } from './busStand.validation';

export interface NearbyBusStandDto {
  id: string;
  districtId: string;
  code: string;
  nameEn: string;
  nameTa: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  standType: string;
  totalPlatforms: number;
  distanceMeters: number;
}

export interface StandRouteDirectionDto {
  id: string;
  directionCode: 'OUTBOUND' | 'INBOUND';
  totalDistanceKm: number;
  estimatedDurationMins: number;
  originStopId: string;
  destinationStopId: string;
  stopSequenceAtStand?: number;
}

export interface StandRouteDto {
  id: string;
  routeNumber: string;
  displayTitleEn: string;
  displayTitleTa: string;
  serviceCategory: string;
  directions: StandRouteDirectionDto[];
}

export class BusStandService {
  /**
   * Finds active bus stands within a geographic radius using MongoDB $geoNear.
   */
  public async getNearbyBusStands(
    query: NearbyBusStandsQuery
  ): Promise<PaginatedResult<NearbyBusStandDto>> {
    const { lat, lng, radiusMeters, page, limit } = query;

    const pipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat] as [number, number]
          },
          distanceField: 'distanceMeters',
          maxDistance: radiusMeters,
          spherical: true,
          query: { isActive: true }
        }
      },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                districtId: 1,
                code: 1,
                nameEn: 1,
                nameTa: 1,
                location: 1,
                standType: 1,
                totalPlatforms: 1,
                distanceMeters: { $round: ['$distanceMeters', 1] }
              }
            }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const results = await BusStand.aggregate(pipeline);
    const facetResult = results[0] || { data: [], totalCount: [] };
    const total = facetResult.totalCount.length > 0 ? facetResult.totalCount[0].count : 0;

    const data: NearbyBusStandDto[] = facetResult.data.map((item: any) => ({
      id: item._id.toString(),
      districtId: item.districtId.toString(),
      code: item.code,
      nameEn: item.nameEn,
      nameTa: item.nameTa,
      location: item.location,
      standType: item.standType,
      totalPlatforms: item.totalPlatforms,
      distanceMeters: item.distanceMeters
    }));

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Finds active routes and their directions serving a specific bus stand.
   */
  public async getRoutesByBusStand(
    standId: string,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<StandRouteDto>> {
    const { page, limit } = pagination;
    const standObjectId = new Types.ObjectId(standId);

    // 1. Confirm bus stand exists and is active
    const stand = await BusStand.findOne({ _id: standObjectId, isActive: true })
      .select('_id code nameEn')
      .lean();

    if (!stand) {
      throw new NotFoundError(`Bus stand with ID '${standId}' not found or inactive`);
    }

    // 2. Find all active stops associated with this bus stand
    const stopsAtStand = await Stop.find({ busStandId: standObjectId, isActive: true })
      .select('_id')
      .lean();
    const stopIds = stopsAtStand.map((s) => s._id);

    // 3. Find route stop sequence records referencing these stops
    const sequenceRecords =
      stopIds.length > 0
        ? await RouteStopSequence.find({ stopId: { $in: stopIds }, isActive: true })
            .select('directionId stopId sequenceOrder')
            .lean()
        : [];

    const directionIdsFromSequences = sequenceRecords.map((s) => s.directionId);
    const sequenceMap = new Map<string, number>();
    for (const seq of sequenceRecords) {
      sequenceMap.set(seq.directionId.toString(), seq.sequenceOrder);
    }

    // 4. Find all active directions serving this bus stand
    const directionOrConditions: any[] = [
      { originStandId: standObjectId },
      { destinationStandId: standObjectId }
    ];

    if (directionIdsFromSequences.length > 0) {
      directionOrConditions.push({ _id: { $in: directionIdsFromSequences } });
    }

    const matchingDirections = await RouteDirection.find({
      isActive: true,
      $or: directionOrConditions
    })
      .populate<{ routeId: RouteDocument }>({
        path: 'routeId',
        match: { isActive: true },
        select: '_id routeNumber displayTitleEn displayTitleTa serviceCategory isActive'
      })
      .select('_id routeId directionCode totalDistanceKm estimatedDurationMins originStopId destinationStopId')
      .lean();

    // 5. Group and deduplicate directions by Route
    const routesMap = new Map<string, StandRouteDto>();

    for (const dir of matchingDirections) {
      if (!dir.routeId || !dir.routeId.isActive) continue;

      const route = dir.routeId;
      const routeIdStr = route._id.toString();

      if (!routesMap.has(routeIdStr)) {
        routesMap.set(routeIdStr, {
          id: routeIdStr,
          routeNumber: route.routeNumber,
          displayTitleEn: route.displayTitleEn,
          displayTitleTa: route.displayTitleTa,
          serviceCategory: route.serviceCategory,
          directions: []
        });
      }

      const routeDto = routesMap.get(routeIdStr)!;
      const dirDto: StandRouteDirectionDto = {
        id: dir._id.toString(),
        directionCode: dir.directionCode,
        totalDistanceKm: dir.totalDistanceKm,
        estimatedDurationMins: dir.estimatedDurationMins,
        originStopId: dir.originStopId.toString(),
        destinationStopId: dir.destinationStopId.toString(),
        stopSequenceAtStand: sequenceMap.get(dir._id.toString())
      };

      // Avoid duplicate directions within the same route
      if (!routeDto.directions.some((d) => d.id === dirDto.id)) {
        routeDto.directions.push(dirDto);
      }
    }

    // 6. Sort routes deterministically by routeNumber
    const allRoutes = Array.from(routesMap.values()).sort((a, b) =>
      a.routeNumber.localeCompare(b.routeNumber, undefined, { numeric: true, sensitivity: 'base' })
    );

    const total = allRoutes.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = allRoutes.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Lists bus stands with pagination, search, and district/type filtering.
   */
  public async listBusStands(query: ListBusStandsQuery): Promise<PaginatedResult<any>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.districtId) filter.districtId = new Types.ObjectId(query.districtId);
    if (query.standType) filter.standType = query.standType;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.q) {
      filter.$or = [
        { nameEn: { $regex: query.q, $options: 'i' } },
        { nameTa: { $regex: query.q, $options: 'i' } },
        { code: { $regex: query.q, $options: 'i' } }
      ];
    }

    const [total, data] = await Promise.all([
      BusStand.countDocuments(filter),
      BusStand.find(filter)
        .populate('districtId', 'nameEn nameTa code')
        .sort({ nameEn: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Retrieves single bus stand with full details.
   */
  public async getBusStandById(standId: string) {
    const stand = await BusStand.findById(standId)
      .populate('districtId', 'nameEn nameTa code')
      .populate('depotIds', 'nameEn nameTa code')
      .lean();

    if (!stand) {
      throw new NotFoundError(`Bus stand with ID '${standId}' not found`);
    }

    return stand;
  }

  /**
   * Creates a new bus stand (Admin operation).
   */
  public async createBusStand(data: CreateBusStandBody) {
    const existing = await BusStand.findOne({ code: data.code }).lean();
    if (existing) {
      throw new ConflictError(`Bus stand with code '${data.code}' already exists`);
    }

    const stand = await BusStand.create(data);
    return stand.toObject();
  }

  /**
   * Updates an existing bus stand (Admin operation).
   */
  public async updateBusStand(standId: string, data: UpdateBusStandBody) {
    const stand = await BusStand.findById(standId);
    if (!stand) {
      throw new NotFoundError(`Bus stand with ID '${standId}' not found`);
    }

    if (data.code && data.code !== stand.code) {
      const existing = await BusStand.findOne({ code: data.code }).lean();
      if (existing) {
        throw new ConflictError(`Bus stand with code '${data.code}' already exists`);
      }
    }

    Object.assign(stand, data);
    await stand.save();
    return stand.toObject();
  }
}

export const busStandService = new BusStandService();
