import { FilterQuery, Types } from 'mongoose';
import {
  CrewMember,
  CrewMemberDocument,
  Depot,
  AssignmentRecord
} from '../../models';
import { NotFoundError, ConflictError, ValidationError } from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';
import {
  ListCrewQuery,
  CreateDriverBody,
  UpdateDriverBody,
  CreateConductorBody,
  UpdateConductorBody,
  UpdateCrewStatusBody
} from './crew.validation';

export interface CrewMemberDto {
  id: string;
  employeeId: string;
  badgeNumber: string;
  fullName: string;
  role: 'DRIVER' | 'CONDUCTOR';
  organizationId: string;
  divisionId: string;
  depotId: string;
  depot?: { id: string; nameEn: string; nameTa: string; code: string };
  licenseNumber?: string;
  licenseExpiryDate?: string;
  contactNumber?: string;
  status: string;
  currentAssignedBusId?: string;
  currentAssignedBus?: { id: string; registrationNumber: string; fleetNumber: string };
  currentAssignedTripId?: string;
  currentAssignedTrip?: { id: string; tripCode: string; departureTime: string; arrivalTime: string };
  assignedEtmDeviceId?: string;
  assignedEtmDevice?: { id: string; deviceId: string; deviceModel: string; gpsAvailabilityStatus: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CrewService {
  /**
   * Retrieves paginated list of crew members (drivers or conductors) with privacy filtering.
   */
  public async listCrewMembers(
    query: ListCrewQuery,
    isAdmin = false
  ): Promise<PaginatedResult<CrewMemberDto>> {
    const { page, limit, role, depotId, status, isActive, q } = query;
    const filter: FilterQuery<CrewMemberDocument> = {};

    if (role) filter.role = role;
    if (depotId) filter.depotId = new Types.ObjectId(depotId);
    if (status) filter.status = status;
    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    } else {
      filter.isActive = true;
    }

    if (q && q.trim().length > 0) {
      const sanitizedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitizedQ, 'i');
      filter.$or = [
        { fullName: regex },
        { employeeId: regex },
        { badgeNumber: regex }
      ];
    }

    const [total, docs] = await Promise.all([
      CrewMember.countDocuments(filter),
      CrewMember.find(filter)
        .sort({ employeeId: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('depotId', '_id nameEn nameTa code')
        .populate('currentAssignedBusId', '_id registrationNumber fleetNumber')
        .populate('currentAssignedTripId', '_id tripCode departureTime arrivalTime')
        .populate('assignedEtmDeviceId', '_id deviceId deviceModel gpsAvailabilityStatus')
        .lean()
    ]);

    const data: CrewMemberDto[] = docs.map((doc: any) => ({
      id: doc._id.toString(),
      employeeId: doc.employeeId,
      badgeNumber: doc.badgeNumber,
      fullName: doc.fullName,
      role: doc.role,
      organizationId: doc.organizationId ? doc.organizationId.toString() : '',
      divisionId: doc.divisionId ? doc.divisionId.toString() : '',
      depotId: doc.depotId ? (doc.depotId._id ? doc.depotId._id.toString() : doc.depotId.toString()) : '',
      depot: doc.depotId && typeof doc.depotId === 'object'
        ? {
            id: doc.depotId._id.toString(),
            nameEn: doc.depotId.nameEn,
            nameTa: doc.depotId.nameTa,
            code: doc.depotId.code
          }
        : undefined,
      // Staff privacy: hide license and contact details unless authenticated as admin
      licenseNumber: isAdmin ? doc.licenseNumber : undefined,
      licenseExpiryDate: isAdmin && doc.licenseExpiryDate ? doc.licenseExpiryDate.toISOString() : undefined,
      contactNumber: isAdmin ? doc.contactNumber : undefined,
      status: doc.status,
      currentAssignedBusId: doc.currentAssignedBusId
        ? (doc.currentAssignedBusId._id ? doc.currentAssignedBusId._id.toString() : doc.currentAssignedBusId.toString())
        : undefined,
      currentAssignedBus: doc.currentAssignedBusId && typeof doc.currentAssignedBusId === 'object'
        ? {
            id: doc.currentAssignedBusId._id.toString(),
            registrationNumber: doc.currentAssignedBusId.registrationNumber,
            fleetNumber: doc.currentAssignedBusId.fleetNumber
          }
        : undefined,
      currentAssignedTripId: doc.currentAssignedTripId
        ? (doc.currentAssignedTripId._id ? doc.currentAssignedTripId._id.toString() : doc.currentAssignedTripId.toString())
        : undefined,
      currentAssignedTrip: doc.currentAssignedTripId && typeof doc.currentAssignedTripId === 'object'
        ? {
            id: doc.currentAssignedTripId._id.toString(),
            tripCode: doc.currentAssignedTripId.tripCode,
            departureTime: doc.currentAssignedTripId.departureTime,
            arrivalTime: doc.currentAssignedTripId.arrivalTime
          }
        : undefined,
      assignedEtmDeviceId: doc.assignedEtmDeviceId
        ? (doc.assignedEtmDeviceId._id ? doc.assignedEtmDeviceId._id.toString() : doc.assignedEtmDeviceId.toString())
        : undefined,
      assignedEtmDevice: doc.assignedEtmDeviceId && typeof doc.assignedEtmDeviceId === 'object'
        ? {
            id: doc.assignedEtmDeviceId._id.toString(),
            deviceId: doc.assignedEtmDeviceId.deviceId,
            deviceModel: doc.assignedEtmDeviceId.deviceModel,
            gpsAvailabilityStatus: doc.assignedEtmDeviceId.gpsAvailabilityStatus
          }
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
   * Retrieves single crew member profile.
   */
  public async getCrewMemberById(crewId: string, isAdmin = false): Promise<CrewMemberDto> {
    const crewObjectId = new Types.ObjectId(crewId);
    const doc: any = await CrewMember.findById(crewObjectId)
      .populate('depotId', '_id nameEn nameTa code')
      .populate('currentAssignedBusId', '_id registrationNumber fleetNumber vehicleType status')
      .populate('currentAssignedTripId', '_id tripCode departureTime arrivalTime status')
      .populate('assignedEtmDeviceId', '_id deviceId deviceModel gpsAvailabilityStatus status')
      .lean();

    if (!doc) {
      throw new NotFoundError(`Crew member with ID '${crewId}' not found`);
    }

    return {
      id: doc._id.toString(),
      employeeId: doc.employeeId,
      badgeNumber: doc.badgeNumber,
      fullName: doc.fullName,
      role: doc.role,
      organizationId: doc.organizationId ? doc.organizationId.toString() : '',
      divisionId: doc.divisionId ? doc.divisionId.toString() : '',
      depotId: doc.depotId ? (doc.depotId._id ? doc.depotId._id.toString() : doc.depotId.toString()) : '',
      depot: doc.depotId && typeof doc.depotId === 'object'
        ? {
            id: doc.depotId._id.toString(),
            nameEn: doc.depotId.nameEn,
            nameTa: doc.depotId.nameTa,
            code: doc.depotId.code
          }
        : undefined,
      licenseNumber: isAdmin ? doc.licenseNumber : undefined,
      licenseExpiryDate: isAdmin && doc.licenseExpiryDate ? doc.licenseExpiryDate.toISOString() : undefined,
      contactNumber: isAdmin ? doc.contactNumber : undefined,
      status: doc.status,
      currentAssignedBusId: doc.currentAssignedBusId
        ? (doc.currentAssignedBusId._id ? doc.currentAssignedBusId._id.toString() : doc.currentAssignedBusId.toString())
        : undefined,
      currentAssignedBus: doc.currentAssignedBusId && typeof doc.currentAssignedBusId === 'object'
        ? {
            id: doc.currentAssignedBusId._id.toString(),
            registrationNumber: doc.currentAssignedBusId.registrationNumber,
            fleetNumber: doc.currentAssignedBusId.fleetNumber
          }
        : undefined,
      currentAssignedTripId: doc.currentAssignedTripId
        ? (doc.currentAssignedTripId._id ? doc.currentAssignedTripId._id.toString() : doc.currentAssignedTripId.toString())
        : undefined,
      currentAssignedTrip: doc.currentAssignedTripId && typeof doc.currentAssignedTripId === 'object'
        ? {
            id: doc.currentAssignedTripId._id.toString(),
            tripCode: doc.currentAssignedTripId.tripCode,
            departureTime: doc.currentAssignedTripId.departureTime,
            arrivalTime: doc.currentAssignedTripId.arrivalTime
          }
        : undefined,
      assignedEtmDeviceId: doc.assignedEtmDeviceId
        ? (doc.assignedEtmDeviceId._id ? doc.assignedEtmDeviceId._id.toString() : doc.assignedEtmDeviceId.toString())
        : undefined,
      assignedEtmDevice: doc.assignedEtmDeviceId && typeof doc.assignedEtmDeviceId === 'object'
        ? {
            id: doc.assignedEtmDeviceId._id.toString(),
            deviceId: doc.assignedEtmDeviceId.deviceId,
            deviceModel: doc.assignedEtmDeviceId.deviceModel,
            gpsAvailabilityStatus: doc.assignedEtmDeviceId.gpsAvailabilityStatus
          }
        : undefined,
      isActive: doc.isActive,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    };
  }

  /**
   * Registers a new driver.
   */
  public async createDriver(data: CreateDriverBody): Promise<CrewMemberDto> {
    await this.validateUniqueEmployee(data.employeeId, data.badgeNumber);

    const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
    if (!depot) {
      throw new ValidationError(`Depot with ID '${data.depotId}' not found`);
    }

    const doc = await CrewMember.create({
      employeeId: data.employeeId,
      badgeNumber: data.badgeNumber,
      fullName: data.fullName,
      role: 'DRIVER',
      organizationId: new Types.ObjectId(data.organizationId),
      divisionId: new Types.ObjectId(data.divisionId),
      depotId: new Types.ObjectId(data.depotId),
      licenseNumber: data.licenseNumber,
      licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : undefined,
      contactNumber: data.contactNumber,
      status: data.status,
      isActive: true
    });

    return this.getCrewMemberById(doc._id.toString(), true);
  }

  /**
   * Registers a new conductor.
   */
  public async createConductor(data: CreateConductorBody): Promise<CrewMemberDto> {
    await this.validateUniqueEmployee(data.employeeId, data.badgeNumber);

    const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
    if (!depot) {
      throw new ValidationError(`Depot with ID '${data.depotId}' not found`);
    }

    const doc = await CrewMember.create({
      employeeId: data.employeeId,
      badgeNumber: data.badgeNumber,
      fullName: data.fullName,
      role: 'CONDUCTOR',
      organizationId: new Types.ObjectId(data.organizationId),
      divisionId: new Types.ObjectId(data.divisionId),
      depotId: new Types.ObjectId(data.depotId),
      contactNumber: data.contactNumber,
      status: data.status,
      isActive: true
    });

    return this.getCrewMemberById(doc._id.toString(), true);
  }

  /**
   * Updates driver information.
   */
  public async updateDriver(driverId: string, data: UpdateDriverBody): Promise<CrewMemberDto> {
    const driver = await CrewMember.findOne({ _id: new Types.ObjectId(driverId), role: 'DRIVER' });
    if (!driver) {
      throw new NotFoundError(`Driver with ID '${driverId}' not found`);
    }

    if (data.fullName !== undefined) driver.fullName = data.fullName;
    if (data.licenseNumber !== undefined) driver.licenseNumber = data.licenseNumber;
    if (data.licenseExpiryDate !== undefined) driver.licenseExpiryDate = new Date(data.licenseExpiryDate);
    if (data.contactNumber !== undefined) driver.contactNumber = data.contactNumber;
    if (data.status !== undefined) driver.status = data.status;

    if (data.depotId) {
      const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
      if (!depot) throw new ValidationError(`Depot '${data.depotId}' not found`);
      driver.depotId = depot._id;
    }

    await driver.save();
    return this.getCrewMemberById(driver._id.toString(), true);
  }

  /**
   * Updates conductor information.
   */
  public async updateConductor(conductorId: string, data: UpdateConductorBody): Promise<CrewMemberDto> {
    const conductor = await CrewMember.findOne({ _id: new Types.ObjectId(conductorId), role: 'CONDUCTOR' });
    if (!conductor) {
      throw new NotFoundError(`Conductor with ID '${conductorId}' not found`);
    }

    if (data.fullName !== undefined) conductor.fullName = data.fullName;
    if (data.contactNumber !== undefined) conductor.contactNumber = data.contactNumber;
    if (data.status !== undefined) conductor.status = data.status;

    if (data.depotId) {
      const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
      if (!depot) throw new ValidationError(`Depot '${data.depotId}' not found`);
      conductor.depotId = depot._id;
    }

    await conductor.save();
    return this.getCrewMemberById(conductor._id.toString(), true);
  }

  /**
   * Updates operational availability status for a driver or conductor.
   */
  public async updateCrewStatus(crewId: string, body: UpdateCrewStatusBody): Promise<CrewMemberDto> {
    const crew = await CrewMember.findById(new Types.ObjectId(crewId));
    if (!crew) {
      throw new NotFoundError(`Crew member with ID '${crewId}' not found`);
    }

    // Guardrail: If changing to ON_LEAVE, INACTIVE, or OFF_DUTY while assigned to an active trip
    if (
      (body.status === 'ON_LEAVE' || body.status === 'INACTIVE' || body.status === 'OFF_DUTY') &&
      crew.currentAssignedTripId
    ) {
      throw new ValidationError(
        `Cannot change status to '${body.status}': staff member is currently assigned to active trip`
      );
    }

    crew.status = body.status;
    if (body.status === 'INACTIVE') {
      crew.isActive = false;
    } else if (body.status === 'AVAILABLE' || body.status === 'ACTIVE') {
      crew.isActive = true;
    }

    await crew.save();
    return this.getCrewMemberById(crew._id.toString(), true);
  }

  /**
   * Retrieves assignment history for a crew member.
   */
  public async getCrewAssignments(crewId: string): Promise<any[]> {
    const crewObjectId = new Types.ObjectId(crewId);
    const records = await AssignmentRecord.find({ crewMemberId: crewObjectId })
      .sort({ assignedAt: -1 })
      .populate('busId', 'registrationNumber fleetNumber vehicleType')
      .populate('deviceId', 'deviceId deviceModel deviceCategory')
      .lean();

    return records.map((r: any) => ({
      id: r._id.toString(),
      assignmentType: r.assignmentType,
      status: r.status,
      assignedAt: r.assignedAt.toISOString(),
      unassignedAt: r.unassignedAt ? r.unassignedAt.toISOString() : undefined,
      assignedBy: r.assignedBy,
      notes: r.notes,
      bus: r.busId
        ? {
            id: r.busId._id.toString(),
            registrationNumber: r.busId.registrationNumber,
            fleetNumber: r.busId.fleetNumber
          }
        : undefined,
      device: r.deviceId
        ? {
            id: r.deviceId._id.toString(),
            deviceId: r.deviceId.deviceId,
            deviceModel: r.deviceId.deviceModel,
            deviceCategory: r.deviceId.deviceCategory
          }
        : undefined
    }));
  }

  private async validateUniqueEmployee(employeeId: string, badgeNumber: string): Promise<void> {
    const existing = await CrewMember.findOne({
      $or: [{ employeeId }, { badgeNumber }]
    }).lean();

    if (existing) {
      if (existing.employeeId === employeeId) {
        throw new ConflictError(`Employee with ID '${employeeId}' already exists`);
      }
      throw new ConflictError(`Badge number '${badgeNumber}' is already registered`);
    }
  }
}

export const crewService = new CrewService();
