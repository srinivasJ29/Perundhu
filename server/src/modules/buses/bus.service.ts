import { FilterQuery, Types } from 'mongoose';
import {
  Bus,
  BusDocument,
  ScheduledTrip,
  ScheduledTripDocument,
  Depot,
  AssignmentRecord,
  CrewMemberDocument,
  DeviceRegistryDocument
} from '../../models';
import { NotFoundError, ConflictError, ValidationError } from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';
import { getIstDayOfWeek } from '../../common/utils/timezone';
import {
  ListBusesQuery,
  BusTripsQuery,
  CreateBusBody,
  UpdateBusStatusBody,
  UpdateBusBody,
  AssignBusDepotBody
} from './bus.validation';

export interface BusDto {
  id: string;
  registrationNumber: string;
  fleetNumber: string;
  depotName: string;
  depotId?: string;
  homeDepotId?: string;
  vehicleType: string;
  manufacturer?: string;
  vehicleModel?: string;
  fuelType?: string;
  seatingCapacity?: number;
  chassisNumber?: string;
  engineNumber?: string;
  registrationDate?: string;
  status: string;
  isReserveFleet?: boolean;
  currentAssignedTripId?: string;
  assignedDriverId?: string;
  assignedConductorId?: string;
  assignedEtmDeviceId?: string;
  assignedGpsTrackerId?: string;
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
  assignedDriver?: {
    id: string;
    fullName: string;
    employeeId: string;
    badgeNumber: string;
    contactNumber?: string;
  } | null;
  assignedConductor?: {
    id: string;
    fullName: string;
    employeeId: string;
    badgeNumber: string;
    contactNumber?: string;
  } | null;
  assignedEtm?: {
    id: string;
    deviceId: string;
    deviceModel: string;
    gpsAvailabilityStatus: string;
    status: string;
  } | null;
  assignedGpsTracker?: {
    id: string;
    deviceId: string;
    deviceModel: string;
    gpsAvailabilityStatus: string;
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
    const { page, limit, status, vehicleType, depotName, depotId, isReserveFleet, manufacturer, fuelType, isActive, q } = query;
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

    if (depotId) {
      filter.depotId = new Types.ObjectId(depotId);
    }

    if (typeof isReserveFleet === 'boolean') {
      filter.isReserveFleet = isReserveFleet;
    }

    if (manufacturer) {
      filter.manufacturer = new RegExp(manufacturer.trim(), 'i');
    }

    if (fuelType) {
      filter.fuelType = fuelType;
    }

    if (q && q.trim().length > 0) {
      const sanitizedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitizedQ, 'i');
      filter.$or = [
        { registrationNumber: regex },
        { fleetNumber: regex },
        { depotName: regex },
        { manufacturer: regex },
        { vehicleModel: regex }
      ];
    }

    const [total, docs] = await Promise.all([
      Bus.countDocuments(filter),
      Bus.find(filter)
        .sort({ registrationNumber: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    const data: BusDto[] = docs.map((doc) => ({
      id: doc._id.toString(),
      registrationNumber: doc.registrationNumber,
      fleetNumber: doc.fleetNumber,
      depotName: doc.depotName,
      depotId: doc.depotId ? doc.depotId.toString() : undefined,
      homeDepotId: doc.homeDepotId ? doc.homeDepotId.toString() : undefined,
      vehicleType: doc.vehicleType,
      manufacturer: doc.manufacturer,
      vehicleModel: doc.vehicleModel,
      fuelType: doc.fuelType,
      seatingCapacity: doc.seatingCapacity,
      chassisNumber: doc.chassisNumber,
      engineNumber: doc.engineNumber,
      registrationDate: doc.registrationDate ? doc.registrationDate.toISOString() : undefined,
      status: doc.status,
      isReserveFleet: doc.isReserveFleet,
      currentAssignedTripId: doc.currentAssignedTripId
        ? doc.currentAssignedTripId.toString()
        : undefined,
      assignedDriverId: doc.assignedDriverId ? doc.assignedDriverId.toString() : undefined,
      assignedConductorId: doc.assignedConductorId ? doc.assignedConductorId.toString() : undefined,
      assignedEtmDeviceId: doc.assignedEtmDeviceId ? doc.assignedEtmDeviceId.toString() : undefined,
      assignedGpsTrackerId: doc.assignedGpsTrackerId ? doc.assignedGpsTrackerId.toString() : undefined,
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
   * Retrieves single bus record by ID, including assigned trip, crew, and devices.
   */
  public async getBusById(busId: string): Promise<BusDetailDto> {
    const busObjectId = new Types.ObjectId(busId);
    const bus: any = await Bus.findById(busObjectId)
      .populate<{ currentAssignedTripId: ScheduledTripDocument | null }>({
        path: 'currentAssignedTripId',
        select: '_id tripCode departureTime arrivalTime status'
      })
      .populate<{ assignedDriverId: CrewMemberDocument | null }>({
        path: 'assignedDriverId',
        select: '_id fullName employeeId badgeNumber contactNumber'
      })
      .populate<{ assignedConductorId: CrewMemberDocument | null }>({
        path: 'assignedConductorId',
        select: '_id fullName employeeId badgeNumber contactNumber'
      })
      .populate<{ assignedEtmDeviceId: DeviceRegistryDocument | null }>({
        path: 'assignedEtmDeviceId',
        select: '_id deviceId deviceModel gpsAvailabilityStatus status'
      })
      .populate<{ assignedGpsTrackerId: DeviceRegistryDocument | null }>({
        path: 'assignedGpsTrackerId',
        select: '_id deviceId deviceModel gpsAvailabilityStatus status'
      })
      .lean();

    if (!bus) {
      throw new NotFoundError(`Bus with ID '${busId}' not found`);
    }

    const currentAssignedTrip =
      bus.currentAssignedTripId && typeof bus.currentAssignedTripId === 'object'
        ? {
            id: bus.currentAssignedTripId._id.toString(),
            tripCode: bus.currentAssignedTripId.tripCode,
            departureTime: bus.currentAssignedTripId.departureTime,
            arrivalTime: bus.currentAssignedTripId.arrivalTime,
            status: bus.currentAssignedTripId.status || 'SCHEDULED'
          }
        : null;

    const assignedDriver =
      bus.assignedDriverId && typeof bus.assignedDriverId === 'object'
        ? {
            id: bus.assignedDriverId._id.toString(),
            fullName: bus.assignedDriverId.fullName,
            employeeId: bus.assignedDriverId.employeeId,
            badgeNumber: bus.assignedDriverId.badgeNumber,
            contactNumber: bus.assignedDriverId.contactNumber
          }
        : null;

    const assignedConductor =
      bus.assignedConductorId && typeof bus.assignedConductorId === 'object'
        ? {
            id: bus.assignedConductorId._id.toString(),
            fullName: bus.assignedConductorId.fullName,
            employeeId: bus.assignedConductorId.employeeId,
            badgeNumber: bus.assignedConductorId.badgeNumber,
            contactNumber: bus.assignedConductorId.contactNumber
          }
        : null;

    const assignedEtm =
      bus.assignedEtmDeviceId && typeof bus.assignedEtmDeviceId === 'object'
        ? {
            id: bus.assignedEtmDeviceId._id.toString(),
            deviceId: bus.assignedEtmDeviceId.deviceId,
            deviceModel: bus.assignedEtmDeviceId.deviceModel,
            gpsAvailabilityStatus: bus.assignedEtmDeviceId.gpsAvailabilityStatus,
            status: bus.assignedEtmDeviceId.status
          }
        : null;

    const assignedGpsTracker =
      bus.assignedGpsTrackerId && typeof bus.assignedGpsTrackerId === 'object'
        ? {
            id: bus.assignedGpsTrackerId._id.toString(),
            deviceId: bus.assignedGpsTrackerId.deviceId,
            deviceModel: bus.assignedGpsTrackerId.deviceModel,
            gpsAvailabilityStatus: bus.assignedGpsTrackerId.gpsAvailabilityStatus,
            status: bus.assignedGpsTrackerId.status
          }
        : null;

    return {
      id: bus._id.toString(),
      registrationNumber: bus.registrationNumber,
      fleetNumber: bus.fleetNumber,
      depotName: bus.depotName,
      depotId: bus.depotId ? bus.depotId.toString() : undefined,
      homeDepotId: bus.homeDepotId ? bus.homeDepotId.toString() : undefined,
      vehicleType: bus.vehicleType,
      manufacturer: bus.manufacturer,
      vehicleModel: bus.vehicleModel,
      fuelType: bus.fuelType,
      seatingCapacity: bus.seatingCapacity,
      chassisNumber: bus.chassisNumber,
      engineNumber: bus.engineNumber,
      registrationDate: bus.registrationDate ? bus.registrationDate.toISOString() : undefined,
      status: bus.status,
      isReserveFleet: bus.isReserveFleet,
      currentAssignedTripId: currentAssignedTrip ? currentAssignedTrip.id : undefined,
      currentAssignedTrip,
      assignedDriver,
      assignedConductor,
      assignedEtm,
      assignedGpsTracker,
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

    let resolvedDepotName = data.depotName;
    let depotObjectId: Types.ObjectId | undefined = undefined;

    if (data.depotId) {
      depotObjectId = new Types.ObjectId(data.depotId);
      const depot = await Depot.findById(depotObjectId).lean();
      if (!depot) {
        throw new ValidationError(`Depot with ID '${data.depotId}' not found`);
      }
      resolvedDepotName = resolvedDepotName || depot.nameEn;
    }

    const newBus = await Bus.create({
      registrationNumber: data.registrationNumber,
      fleetNumber: data.fleetNumber,
      depotName: resolvedDepotName,
      depotId: depotObjectId,
      homeDepotId: data.homeDepotId ? new Types.ObjectId(data.homeDepotId) : depotObjectId,
      vehicleType: data.vehicleType,
      manufacturer: data.manufacturer,
      vehicleModel: data.vehicleModel,
      fuelType: data.fuelType,
      seatingCapacity: data.seatingCapacity,
      chassisNumber: data.chassisNumber,
      engineNumber: data.engineNumber,
      registrationDate: data.registrationDate ? new Date(data.registrationDate) : undefined,
      status: data.status,
      isReserveFleet: Boolean(data.isReserveFleet),
      isActive: true
    });

    return {
      id: newBus._id.toString(),
      registrationNumber: newBus.registrationNumber,
      fleetNumber: newBus.fleetNumber,
      depotName: newBus.depotName,
      depotId: newBus.depotId ? newBus.depotId.toString() : undefined,
      homeDepotId: newBus.homeDepotId ? newBus.homeDepotId.toString() : undefined,
      vehicleType: newBus.vehicleType,
      manufacturer: newBus.manufacturer,
      vehicleModel: newBus.vehicleModel,
      fuelType: newBus.fuelType,
      seatingCapacity: newBus.seatingCapacity,
      chassisNumber: newBus.chassisNumber,
      engineNumber: newBus.engineNumber,
      registrationDate: newBus.registrationDate ? newBus.registrationDate.toISOString() : undefined,
      status: newBus.status,
      isReserveFleet: newBus.isReserveFleet,
      isActive: newBus.isActive,
      createdAt: newBus.createdAt.toISOString(),
      updatedAt: newBus.updatedAt.toISOString()
    };
  }

  /**
   * Admin: updates vehicle information of an existing bus.
   */
  public async updateBus(busId: string, data: UpdateBusBody): Promise<BusDto> {
    const busObjectId = new Types.ObjectId(busId);
    const bus = await Bus.findById(busObjectId);

    if (!bus) {
      throw new NotFoundError(`Bus with ID '${busId}' not found`);
    }

    if (data.manufacturer !== undefined) bus.manufacturer = data.manufacturer;
    if (data.vehicleModel !== undefined) bus.vehicleModel = data.vehicleModel;
    if (data.vehicleType !== undefined) bus.vehicleType = data.vehicleType;
    if (data.fuelType !== undefined) bus.fuelType = data.fuelType;
    if (data.seatingCapacity !== undefined) bus.seatingCapacity = data.seatingCapacity;
    if (data.chassisNumber !== undefined) bus.chassisNumber = data.chassisNumber;
    if (data.engineNumber !== undefined) bus.engineNumber = data.engineNumber;
    if (data.isReserveFleet !== undefined) bus.isReserveFleet = data.isReserveFleet;
    if (data.currentOdometerKm !== undefined) bus.currentOdometerKm = data.currentOdometerKm;

    if (data.depotId) {
      const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
      if (!depot) {
        throw new ValidationError(`Target depot '${data.depotId}' not found`);
      }
      bus.depotId = depot._id;
      bus.depotName = data.depotName || depot.nameEn;
    } else if (data.depotName) {
      bus.depotName = data.depotName;
    }

    if (data.homeDepotId) {
      bus.homeDepotId = new Types.ObjectId(data.homeDepotId);
    }

    await bus.save();

    return {
      id: bus._id.toString(),
      registrationNumber: bus.registrationNumber,
      fleetNumber: bus.fleetNumber,
      depotName: bus.depotName,
      depotId: bus.depotId ? bus.depotId.toString() : undefined,
      homeDepotId: bus.homeDepotId ? bus.homeDepotId.toString() : undefined,
      vehicleType: bus.vehicleType,
      manufacturer: bus.manufacturer,
      vehicleModel: bus.vehicleModel,
      fuelType: bus.fuelType,
      seatingCapacity: bus.seatingCapacity,
      chassisNumber: bus.chassisNumber,
      engineNumber: bus.engineNumber,
      status: bus.status,
      isReserveFleet: bus.isReserveFleet,
      currentAssignedTripId: bus.currentAssignedTripId ? bus.currentAssignedTripId.toString() : undefined,
      isActive: bus.isActive,
      createdAt: bus.createdAt ? new Date(bus.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: bus.updatedAt ? new Date(bus.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Admin: assigns bus to a depot and registers assignment history.
   */
  public async assignBusDepot(
    busId: string,
    body: AssignBusDepotBody,
    assignedBy: string
  ): Promise<BusDto> {
    const busObjectId = new Types.ObjectId(busId);
    const depotObjectId = new Types.ObjectId(body.depotId);

    const [bus, depot] = await Promise.all([
      Bus.findById(busObjectId),
      Depot.findById(depotObjectId)
    ]);

    if (!bus) {
      throw new NotFoundError(`Bus with ID '${busId}' not found`);
    }
    if (!depot) {
      throw new NotFoundError(`Depot with ID '${body.depotId}' not found`);
    }
    if (depot.status === 'INACTIVE') {
      throw new ValidationError(`Cannot assign bus to inactive depot '${depot.code}'`);
    }

    // Mark previous active BUS_DEPOT assignments as SUPERSEDED
    await AssignmentRecord.updateMany(
      { busId: bus._id, assignmentType: 'BUS_DEPOT', status: 'ACTIVE' },
      { status: 'SUPERSEDED', unassignedAt: new Date(), unassignedBy: assignedBy }
    );

    // Create new assignment record
    await AssignmentRecord.create({
      assignmentType: 'BUS_DEPOT',
      busId: bus._id,
      depotId: depot._id,
      status: 'ACTIVE',
      assignedAt: new Date(),
      assignedBy,
      notes: body.notes || `Assigned to ${depot.nameEn} (${depot.code})`
    });

    bus.depotId = depot._id;
    bus.depotName = depot.nameEn;
    await bus.save();

    return {
      id: bus._id.toString(),
      registrationNumber: bus.registrationNumber,
      fleetNumber: bus.fleetNumber,
      depotName: bus.depotName,
      depotId: bus.depotId.toString(),
      vehicleType: bus.vehicleType,
      status: bus.status,
      isReserveFleet: bus.isReserveFleet,
      isActive: bus.isActive,
      createdAt: bus.createdAt ? new Date(bus.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: bus.updatedAt ? new Date(bus.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Retrieves assignment history for a bus from immutable AssignmentRecord.
   */
  public async getBusAssignments(busId: string): Promise<any[]> {
    const busObjectId = new Types.ObjectId(busId);
    const records = await AssignmentRecord.find({ busId: busObjectId })
      .sort({ assignedAt: -1 })
      .populate('deviceId', 'deviceId deviceModel deviceCategory status')
      .populate('crewMemberId', 'fullName employeeId badgeNumber role')
      .populate('depotId', 'nameEn code depotType')
      .lean();

    return records.map((r: any) => ({
      id: r._id.toString(),
      assignmentType: r.assignmentType,
      status: r.status,
      assignedAt: r.assignedAt.toISOString(),
      unassignedAt: r.unassignedAt ? r.unassignedAt.toISOString() : undefined,
      assignedBy: r.assignedBy,
      notes: r.notes,
      device: r.deviceId
        ? {
            id: r.deviceId._id.toString(),
            deviceId: r.deviceId.deviceId,
            deviceModel: r.deviceId.deviceModel,
            deviceCategory: r.deviceId.deviceCategory
          }
        : undefined,
      crewMember: r.crewMemberId
        ? {
            id: r.crewMemberId._id.toString(),
            fullName: r.crewMemberId.fullName,
            employeeId: r.crewMemberId.employeeId,
            role: r.crewMemberId.role
          }
        : undefined,
      depot: r.depotId
        ? {
            id: r.depotId._id.toString(),
            nameEn: r.depotId.nameEn,
            code: r.depotId.code
          }
        : undefined
    }));
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
    if (
      body.status === 'MAINTENANCE' ||
      body.status === 'UNDER_MAINTENANCE' ||
      body.status === 'BREAKDOWN' ||
      body.status === 'OFFLINE'
    ) {
      bus.currentAssignedTripId = undefined;
    }

    await bus.save();

    return {
      id: bus._id.toString(),
      registrationNumber: bus.registrationNumber,
      fleetNumber: bus.fleetNumber,
      depotName: bus.depotName,
      depotId: bus.depotId ? bus.depotId.toString() : undefined,
      homeDepotId: bus.homeDepotId ? bus.homeDepotId.toString() : undefined,
      vehicleType: bus.vehicleType,
      manufacturer: bus.manufacturer,
      vehicleModel: bus.vehicleModel,
      fuelType: bus.fuelType,
      status: bus.status,
      isReserveFleet: bus.isReserveFleet,
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
