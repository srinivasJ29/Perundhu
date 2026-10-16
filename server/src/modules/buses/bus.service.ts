import { FilterQuery, Types } from 'mongoose';
import { Bus, BusDocument, ScheduledTrip, ScheduledTripDocument } from '../../models';
import { NotFoundError, ConflictError } from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';
import { getIstDayOfWeek } from '../../common/utils/timezone';
import {
  ListBusesQuery,
  BusTripsQuery,
  CreateBusBody,
  UpdateBusStatusBody
} from './bus.validation';

export interface BusDto {
  id: string;
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  vehicleType: string;
  status: string;
  currentAssignedTripId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusDetailDto extends BusDto {
  currentAssignedTrip?: {
    id: string;
    tripCode: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
  } | null;
}

export interface ScheduledTripSummaryDto {
  id: string;
  tripCode: string;
  routeDirectionId: string;
  busId?: string;
  departureTime: string;
  arrivalTime: string;
  operationalDays: string[];
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class BusService {
  /**
   * Returns a paginated list of buses with allowlisted filters and stable sorting.
   */
  public async getBuses(query: ListBusesQuery): Promise<PaginatedResult<BusDto>> {
    const { page, limit, status, vehicleType, depotName, isActive, q } = query;
    const filter: FilterQuery<BusDocument> = {};

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    } else {
      filter.isActive = true;
    }

    if (status) {
      filter.status = status;
    }

    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    if (depotName) {
      filter.depotName = depotName;
    }

    if (q && q.trim().length > 0) {
      const sanitizedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitizedQ, 'i');
      filter.$or = [
        { registrationNumber: regex },
        { fleetNumber: regex },
        { depotName: regex }
      ];
    }

    const [total, docs] = await Promise.all([
      Bus.countDocuments(filter),
      Bus.find(filter)
        .sort({ registrationNumber: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          '_id registrationNumber fleetNumber depotName vehicleType status currentAssignedTripId isActive createdAt updatedAt'
        )
        .lean()
    ]);

    const data: BusDto[] = docs.map((doc) => ({
      id: doc._id.toString(),
      registrationNumber: doc.registrationNumber,
      fleetNumber: doc.fleetNumber,
      depotName: doc.depotName,
      vehicleType: doc.vehicleType,
      status: doc.status,
      currentAssignedTripId: doc.currentAssignedTripId
        ? doc.currentAssignedTripId.toString()
        : undefined,
      isActive: doc.isActive,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    }));

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Retrieves single bus record by ID, including assigned trip summary if present.
   */
  public async getBusById(busId: string): Promise<BusDetailDto> {
    const busObjectId = new Types.ObjectId(busId);
    const bus = await Bus.findById(busObjectId)
      .populate<{ currentAssignedTripId: ScheduledTripDocument | null }>({
        path: 'currentAssignedTripId',
        select: '_id tripCode departureTime arrivalTime status'
      })
      .lean();

    if (!bus) {
      throw new NotFoundError(`Bus with ID '${busId}' not found`);
    }

    const currentAssignedTrip =
      bus.currentAssignedTripId && typeof bus.currentAssignedTripId === 'object'
        ? {
            id: (bus.currentAssignedTripId as ScheduledTripDocument)._id.toString(),
            tripCode: (bus.currentAssignedTripId as ScheduledTripDocument).tripCode,
            departureTime: (bus.currentAssignedTripId as ScheduledTripDocument).departureTime,
            arrivalTime: (bus.currentAssignedTripId as ScheduledTripDocument).arrivalTime,
            status: (bus.currentAssignedTripId as ScheduledTripDocument).status || 'SCHEDULED'
          }
        : null;

    return {
      id: bus._id.toString(),
      registrationNumber: bus.registrationNumber,
      fleetNumber: bus.fleetNumber,
      depotName: bus.depotName,
      vehicleType: bus.vehicleType,
      status: bus.status,
      currentAssignedTripId: currentAssignedTrip ? currentAssignedTrip.id : undefined,
      currentAssignedTrip,
      isActive: bus.isActive,
      createdAt: bus.createdAt.toISOString(),
      updatedAt: bus.updatedAt.toISOString()
    };
  }

  /**
   * Retrieves paginated scheduled trips associated with a specific bus.
   */
  public async getBusTrips(
    busId: string,
    query: BusTripsQuery
  ): Promise<PaginatedResult<ScheduledTripSummaryDto>> {
    const busObjectId = new Types.ObjectId(busId);
    const busExists = await Bus.exists({ _id: busObjectId, isActive: true });
    if (!busExists) {
      throw new NotFoundError(`Bus with ID '${busId}' not found or inactive`);
    }

    const { page, limit, status, dayOfWeek, date } = query;
    const filter: FilterQuery<ScheduledTripDocument> = {
      busId: busObjectId,
      isActive: true
    };

    if (status) {
      filter.status = status;
    }

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
        .select(
          '_id tripCode routeDirectionId busId departureTime arrivalTime operationalDays status isActive createdAt updatedAt'
        )
        .lean()
    ]);

    const data: ScheduledTripSummaryDto[] = docs.map((doc) => ({
      id: doc._id.toString(),
      tripCode: doc.tripCode,
      routeDirectionId: doc.routeDirectionId.toString(),
      busId: doc.busId ? doc.busId.toString() : undefined,
      departureTime: doc.departureTime,
      arrivalTime: doc.arrivalTime,
      operationalDays: doc.operationalDays,
      status: doc.status || 'SCHEDULED',
      isActive: doc.isActive,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    }));

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Admin: creates a new bus in the fleet inventory.
   */
  public async createBus(data: CreateBusBody): Promise<BusDto> {
    const existing = await Bus.findOne({
      $or: [
        { registrationNumber: data.registrationNumber },
        { fleetNumber: data.fleetNumber }
      ]
    }).lean();

    if (existing) {
      if (existing.registrationNumber === data.registrationNumber) {
        throw new ConflictError(
          `Bus with registration number '${data.registrationNumber}' already exists`
        );
      }
      throw new ConflictError(
        `Bus with fleet number '${data.fleetNumber}' already exists`
      );
    }

    const newBus = await Bus.create({
      registrationNumber: data.registrationNumber,
      fleetNumber: data.fleetNumber,
      depotName: data.depotName,
      vehicleType: data.vehicleType,
      status: data.status,
      isActive: true
    });

    return {
      id: newBus._id.toString(),
      registrationNumber: newBus.registrationNumber,
      fleetNumber: newBus.fleetNumber,
      depotName: newBus.depotName,
      vehicleType: newBus.vehicleType,
      status: newBus.status,
      isActive: newBus.isActive,
      createdAt: newBus.createdAt.toISOString(),
      updatedAt: newBus.updatedAt.toISOString()
    };
  }

  /**
   * Admin: updates operational status of a bus.
   */
  public async updateBusStatus(
    busId: string,
    body: UpdateBusStatusBody
  ): Promise<BusDto> {
    const busObjectId = new Types.ObjectId(busId);
    const bus = await Bus.findById(busObjectId);

    if (!bus) {
      throw new NotFoundError(`Bus with ID '${busId}' not found`);
    }

    bus.status = body.status;

    // If bus is taken offline or into maintenance, disengage active trip assignment
    if (body.status === 'MAINTENANCE' || body.status === 'OFFLINE') {
      bus.currentAssignedTripId = undefined;
    }

    await bus.save();

    return {
      id: bus._id.toString(),
      registrationNumber: bus.registrationNumber,
      fleetNumber: bus.fleetNumber,
      depotName: bus.depotName,
      vehicleType: bus.vehicleType,
      status: bus.status,
      currentAssignedTripId: bus.currentAssignedTripId
        ? bus.currentAssignedTripId.toString()
        : undefined,
      isActive: bus.isActive,
      createdAt: bus.createdAt.toISOString(),
      updatedAt: bus.updatedAt.toISOString()
    };
  }
}

export const busService = new BusService();
