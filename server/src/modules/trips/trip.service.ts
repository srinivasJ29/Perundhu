import { FilterQuery, Types } from 'mongoose';
import {
  ScheduledTrip,
  ScheduledTripDocument,
  TripOperationalStatus,
  TripStopTime,
  RouteDirection,
  RouteDirectionDocument,
  RouteDocument,
  RouteStopSequence,
  Bus,
  BusDocument,
  StopDocument
} from '../../models';
import {
  NotFoundError,
  ValidationError,
  ConflictError
} from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';
import { getIstDayOfWeek } from '../../common/utils/timezone';
import {
  ListTripsQuery,
  ActiveTripsQuery,
  CreateTripBody,
  UpdateTripStopTimesBody
} from './trip.validation';

export interface ScheduledTripDto {
  id: string;
  tripCode: string;
  routeDirectionId: string;
  busId?: string;
  route?: {
    id: string;
    routeNumber: string;
    displayTitleEn: string;
    displayTitleTa: string;
    serviceCategory: string;
  };
  direction?: {
    id: string;
    directionCode: 'OUTBOUND' | 'INBOUND';
    originStopId: string;
    destinationStopId: string;
    totalDistanceKm: number;
    estimatedDurationMins: number;
  };
  bus?: {
    id: string;
    registrationNumber: string;
    fleetNumber: string;
    depotName: string;
    vehicleType: string;
    status: string;
  } | null;
  departureTime: string;
  arrivalTime: string;
  operationalDays: string[];
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripStopTimeDto {
  id: string;
  stopSequence: number;
  scheduledArrivalTime: string;
  scheduledDepartureTime: string;
  stop: {
    id: string;
    code: string;
    nameEn: string;
    nameTa: string;
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    landmark?: string;
  };
}

export interface TripDetailDto extends ScheduledTripDto {
  stopTimes: TripStopTimeDto[];
}

export class TripService {
  /**
   * Retrieves paginated scheduled trips with filters for route, direction, bus, date, day, and status.
   */
  public async getTrips(query: ListTripsQuery): Promise<PaginatedResult<ScheduledTripDto>> {
    const {
      page,
      limit,
      routeId,
      routeDirectionId,
      busId,
      date,
      dayOfWeek,
      status,
      isActive
    } = query;

    const filter: FilterQuery<ScheduledTripDocument> = {};

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    } else {
      filter.isActive = true;
    }

    if (status) {
      filter.status = status;
    }

    if (busId) {
      filter.busId = new Types.ObjectId(busId);
    }

    // Direction or Route filtering
    if (routeDirectionId) {
      filter.routeDirectionId = new Types.ObjectId(routeDirectionId);
    } else if (routeId) {
      const directions = await RouteDirection.find({
        routeId: new Types.ObjectId(routeId),
        isActive: true
      })
        .select('_id')
        .lean();
      const directionIds = directions.map((d) => d._id);
      filter.routeDirectionId = { $in: directionIds };
    }

    // Date or DayOfWeek filtering
    let targetDay = dayOfWeek;
    if (!targetDay && date) {
      targetDay = getIstDayOfWeek(date);
    }

    if (targetDay) {
      filter.operationalDays = targetDay;
    }

    const [total, docs] = await Promise.all([
      ScheduledTrip.countDocuments(filter),
      ScheduledTrip.find(filter)
        .sort({ departureTime: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate<{
          routeDirectionId: (RouteDirectionDocument & { routeId: RouteDocument }) | null;
        }>({
          path: 'routeDirectionId',
          select: '_id routeId directionCode originStopId destinationStopId totalDistanceKm estimatedDurationMins',
          populate: {
            path: 'routeId',
            select: '_id routeNumber displayTitleEn displayTitleTa serviceCategory'
          }
        })
        .populate<{ busId: BusDocument | null }>({
          path: 'busId',
          select: '_id registrationNumber fleetNumber depotName vehicleType status'
        })
        .lean()
    ]);

    const data: ScheduledTripDto[] = docs.map((doc) => {
      const dir = doc.routeDirectionId;
      const route = dir && typeof dir === 'object' && dir.routeId && typeof dir.routeId === 'object'
        ? {
            id: dir.routeId._id.toString(),
            routeNumber: dir.routeId.routeNumber,
            displayTitleEn: dir.routeId.displayTitleEn,
            displayTitleTa: dir.routeId.displayTitleTa,
            serviceCategory: dir.routeId.serviceCategory
          }
        : undefined;

      const direction = dir && typeof dir === 'object'
        ? {
            id: dir._id.toString(),
            directionCode: dir.directionCode,
            originStopId: dir.originStopId.toString(),
            destinationStopId: dir.destinationStopId.toString(),
            totalDistanceKm: dir.totalDistanceKm,
            estimatedDurationMins: dir.estimatedDurationMins
          }
        : undefined;

      const bus = doc.busId && typeof doc.busId === 'object'
        ? {
            id: (doc.busId as BusDocument)._id.toString(),
            registrationNumber: (doc.busId as BusDocument).registrationNumber,
            fleetNumber: (doc.busId as BusDocument).fleetNumber,
            depotName: (doc.busId as BusDocument).depotName,
            vehicleType: (doc.busId as BusDocument).vehicleType,
            status: (doc.busId as BusDocument).status
          }
        : null;

      return {
        id: doc._id.toString(),
        tripCode: doc.tripCode,
        routeDirectionId:
          dir && typeof dir === 'object' && '_id' in dir
            ? (dir._id as Types.ObjectId).toString()
            : String(doc.routeDirectionId || ''),
        route,
        direction,
        bus,
        departureTime: doc.departureTime,
        arrivalTime: doc.arrivalTime,
        operationalDays: doc.operationalDays,
        status: doc.status || 'SCHEDULED',
        isActive: doc.isActive,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
      };
    });

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Retrieves single trip with complete metadata and ordered stop itinerary times.
   */
  public async getTripById(tripId: string): Promise<TripDetailDto> {
    const tripObjectId = new Types.ObjectId(tripId);

    const trip = await ScheduledTrip.findById(tripObjectId)
      .populate<{
        routeDirectionId: (RouteDirectionDocument & { routeId: RouteDocument }) | null;
      }>({
        path: 'routeDirectionId',
        select: '_id routeId directionCode originStopId destinationStopId totalDistanceKm estimatedDurationMins',
        populate: {
          path: 'routeId',
          select: '_id routeNumber displayTitleEn displayTitleTa serviceCategory'
        }
      })
      .populate<{ busId: BusDocument | null }>({
        path: 'busId',
        select: '_id registrationNumber fleetNumber depotName vehicleType status'
      })
      .lean();

    if (!trip) {
      throw new NotFoundError(`Scheduled trip with ID '${tripId}' not found`);
    }

    // Retrieve ordered stop times
    const stopTimeDocs = await TripStopTime.find({ tripId: tripObjectId })
      .sort({ stopSequence: 1 })
      .populate<{ stopId: StopDocument }>({
        path: 'stopId',
        select: '_id code nameEn nameTa location landmark'
      })
      .lean();

    const stopTimes: TripStopTimeDto[] = stopTimeDocs
      .filter((st) => st.stopId && typeof st.stopId === 'object')
      .map((st) => ({
        id: st._id.toString(),
        stopSequence: st.stopSequence,
        scheduledArrivalTime: st.scheduledArrivalTime,
        scheduledDepartureTime: st.scheduledDepartureTime,
        stop: {
          id: st.stopId._id.toString(),
          code: st.stopId.code,
          nameEn: st.stopId.nameEn,
          nameTa: st.stopId.nameTa,
          location: st.stopId.location,
          landmark: st.stopId.landmark
        }
      }));

    const dir = trip.routeDirectionId;
    const route = dir && typeof dir === 'object' && dir.routeId && typeof dir.routeId === 'object'
      ? {
          id: dir.routeId._id.toString(),
          routeNumber: dir.routeId.routeNumber,
          displayTitleEn: dir.routeId.displayTitleEn,
          displayTitleTa: dir.routeId.displayTitleTa,
          serviceCategory: dir.routeId.serviceCategory
        }
      : undefined;

    const direction = dir && typeof dir === 'object'
      ? {
          id: dir._id.toString(),
          directionCode: dir.directionCode,
          originStopId: dir.originStopId.toString(),
          destinationStopId: dir.destinationStopId.toString(),
          totalDistanceKm: dir.totalDistanceKm,
          estimatedDurationMins: dir.estimatedDurationMins
        }
      : undefined;

    const bus = trip.busId && typeof trip.busId === 'object'
      ? {
          id: (trip.busId as BusDocument)._id.toString(),
          registrationNumber: (trip.busId as BusDocument).registrationNumber,
          fleetNumber: (trip.busId as BusDocument).fleetNumber,
          depotName: (trip.busId as BusDocument).depotName,
          vehicleType: (trip.busId as BusDocument).vehicleType,
          status: (trip.busId as BusDocument).status
        }
      : null;

    return {
      id: trip._id.toString(),
      tripCode: trip.tripCode,
      routeDirectionId:
        dir && typeof dir === 'object' && '_id' in dir
          ? (dir._id as Types.ObjectId).toString()
          : String(trip.routeDirectionId || ''),
      route,
      direction,
      bus,
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      operationalDays: trip.operationalDays,
      status: trip.status || 'SCHEDULED',
      isActive: trip.isActive,
      createdAt: trip.createdAt.toISOString(),
      updatedAt: trip.updatedAt.toISOString(),
      stopTimes
    };
  }

  /**
   * Returns trips whose persisted status indicates that they are currently active (e.g. IN_TRANSIT).
   * Note: strictly relies on persisted operational state; does not extrapolate live GPS movement.
   */
  public async getActiveTrips(
    query: ActiveTripsQuery
  ): Promise<PaginatedResult<ScheduledTripDto>> {
    const { page, limit } = query;

    // Persisted active trips are trips marked IN_TRANSIT, or trips assigned to in-service buses
    const inServiceBusTripIds = await Bus.find({
      status: 'IN_SERVICE',
      currentAssignedTripId: { $ne: null }
    }).distinct('currentAssignedTripId');

    const filter: FilterQuery<ScheduledTripDocument> = {
      isActive: true,
      $or: [
        { status: 'IN_TRANSIT' },
        { _id: { $in: inServiceBusTripIds } }
      ]
    };

    const [total, docs] = await Promise.all([
      ScheduledTrip.countDocuments(filter),
      ScheduledTrip.find(filter)
        .sort({ departureTime: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate<{
          routeDirectionId: (RouteDirectionDocument & { routeId: RouteDocument }) | null;
        }>({
          path: 'routeDirectionId',
          select: '_id routeId directionCode originStopId destinationStopId totalDistanceKm estimatedDurationMins',
          populate: {
            path: 'routeId',
            select: '_id routeNumber displayTitleEn displayTitleTa serviceCategory'
          }
        })
        .populate<{ busId: BusDocument | null }>({
          path: 'busId',
          select: '_id registrationNumber fleetNumber depotName vehicleType status'
        })
        .lean()
    ]);

    const data: ScheduledTripDto[] = docs.map((doc) => {
      const dir = doc.routeDirectionId;
      const route = dir && typeof dir === 'object' && dir.routeId && typeof dir.routeId === 'object'
        ? {
            id: dir.routeId._id.toString(),
            routeNumber: dir.routeId.routeNumber,
            displayTitleEn: dir.routeId.displayTitleEn,
            displayTitleTa: dir.routeId.displayTitleTa,
            serviceCategory: dir.routeId.serviceCategory
          }
        : undefined;

      const direction = dir && typeof dir === 'object'
        ? {
            id: dir._id.toString(),
            directionCode: dir.directionCode,
            originStopId: dir.originStopId.toString(),
            destinationStopId: dir.destinationStopId.toString(),
            totalDistanceKm: dir.totalDistanceKm,
            estimatedDurationMins: dir.estimatedDurationMins
          }
        : undefined;

      const bus = doc.busId && typeof doc.busId === 'object'
        ? {
            id: (doc.busId as BusDocument)._id.toString(),
            registrationNumber: (doc.busId as BusDocument).registrationNumber,
            fleetNumber: (doc.busId as BusDocument).fleetNumber,
            depotName: (doc.busId as BusDocument).depotName,
            vehicleType: (doc.busId as BusDocument).vehicleType,
            status: (doc.busId as BusDocument).status
          }
        : null;

      return {
        id: doc._id.toString(),
        tripCode: doc.tripCode,
        routeDirectionId:
          dir && typeof dir === 'object' && '_id' in dir
            ? (dir._id as Types.ObjectId).toString()
            : String(doc.routeDirectionId || ''),
        route,
        direction,
        bus,
        departureTime: doc.departureTime,
        arrivalTime: doc.arrivalTime,
        operationalDays: doc.operationalDays,
        status: doc.status || 'SCHEDULED',
        isActive: doc.isActive,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
      };
    });

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Admin: Creates a new scheduled trip with optional validated stop times.
   */
  public async createTrip(data: CreateTripBody): Promise<ScheduledTripDto> {
    const directionObjectId = new Types.ObjectId(data.routeDirectionId);

    // 1. Check tripCode uniqueness
    const codeExists = await ScheduledTrip.exists({ tripCode: data.tripCode });
    if (codeExists) {
      throw new ConflictError(`Scheduled trip with code '${data.tripCode}' already exists`);
    }

    // 2. Verify route direction exists and is active
    const direction = await RouteDirection.findOne({
      _id: directionObjectId,
      isActive: true
    }).lean();

    if (!direction) {
      throw new NotFoundError(
        `Route direction with ID '${data.routeDirectionId}' not found or inactive`
      );
    }

    // 3. If busId provided, verify bus state and availability
    let busObjectId: Types.ObjectId | undefined;
    if (data.busId) {
      busObjectId = new Types.ObjectId(data.busId);
      const bus = await Bus.findById(busObjectId).lean();
      if (!bus || !bus.isActive) {
        throw new NotFoundError(`Bus with ID '${data.busId}' not found or inactive`);
      }
      if (bus.status === 'MAINTENANCE' || bus.status === 'OFFLINE') {
        throw new ValidationError(
          `Bus '${bus.registrationNumber}' is currently ${bus.status} and cannot be assigned to trips`
        );
      }
      if (data.status === 'IN_TRANSIT' && bus.currentAssignedTripId) {
        throw new ConflictError(
          `Bus '${bus.registrationNumber}' is already actively assigned to another trip`
        );
      }
    }

    // 4. Validate stopTimes against RouteStopSequence if provided
    if (data.stopTimes && data.stopTimes.length > 0) {
      await this.validateStopTimes(directionObjectId, data.stopTimes);
    }

    // 5. Create the ScheduledTrip
    const newTrip = await ScheduledTrip.create({
      tripCode: data.tripCode,
      routeDirectionId: directionObjectId,
      busId: busObjectId,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
      operationalDays: data.operationalDays,
      status: data.status,
      isActive: true
    });

    // 6. Insert stop times if provided
    if (data.stopTimes && data.stopTimes.length > 0) {
      const stopTimeDocs = data.stopTimes.map((st) => ({
        tripId: newTrip._id,
        stopId: new Types.ObjectId(st.stopId),
        stopSequence: st.stopSequence,
        scheduledArrivalTime: st.scheduledArrivalTime,
        scheduledDepartureTime: st.scheduledDepartureTime
      }));
      await TripStopTime.insertMany(stopTimeDocs);
    }

    // 7. Update bus assignment if trip is active
    if (busObjectId && data.status === 'IN_TRANSIT') {
      await Bus.findByIdAndUpdate(busObjectId, { currentAssignedTripId: newTrip._id });
    }

    return {
      id: newTrip._id.toString(),
      tripCode: newTrip.tripCode,
      routeDirectionId: newTrip.routeDirectionId.toString(),
      busId: busObjectId ? busObjectId.toString() : undefined,
      departureTime: newTrip.departureTime,
      arrivalTime: newTrip.arrivalTime,
      operationalDays: newTrip.operationalDays,
      status: newTrip.status,
      isActive: newTrip.isActive,
      createdAt: newTrip.createdAt.toISOString(),
      updatedAt: newTrip.updatedAt.toISOString()
    };
  }

  /**
   * Admin: Assigns or unassigns a bus to a scheduled trip.
   */
  public async assignBus(tripId: string, busId: string | null): Promise<ScheduledTripDto> {
    const tripObjectId = new Types.ObjectId(tripId);
    const trip = await ScheduledTrip.findById(tripObjectId);

    if (!trip) {
      throw new NotFoundError(`Scheduled trip with ID '${tripId}' not found`);
    }

    // Unassign bus
    if (busId === null) {
      if (trip.busId) {
        // Clear assignment from the previous bus if it pointed to this trip
        await Bus.updateOne(
          { _id: trip.busId, currentAssignedTripId: trip._id },
          { $unset: { currentAssignedTripId: 1 } }
        );
      }
      trip.busId = undefined;
      await trip.save();

      return this.getTripById(tripId);
    }

    // Assign new bus
    const busObjectId = new Types.ObjectId(busId);
    const bus = await Bus.findById(busObjectId);

    if (!bus || !bus.isActive) {
      throw new NotFoundError(`Bus with ID '${busId}' not found or inactive`);
    }

    if (bus.status === 'MAINTENANCE' || bus.status === 'OFFLINE') {
      throw new ValidationError(
        `Bus '${bus.registrationNumber}' is currently ${bus.status} and cannot be assigned`
      );
    }

    // Conflict check: if bus is actively assigned to another trip that is IN_TRANSIT
    if (bus.currentAssignedTripId && bus.currentAssignedTripId.toString() !== tripId) {
      throw new ConflictError(
        `Bus '${bus.registrationNumber}' is already actively assigned to another trip`
      );
    }

    // Clear previous bus if different
    if (trip.busId && trip.busId.toString() !== busId) {
      await Bus.updateOne(
        { _id: trip.busId, currentAssignedTripId: trip._id },
        { $unset: { currentAssignedTripId: 1 } }
      );
    }

    trip.busId = busObjectId;
    await trip.save();

    // If trip is IN_TRANSIT, link on bus
    if (trip.status === 'IN_TRANSIT') {
      bus.currentAssignedTripId = trip._id;
      await bus.save();
    }

    return this.getTripById(tripId);
  }

  /**
   * Admin: Updates trip operational status.
   */
  public async updateTripStatus(
    tripId: string,
    status: TripOperationalStatus
  ): Promise<ScheduledTripDto> {
    const tripObjectId = new Types.ObjectId(tripId);
    const trip = await ScheduledTrip.findById(tripObjectId);

    if (!trip) {
      throw new NotFoundError(`Scheduled trip with ID '${tripId}' not found`);
    }

    trip.status = status;
    await trip.save();

    if (trip.busId) {
      if (status === 'IN_TRANSIT') {
        await Bus.findByIdAndUpdate(trip.busId, { currentAssignedTripId: trip._id });
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        await Bus.updateOne(
          { _id: trip.busId, currentAssignedTripId: trip._id },
          { $unset: { currentAssignedTripId: 1 } }
        );
      }
    }

    return this.getTripById(tripId);
  }

  /**
   * Admin: Replaces/updates scheduled stop times along the trip itinerary.
   */
  public async updateTripStopTimes(
    tripId: string,
    body: UpdateTripStopTimesBody
  ): Promise<TripStopTimeDto[]> {
    const tripObjectId = new Types.ObjectId(tripId);
    const trip = await ScheduledTrip.findById(tripObjectId);

    if (!trip) {
      throw new NotFoundError(`Scheduled trip with ID '${tripId}' not found`);
    }

    // Validate that each stop belongs to the route direction sequence
    await this.validateStopTimes(trip.routeDirectionId, body.stopTimes);

    // Atomically replace stop times
    await TripStopTime.deleteMany({ tripId: tripObjectId });

    const stopTimeDocs = body.stopTimes.map((st) => ({
      tripId: tripObjectId,
      stopId: new Types.ObjectId(st.stopId),
      stopSequence: st.stopSequence,
      scheduledArrivalTime: st.scheduledArrivalTime,
      scheduledDepartureTime: st.scheduledDepartureTime
    }));

    await TripStopTime.insertMany(stopTimeDocs);

    const updated = await TripStopTime.find({ tripId: tripObjectId })
      .sort({ stopSequence: 1 })
      .populate<{ stopId: StopDocument }>({
        path: 'stopId',
        select: '_id code nameEn nameTa location landmark'
      })
      .lean();

    return updated.map((st) => ({
      id: st._id.toString(),
      stopSequence: st.stopSequence,
      scheduledArrivalTime: st.scheduledArrivalTime,
      scheduledDepartureTime: st.scheduledDepartureTime,
      stop: {
        id: st.stopId._id.toString(),
        code: st.stopId.code,
        nameEn: st.stopId.nameEn,
        nameTa: st.stopId.nameTa,
        location: st.stopId.location,
        landmark: st.stopId.landmark
      }
    }));
  }

  /**
   * Helper: Validates stop sequences, direction membership, and chronological time ordering.
   */
  private async validateStopTimes(
    directionId: Types.ObjectId,
    stopTimes: Array<{
      stopId: string;
      stopSequence: number;
      scheduledArrivalTime: string;
      scheduledDepartureTime: string;
    }>
  ): Promise<void> {
    // 1. Fetch valid stop IDs from direction sequence
    const sequences = await RouteStopSequence.find({
      directionId,
      isActive: true
    })
      .select('stopId sequenceOrder')
      .lean();

    if (sequences.length === 0) {
      throw new ValidationError(
        `Route direction '${directionId}' does not have an active stop sequence defined`
      );
    }

    const validStopIds = new Set(sequences.map((s) => s.stopId.toString()));

    // 2. Validate all stops exist in direction
    for (const st of stopTimes) {
      if (!validStopIds.has(st.stopId)) {
        throw new ValidationError(
          `Stop with ID '${st.stopId}' does not belong to the route direction's stop sequence`
        );
      }
    }

    // 3. Validate sequences are unique
    const seqSet = new Set<number>();
    for (const st of stopTimes) {
      if (seqSet.has(st.stopSequence)) {
        throw new ValidationError(
          `Duplicate stop sequence order ${st.stopSequence} in stop times list`
        );
      }
      seqSet.add(st.stopSequence);
    }

    // 4. Sort copies by sequenceOrder to verify chronological time ordering
    const sorted = [...stopTimes].sort((a, b) => a.stopSequence - b.stopSequence);

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      // Arrival at stop must be <= departure from same stop
      if (current.scheduledArrivalTime > current.scheduledDepartureTime) {
        throw new ValidationError(
          `At sequence ${current.stopSequence}, scheduled arrival (${current.scheduledArrivalTime}) cannot be after departure (${current.scheduledDepartureTime})`
        );
      }

      // If next stop, next arrival must be >= current departure (unless overnight rolling trip)
      if (i > 0) {
        const prev = sorted[i - 1];
        if (current.scheduledArrivalTime < prev.scheduledDepartureTime) {
          throw new ValidationError(
            `Non-chronological stop times: sequence ${current.stopSequence} arrival (${current.scheduledArrivalTime}) precedes sequence ${prev.stopSequence} departure (${prev.scheduledDepartureTime})`
          );
        }
      }
    }
  }
}

export const tripService = new TripService();
