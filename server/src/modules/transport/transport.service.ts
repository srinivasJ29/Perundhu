import { Types } from 'mongoose';
import {
  TransportOrganization,
  TransportDivision,
  Depot,
  MaintenanceWorkshop,
  CrewMember,
  DeviceRegistry,
  MaintenanceRecord,
  VehicleReplacementRecord,
  Bus,
  ScheduledTrip,
  DepotTransfer
} from '../../models';
import {
  NotFoundError,
  ConflictError,
  ValidationError
} from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';

export class TransportService {
  // =========================================================================
  // 1. Transport Organization
  // =========================================================================

  public async createOrganization(data: {
    name: string;
    code: string;
    shortName?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    metadata?: Record<string, unknown>;
  }) {
    const existing = await TransportOrganization.findOne({ code: data.code }).lean();
    if (existing) {
      throw new ConflictError(`Organization with code '${data.code}' already exists`);
    }

    const org = await TransportOrganization.create(data);
    return org.toObject();
  }

  public async getOrganizations(query: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'INACTIVE';
    q?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { code: { $regex: query.q, $options: 'i' } }
      ];
    }

    const [total, data] = await Promise.all([
      TransportOrganization.countDocuments(filter),
      TransportOrganization.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getOrganizationById(id: string) {
    const org = await TransportOrganization.findById(id).lean();
    if (!org) {
      throw new NotFoundError(`Organization with id '${id}' not found`);
    }
    return org;
  }

  // =========================================================================
  // 2. Transport Division
  // =========================================================================

  public async createDivision(data: {
    organizationId: string;
    name: string;
    code: string;
    districtId?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }) {
    const org = await TransportOrganization.findById(data.organizationId).lean();
    if (!org) {
      throw new NotFoundError(`Organization with id '${data.organizationId}' not found`);
    }

    const existing = await TransportDivision.findOne({ code: data.code }).lean();
    if (existing) {
      throw new ConflictError(`Division with code '${data.code}' already exists`);
    }

    const division = await TransportDivision.create(data);
    return division.toObject();
  }

  public async getDivisions(query: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    q?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.organizationId) filter.organizationId = new Types.ObjectId(query.organizationId);
    if (query.status) filter.status = query.status;
    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { code: { $regex: query.q, $options: 'i' } }
      ];
    }

    const [total, data] = await Promise.all([
      TransportDivision.countDocuments(filter),
      TransportDivision.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getDivisionById(id: string) {
    const division = await TransportDivision.findById(id).lean();
    if (!division) {
      throw new NotFoundError(`Division with id '${id}' not found`);
    }
    return division;
  }

  // =========================================================================
  // 3. Depot Management
  // =========================================================================

  public async createDepot(data: {
    code: string;
    nameEn: string;
    nameTa: string;
    organizationId: string;
    divisionId?: string;
    depotType?: 'PRIMARY' | 'SECONDARY' | 'BACKUP';
    primaryDepotId?: string;
    sisterBackupDepotIds?: string[];
    location: { type: 'Point'; coordinates: [number, number] };
    totalCapacity?: number;
    serviceBaysCount?: number;
    fuelPumpsAvailable?: number;
    associatedBusStandIds?: string[];
    status?: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
  }) {
    const existing = await Depot.findOne({ code: data.code }).lean();
    if (existing) {
      throw new ConflictError(`Depot with code '${data.code}' already exists`);
    }

    const org = await TransportOrganization.findById(data.organizationId).lean();
    if (!org) {
      throw new NotFoundError(`Organization with id '${data.organizationId}' not found`);
    }

    if (data.depotType === 'BACKUP') {
      if (!data.primaryDepotId) {
        throw new ValidationError('A backup depot must specify a primary depot reference');
      }
      const primaryDepot = await Depot.findById(data.primaryDepotId).lean();
      if (!primaryDepot) {
        throw new NotFoundError(`Primary depot with id '${data.primaryDepotId}' not found`);
      }
      if (primaryDepot.organizationId.toString() !== data.organizationId) {
        throw new ValidationError('Backup depot must belong to the same organization as primary depot');
      }
    }

    const depot = await Depot.create(data);
    return depot.toObject();
  }

  public async getDepots(query: {
    page?: number;
    limit?: number;
    organizationId?: string;
    divisionId?: string;
    depotType?: 'PRIMARY' | 'SECONDARY' | 'BACKUP';
    status?: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
    q?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.organizationId) filter.organizationId = new Types.ObjectId(query.organizationId);
    if (query.divisionId) filter.divisionId = new Types.ObjectId(query.divisionId);
    if (query.depotType) filter.depotType = query.depotType;
    if (query.status) filter.status = query.status;
    if (query.q) {
      filter.$or = [
        { nameEn: { $regex: query.q, $options: 'i' } },
        { nameTa: { $regex: query.q, $options: 'i' } },
        { code: { $regex: query.q, $options: 'i' } }
      ];
    }

    const [total, data] = await Promise.all([
      Depot.countDocuments(filter),
      Depot.find(filter)
        .sort({ code: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getDepotById(id: string) {
    const depot = await Depot.findById(id).lean();
    if (!depot) {
      throw new NotFoundError(`Depot with id '${id}' not found`);
    }
    return depot;
  }

  public async updateDepot(id: string, updateData: Record<string, unknown>) {
    const depot = await Depot.findById(id);
    if (!depot) {
      throw new NotFoundError(`Depot with id '${id}' not found`);
    }

    if (updateData.primaryDepotId && updateData.primaryDepotId === id) {
      throw new ValidationError('A depot cannot reference itself as its primary depot');
    }

    Object.assign(depot, updateData);
    await depot.save();
    return depot.toObject();
  }

  // =========================================================================
  // 4. Workshop Management
  // =========================================================================

  public async createWorkshop(data: {
    code: string;
    nameEn: string;
    nameTa: string;
    organizationId: string;
    divisionId?: string;
    depotId?: string;
    workshopType?: 'DEPOT_PIT_LANE' | 'REGIONAL_CENTRAL_WORKSHOP';
    location: { type: 'Point'; coordinates: [number, number] };
    totalBays?: number;
    capabilities?: Array<
      | 'MINOR_REPAIRS'
      | 'HEAVY_OVERHAUL'
      | 'ELECTRICAL'
      | 'BODY_WORK'
      | 'TYRE_RETREADING'
      | 'FITNESS_CERTIFICATION'
    >;
    status?: 'ACTIVE' | 'INACTIVE' | 'UNDER_RENOVATION';
  }) {
    const existing = await MaintenanceWorkshop.findOne({ code: data.code }).lean();
    if (existing) {
      throw new ConflictError(`Workshop with code '${data.code}' already exists`);
    }

    const org = await TransportOrganization.findById(data.organizationId).lean();
    if (!org) {
      throw new NotFoundError(`Organization with id '${data.organizationId}' not found`);
    }

    if (data.depotId) {
      const depot = await Depot.findById(data.depotId).lean();
      if (!depot) {
        throw new NotFoundError(`Depot with id '${data.depotId}' not found`);
      }
    }

    const workshop = await MaintenanceWorkshop.create(data);
    return workshop.toObject();
  }

  public async getWorkshops(query: {
    page?: number;
    limit?: number;
    depotId?: string;
    workshopType?: 'DEPOT_PIT_LANE' | 'REGIONAL_CENTRAL_WORKSHOP';
    status?: 'ACTIVE' | 'INACTIVE' | 'UNDER_RENOVATION';
    q?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.depotId) filter.depotId = new Types.ObjectId(query.depotId);
    if (query.workshopType) filter.workshopType = query.workshopType;
    if (query.status) filter.status = query.status;
    if (query.q) {
      filter.$or = [
        { nameEn: { $regex: query.q, $options: 'i' } },
        { nameTa: { $regex: query.q, $options: 'i' } },
        { code: { $regex: query.q, $options: 'i' } }
      ];
    }

    const [total, data] = await Promise.all([
      MaintenanceWorkshop.countDocuments(filter),
      MaintenanceWorkshop.find(filter)
        .sort({ code: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getWorkshopById(id: string) {
    const workshop = await MaintenanceWorkshop.findById(id).lean();
    if (!workshop) {
      throw new NotFoundError(`Workshop with id '${id}' not found`);
    }
    return workshop;
  }

  // =========================================================================
  // 5. Crew Member Management
  // =========================================================================

  public async createCrewMember(data: {
    employeeId: string;
    badgeNumber: string;
    fullName: string;
    role: 'DRIVER' | 'CONDUCTOR';
    organizationId: string;
    divisionId?: string;
    depotId: string;
    licenseNumber?: string;
    licenseExpiryDate?: Date;
    contactNumber?: string;
    status?: 'ACTIVE' | 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE' | 'SUSPENDED';
  }) {
    const existing = await CrewMember.findOne({ employeeId: data.employeeId }).lean();
    if (existing) {
      throw new ConflictError(`Crew member with employee ID '${data.employeeId}' already exists`);
    }

    const depot = await Depot.findById(data.depotId).lean();
    if (!depot) {
      throw new NotFoundError(`Depot with id '${data.depotId}' not found`);
    }

    const crew = await CrewMember.create(data);
    return crew.toObject();
  }

  public async getCrewMembers(
    query: {
      page?: number;
      limit?: number;
      depotId?: string;
      role?: 'DRIVER' | 'CONDUCTOR';
      status?: 'ACTIVE' | 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE' | 'SUSPENDED';
      q?: string;
    },
    isAdmin = false
  ): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.depotId) filter.depotId = new Types.ObjectId(query.depotId);
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.q) {
      filter.$or = [
        { fullName: { $regex: query.q, $options: 'i' } },
        { employeeId: { $regex: query.q, $options: 'i' } },
        { badgeNumber: { $regex: query.q, $options: 'i' } }
      ];
    }

    // Protect Driver & Conductor PII if not admin
    const projection = isAdmin ? {} : { contactNumber: 0, licenseNumber: 0, licenseExpiryDate: 0 };

    const [total, data] = await Promise.all([
      CrewMember.countDocuments(filter),
      CrewMember.find(filter, projection)
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getCrewMemberById(id: string, isAdmin = false) {
    const projection = isAdmin ? {} : { contactNumber: 0, licenseNumber: 0, licenseExpiryDate: 0 };
    const member = await CrewMember.findById(id, projection).lean();
    if (!member) {
      throw new NotFoundError(`Crew member with id '${id}' not found`);
    }
    return member;
  }

  public async updateCrewMemberStatus(
    id: string,
    data: {
      status: 'ACTIVE' | 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE' | 'SUSPENDED';
      currentAssignedBusId?: string | null;
      currentAssignedTripId?: string | null;
    }
  ) {
    const member = await CrewMember.findById(id);
    if (!member) {
      throw new NotFoundError(`Crew member with id '${id}' not found`);
    }

    member.status = data.status;
    if (data.currentAssignedBusId !== undefined) {
      member.currentAssignedBusId = data.currentAssignedBusId
        ? new Types.ObjectId(data.currentAssignedBusId)
        : undefined;
    }
    if (data.currentAssignedTripId !== undefined) {
      member.currentAssignedTripId = data.currentAssignedTripId
        ? new Types.ObjectId(data.currentAssignedTripId)
        : undefined;
    }

    if (data.currentAssignedBusId || data.currentAssignedTripId) {
      member.assignmentHistory.push({
        busId: member.currentAssignedBusId,
        tripId: member.currentAssignedTripId,
        assignedAt: new Date()
      });
    }

    await member.save();
    return member.toObject();
  }

  // =========================================================================
  // 6. Device Registry (ETMs and GPS Trackers)
  // =========================================================================

  public async createDevice(data: {
    deviceId: string;
    deviceCategory: 'ETM' | 'GPS_TRACKER';
    manufacturer: string;
    deviceModel: string;
    serialNumber?: string;
    imei?: string;
    simIccid?: string;
    simPhoneNumber?: string;
    gpsAvailabilityStatus?: 'VERIFIED_AVAILABLE' | 'VERIFIED_UNAVAILABLE' | 'UNKNOWN';
    networkGenerations?: Array<'2G' | '3G' | '4G' | '5G'>;
    status?: 'ACTIVE' | 'STANDBY' | 'MAINTENANCE' | 'DECOMMISSIONED';
    depotId: string;
    batteryHealthPercent?: number;
  }) {
    const existing = await DeviceRegistry.findOne({ deviceId: data.deviceId }).lean();
    if (existing) {
      throw new ConflictError(`Device with ID '${data.deviceId}' already registered`);
    }

    const depot = await Depot.findById(data.depotId).lean();
    if (!depot) {
      throw new NotFoundError(`Depot with id '${data.depotId}' not found`);
    }

    const device = await DeviceRegistry.create(data);
    return device.toObject();
  }

  public async getDevices(query: {
    page?: number;
    limit?: number;
    deviceCategory?: 'ETM' | 'GPS_TRACKER';
    gpsAvailabilityStatus?: 'VERIFIED_AVAILABLE' | 'VERIFIED_UNAVAILABLE' | 'UNKNOWN';
    depotId?: string;
    status?: 'ACTIVE' | 'STANDBY' | 'MAINTENANCE' | 'DECOMMISSIONED';
    q?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.deviceCategory) filter.deviceCategory = query.deviceCategory;
    if (query.gpsAvailabilityStatus) filter.gpsAvailabilityStatus = query.gpsAvailabilityStatus;
    if (query.depotId) filter.depotId = new Types.ObjectId(query.depotId);
    if (query.status) filter.status = query.status;
    if (query.q) {
      filter.$or = [
        { deviceId: { $regex: query.q, $options: 'i' } },
        { manufacturer: { $regex: query.q, $options: 'i' } },
        { deviceModel: { $regex: query.q, $options: 'i' } }
      ];
    }

    const [total, data] = await Promise.all([
      DeviceRegistry.countDocuments(filter),
      DeviceRegistry.find(filter)
        .sort({ deviceId: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getDeviceById(id: string) {
    const device = await DeviceRegistry.findById(id).lean();
    if (!device) {
      throw new NotFoundError(`Device with id '${id}' not found`);
    }
    return device;
  }

  public async assignDevice(
    id: string,
    data: {
      assignedBusId?: string | null;
      assignedCrewId?: string | null;
      notes?: string;
    }
  ) {
    const device = await DeviceRegistry.findById(id);
    if (!device) {
      throw new NotFoundError(`Device with id '${id}' not found`);
    }

    const busId = data.assignedBusId ? new Types.ObjectId(data.assignedBusId) : undefined;
    const crewId = data.assignedCrewId ? new Types.ObjectId(data.assignedCrewId) : undefined;

    if (busId) {
      const busExists = await Bus.findById(busId).lean();
      if (!busExists) {
        throw new NotFoundError(`Bus with id '${data.assignedBusId}' not found`);
      }
    }

    if (crewId) {
      const crewExists = await CrewMember.findById(crewId).lean();
      if (!crewExists) {
        throw new NotFoundError(`Crew member with id '${data.assignedCrewId}' not found`);
      }
    }

    device.currentAssignedBusId = busId;
    device.currentAssignedCrewId = crewId;
    device.status = busId || crewId ? 'ACTIVE' : 'STANDBY';

    device.assignmentHistory.push({
      busId,
      crewId,
      assignedAt: new Date(),
      reason: data.notes
    });

    await device.save();
    return device.toObject();
  }

  // =========================================================================
  // 7. Maintenance Records
  // =========================================================================

  public async createMaintenanceRecord(data: {
    recordNumber: string;
    busId: string;
    depotId: string;
    workshopId?: string;
    reportedByCrewId?: string;
    maintenanceCategory:
      | 'PREVENTIVE'
      | 'BREAKDOWN'
      | 'ACCIDENT'
      | 'ROUTINE_INSPECTION'
      | 'FITNESS_CERT';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    issueDescription: string;
    odometerAtReportKm?: number;
    partsReplaced?: Array<{ partName: string; partCode?: string; quantity: number }>;
  }) {
    const existing = await MaintenanceRecord.findOne({ recordNumber: data.recordNumber }).lean();
    if (existing) {
      throw new ConflictError(`Maintenance record '${data.recordNumber}' already exists`);
    }

    const bus = await Bus.findById(data.busId);
    if (!bus) {
      throw new NotFoundError(`Bus with id '${data.busId}' not found`);
    }

    const depot = await Depot.findById(data.depotId).lean();
    if (!depot) {
      throw new NotFoundError(`Depot with id '${data.depotId}' not found`);
    }

    if (data.workshopId) {
      const workshop = await MaintenanceWorkshop.findById(data.workshopId).lean();
      if (!workshop) {
        throw new NotFoundError(`Workshop with id '${data.workshopId}' not found`);
      }
    }

    // Automatically transition bus status if breakdown or maintenance reported
    if (data.maintenanceCategory === 'BREAKDOWN') {
      bus.status = 'BREAKDOWN';
      await bus.save();
    } else {
      bus.status = 'UNDER_MAINTENANCE';
      await bus.save();
    }

    const record = await MaintenanceRecord.create(data);
    return record.toObject();
  }

  public async getMaintenanceRecords(query: {
    page?: number;
    limit?: number;
    busId?: string;
    depotId?: string;
    maintenanceCategory?: string;
    repairStatus?: string;
    priority?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.busId) filter.busId = new Types.ObjectId(query.busId);
    if (query.depotId) filter.depotId = new Types.ObjectId(query.depotId);
    if (query.maintenanceCategory) filter.maintenanceCategory = query.maintenanceCategory;
    if (query.repairStatus) filter.repairStatus = query.repairStatus;
    if (query.priority) filter.priority = query.priority;

    const [total, data] = await Promise.all([
      MaintenanceRecord.countDocuments(filter),
      MaintenanceRecord.find(filter)
        .sort({ reportedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getMaintenanceRecordById(id: string) {
    const record = await MaintenanceRecord.findById(id).lean();
    if (!record) {
      throw new NotFoundError(`Maintenance record with id '${id}' not found`);
    }
    return record;
  }

  public async updateMaintenanceStatus(
    id: string,
    data: {
      repairStatus:
        | 'REPORTED'
        | 'TRIAGED'
        | 'IN_PROGRESS'
        | 'WAITING_FOR_PARTS'
        | 'RESOLVED'
        | 'CLOSED';
      repairNotes?: string;
      technicianSignOff?: string;
      partsReplaced?: Array<{ partName: string; partCode?: string; quantity: number }>;
    }
  ) {
    const record = await MaintenanceRecord.findById(id);
    if (!record) {
      throw new NotFoundError(`Maintenance record with id '${id}' not found`);
    }

    record.repairStatus = data.repairStatus;
    if (data.repairNotes) record.repairNotes = data.repairNotes;
    if (data.technicianSignOff) record.technicianSignOff = data.technicianSignOff;
    if (data.partsReplaced) record.partsReplaced = data.partsReplaced;

    if (data.repairStatus === 'RESOLVED' || data.repairStatus === 'CLOSED') {
      record.resolvedAt = new Date();
      // Restore bus to AVAILABLE
      await Bus.findByIdAndUpdate(record.busId, { status: 'AVAILABLE' });
    }

    await record.save();
    return record.toObject();
  }

  // =========================================================================
  // 8. Vehicle Replacement Record
  // =========================================================================

  public async createVehicleReplacement(
    data: {
      replacementNumber: string;
      originalBusId: string;
      replacementBusId: string;
      tripId?: string;
      routeId?: string;
      originalDepotId: string;
      replacementDepotId: string;
      reason:
        | 'BREAKDOWN'
        | 'ACCIDENT'
        | 'MAINTENANCE_DUE'
        | 'CREW_UNAVAILABLE'
        | 'OVERCROWDING'
        | 'OTHER';
      reasonDetails?: string;
      driverReassignedId?: string;
      conductorReassignedId?: string;
      gpsReassignedDeviceId?: string;
      passengersTransferred?: boolean;
    },
    authorizedBy: string
  ) {
    if (data.originalBusId === data.replacementBusId) {
      throw new ValidationError('Replacement bus cannot be identical to the original bus');
    }

    const [existing, originalBus, replacementBus, origDepot, replDepot] = await Promise.all([
      VehicleReplacementRecord.findOne({ replacementNumber: data.replacementNumber }).lean(),
      Bus.findById(data.originalBusId),
      Bus.findById(data.replacementBusId),
      Depot.findById(data.originalDepotId).lean(),
      Depot.findById(data.replacementDepotId).lean()
    ]);

    if (existing) {
      throw new ConflictError(`Replacement record '${data.replacementNumber}' already exists`);
    }
    if (!originalBus) {
      throw new NotFoundError(`Original bus with id '${data.originalBusId}' not found`);
    }
    if (!replacementBus) {
      throw new NotFoundError(`Replacement bus with id '${data.replacementBusId}' not found`);
    }
    if (!origDepot) {
      throw new NotFoundError(`Original depot with id '${data.originalDepotId}' not found`);
    }
    if (!replDepot) {
      throw new NotFoundError(`Replacement depot with id '${data.replacementDepotId}' not found`);
    }

    // Verify replacement bus is eligible (not in breakdown or maintenance)
    if (['BREAKDOWN', 'UNDER_MAINTENANCE', 'MAINTENANCE', 'INACTIVE'].includes(replacementBus.status)) {
      throw new ValidationError(
        `Replacement bus '${replacementBus.registrationNumber}' is currently ${replacementBus.status} and cannot be assigned`
      );
    }

    // Update original bus status to BREAKDOWN
    originalBus.status = 'BREAKDOWN';
    await originalBus.save();

    // Update replacement bus status to IN_SERVICE
    replacementBus.status = 'IN_SERVICE';
    if (data.tripId) {
      replacementBus.currentAssignedTripId = new Types.ObjectId(data.tripId);
    }
    await replacementBus.save();

    // If trip exists, link replacement bus
    if (data.tripId) {
      await ScheduledTrip.findByIdAndUpdate(data.tripId, {
        busId: replacementBus._id
      });
    }

    const replacement = await VehicleReplacementRecord.create({
      ...data,
      authorizedBy,
      status: 'APPROVED',
      passengersTransferred: !!data.passengersTransferred,
      auditHistory: [
        {
          action: 'REPLACEMENT_AUTHORIZED',
          performedBy: authorizedBy,
          timestamp: new Date(),
          notes: `Replacement authorized for original bus ${originalBus.registrationNumber} with ${replacementBus.registrationNumber}`
        }
      ]
    });

    return replacement.toObject();
  }

  public async getVehicleReplacements(query: {
    page?: number;
    limit?: number;
    originalBusId?: string;
    replacementBusId?: string;
    status?: string;
    reason?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.originalBusId) filter.originalBusId = new Types.ObjectId(query.originalBusId);
    if (query.replacementBusId) filter.replacementBusId = new Types.ObjectId(query.replacementBusId);
    if (query.status) filter.status = query.status;
    if (query.reason) filter.reason = query.reason;

    const [total, data] = await Promise.all([
      VehicleReplacementRecord.countDocuments(filter),
      VehicleReplacementRecord.find(filter)
        .sort({ replacementTimestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getVehicleReplacementById(id: string) {
    const replacement = await VehicleReplacementRecord.findById(id).lean();
    if (!replacement) {
      throw new NotFoundError(`Vehicle replacement record with id '${id}' not found`);
    }
    return replacement;
  }

  public async updateReplacementStatus(
    id: string,
    data: {
      status: 'REQUESTED' | 'APPROVED' | 'DISPATCHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
      notes?: string;
      passengersTransferred?: boolean;
    },
    performedBy: string
  ) {
    const replacement = await VehicleReplacementRecord.findById(id);
    if (!replacement) {
      throw new NotFoundError(`Vehicle replacement record with id '${id}' not found`);
    }

    replacement.status = data.status;
    if (data.passengersTransferred !== undefined) {
      replacement.passengersTransferred = data.passengersTransferred;
    }

    replacement.auditHistory.push({
      action: `STATUS_CHANGED_TO_${data.status}`,
      performedBy,
      timestamp: new Date(),
      notes: data.notes
    });

    await replacement.save();
    return replacement.toObject();
  }

  // =========================================================================
  // 9. Phase 2: Depot Fleet, Backup Depots, Reserves & Transfers
  // =========================================================================

  public async getDepotBuses(
    depotId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      isReserveFleet?: boolean;
      vehicleType?: string;
      q?: string;
    }
  ): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const depot = await Depot.findById(depotId).lean();
    if (!depot) {
      throw new NotFoundError(`Depot with id '${depotId}' not found`);
    }

    const filter: Record<string, unknown> = {
      $or: [
        { depotId: new Types.ObjectId(depotId) },
        { depotName: depot.nameEn }
      ]
    };

    if (query.status) filter.status = query.status;
    if (query.isReserveFleet !== undefined) filter.isReserveFleet = query.isReserveFleet;
    if (query.vehicleType) filter.vehicleType = query.vehicleType;
    if (query.q) {
      filter.$and = [
        {
          $or: [
            { registrationNumber: { $regex: query.q, $options: 'i' } },
            { fleetNumber: { $regex: query.q, $options: 'i' } }
          ]
        }
      ];
    }

    const [total, data] = await Promise.all([
      Bus.countDocuments(filter),
      Bus.find(filter)
        .populate('assignedDriverId', 'fullName employeeId badgeNumber contactNumber')
        .populate('assignedConductorId', 'fullName employeeId badgeNumber contactNumber')
        .populate('assignedEtmDeviceId', 'deviceId deviceModel gpsAvailabilityStatus')
        .populate('assignedGpsTrackerId', 'deviceId deviceModel gpsAvailabilityStatus')
        .populate('currentAssignedTripId', 'tripCode departureTime arrivalTime')
        .sort({ fleetNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getBackupDepots(primaryDepotId: string): Promise<any> {
    const primaryDepot = await Depot.findById(primaryDepotId).lean();
    if (!primaryDepot) {
      throw new NotFoundError(`Primary depot with id '${primaryDepotId}' not found`);
    }

    const backupDepots = await Depot.find({
      primaryDepotId: new Types.ObjectId(primaryDepotId),
      depotType: 'BACKUP'
    }).lean();

    const results = await Promise.all(
      backupDepots.map(async (depot) => {
        const reserveBuses = await Bus.find({
          $or: [{ depotId: depot._id }, { depotName: depot.nameEn }],
          isReserveFleet: true
        }).lean();

        const availableReserveCount = reserveBuses.filter(
          (b) => b.status === 'RESERVED' && !b.currentAssignedTripId
        ).length;

        return {
          ...depot,
          totalReserveFleetCount: reserveBuses.length,
          availableReserveCount,
          reserveBuses: reserveBuses.map((b) => ({
            id: b._id,
            registrationNumber: b.registrationNumber,
            fleetNumber: b.fleetNumber,
            vehicleType: b.vehicleType,
            status: b.status,
            isAvailable: b.status === 'RESERVED' && !b.currentAssignedTripId
          }))
        };
      })
    );

    return {
      primaryDepot: {
        id: primaryDepot._id,
        code: primaryDepot.code,
        nameEn: primaryDepot.nameEn,
        nameTa: primaryDepot.nameTa
      },
      backupDepots: results
    };
  }

  public async reassignBackupDepot(backupDepotId: string, newPrimaryDepotId: string): Promise<any> {
    if (backupDepotId === newPrimaryDepotId) {
      throw new ValidationError('A backup depot cannot reference itself as its primary depot');
    }

    const [backupDepot, newPrimaryDepot] = await Promise.all([
      Depot.findById(backupDepotId),
      Depot.findById(newPrimaryDepotId).lean()
    ]);

    if (!backupDepot) {
      throw new NotFoundError(`Backup depot with id '${backupDepotId}' not found`);
    }
    if (!newPrimaryDepot) {
      throw new NotFoundError(`Primary depot with id '${newPrimaryDepotId}' not found`);
    }
    if (backupDepot.depotType !== 'BACKUP') {
      throw new ValidationError(`Depot '${backupDepot.code}' is not a BACKUP depot`);
    }
    if (backupDepot.organizationId.toString() !== newPrimaryDepot.organizationId.toString()) {
      throw new ValidationError('Backup depot and primary depot must belong to the same organization');
    }
    if (
      newPrimaryDepot.primaryDepotId &&
      newPrimaryDepot.primaryDepotId.toString() === backupDepotId
    ) {
      throw new ValidationError(
        'Circular depot relationship detected: Target primary depot already references this depot'
      );
    }

    backupDepot.primaryDepotId = new Types.ObjectId(newPrimaryDepotId);
    await backupDepot.save();
    return backupDepot.toObject();
  }

  public async updateDepotStatus(
    depotId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE'
  ): Promise<any> {
    const depot = await Depot.findById(depotId);
    if (!depot) {
      throw new NotFoundError(`Depot with id '${depotId}' not found`);
    }
    depot.status = status;
    await depot.save();
    return depot.toObject();
  }

  public async getReserveFleet(query: {
    page?: number;
    limit?: number;
    depotId?: string;
    status?: string;
    q?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      $or: [{ isReserveFleet: true }, { status: 'RESERVED' }]
    };

    if (query.depotId) filter.depotId = new Types.ObjectId(query.depotId);
    if (query.status) filter.status = query.status;
    if (query.q) {
      filter.$and = [
        {
          $or: [
            { registrationNumber: { $regex: query.q, $options: 'i' } },
            { fleetNumber: { $regex: query.q, $options: 'i' } }
          ]
        }
      ];
    }

    const [total, rawBuses] = await Promise.all([
      Bus.countDocuments(filter),
      Bus.find(filter)
        .populate('depotId', 'nameEn code depotType location')
        .populate('assignedGpsTrackerId', 'deviceId gpsAvailabilityStatus status')
        .populate('assignedEtmDeviceId', 'deviceId gpsAvailabilityStatus status')
        .populate('currentAssignedTripId', 'tripCode departureTime arrivalTime')
        .sort({ fleetNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const data = rawBuses.map((bus: any) => {
      const isUnderMaintenance = ['UNDER_MAINTENANCE', 'MAINTENANCE', 'BREAKDOWN'].includes(bus.status);
      const isAssignedTrip = !!bus.currentAssignedTripId;
      const isAvailableForDispatch = bus.status === 'RESERVED' && !isAssignedTrip && !isUnderMaintenance;

      let ineligibilityReason: string | undefined;
      if (isAssignedTrip) {
        ineligibilityReason = 'Assigned to active trip';
      } else if (isUnderMaintenance) {
        ineligibilityReason = `Vehicle is ${bus.status}`;
      } else if (bus.status !== 'RESERVED') {
        ineligibilityReason = `Status is ${bus.status}`;
      }

      return {
        ...bus,
        isAvailableForDispatch,
        ineligibilityReason
      };
    });

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async setBusReserveStatus(
    busId: string,
    isReserveFleet: boolean,
    _reason?: string
  ): Promise<any> {
    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new NotFoundError(`Bus with id '${busId}' not found`);
    }

    if (isReserveFleet) {
      if (bus.currentAssignedTripId) {
        throw new ValidationError('Cannot designate bus as reserve while it is assigned to an active trip');
      }
      if (['BREAKDOWN', 'UNDER_MAINTENANCE', 'MAINTENANCE'].includes(bus.status)) {
        throw new ValidationError(
          `Cannot designate bus as reserve while vehicle is ${bus.status}`
        );
      }
      bus.isReserveFleet = true;
      bus.status = 'RESERVED';
    } else {
      bus.isReserveFleet = false;
      bus.status = 'AVAILABLE';
    }

    await bus.save();
    return bus.toObject();
  }

  public async updateWorkshop(workshopId: string, updateData: Record<string, unknown>): Promise<any> {
    const workshop = await MaintenanceWorkshop.findById(workshopId);
    if (!workshop) {
      throw new NotFoundError(`Workshop with id '${workshopId}' not found`);
    }

    Object.assign(workshop, updateData);
    await workshop.save();
    return workshop.toObject();
  }

  public async requestDepotTransfer(
    data: {
      transferNumber: string;
      busId: string;
      fromDepotId: string;
      toDepotId: string;
      reason:
        | 'FLEET_REBALANCING'
        | 'MAINTENANCE_TRANSFER'
        | 'PERMANENT_REALLOCATION'
        | 'SEASONAL_DEMAND'
        | 'EMERGENCY_RELIEF'
        | 'OTHER';
      reasonDetails?: string;
      notes?: string;
    },
    requestedBy: string
  ): Promise<any> {
    if (data.fromDepotId === data.toDepotId) {
      throw new ValidationError('Source and destination depots cannot be the same depot');
    }

    const [existing, bus, fromDepot, toDepot] = await Promise.all([
      DepotTransfer.findOne({ transferNumber: data.transferNumber }).lean(),
      Bus.findById(data.busId),
      Depot.findById(data.fromDepotId).lean(),
      Depot.findById(data.toDepotId).lean()
    ]);

    if (existing) {
      throw new ConflictError(`Transfer with number '${data.transferNumber}' already exists`);
    }
    if (!bus) {
      throw new NotFoundError(`Bus with id '${data.busId}' not found`);
    }
    if (!fromDepot) {
      throw new NotFoundError(`Source depot with id '${data.fromDepotId}' not found`);
    }
    if (!toDepot) {
      throw new NotFoundError(`Destination depot with id '${data.toDepotId}' not found`);
    }

    if (bus.currentAssignedTripId || bus.status === 'IN_SERVICE') {
      throw new ValidationError(
        `Bus '${bus.registrationNumber}' is currently IN_SERVICE on a trip and cannot be transferred`
      );
    }
    if (
      ['BREAKDOWN', 'UNDER_MAINTENANCE', 'MAINTENANCE'].includes(bus.status) &&
      data.reason !== 'MAINTENANCE_TRANSFER'
    ) {
      throw new ValidationError(
        `Bus '${bus.registrationNumber}' is currently ${bus.status}. Only MAINTENANCE_TRANSFER is permitted`
      );
    }

    const activeTransfer = await DepotTransfer.findOne({
      busId: bus._id,
      status: { $in: ['REQUESTED', 'APPROVED', 'IN_TRANSIT'] }
    }).lean();

    if (activeTransfer) {
      throw new ConflictError(
        `Bus '${bus.registrationNumber}' already has an active transfer ('${activeTransfer.transferNumber}') in progress`
      );
    }

    const transfer = await DepotTransfer.create({
      ...data,
      requestedBy,
      status: 'REQUESTED',
      requestTimestamp: new Date(),
      auditHistory: [
        {
          action: 'TRANSFER_REQUESTED',
          performedBy: requestedBy,
          timestamp: new Date(),
          notes: data.notes || `Transfer requested from ${fromDepot.nameEn} to ${toDepot.nameEn}`
        }
      ]
    });

    return transfer.toObject();
  }

  public async approveDepotTransfer(transferId: string, approvedBy: string, notes?: string): Promise<any> {
    const transfer = await DepotTransfer.findById(transferId);
    if (!transfer) {
      throw new NotFoundError(`Transfer record with id '${transferId}' not found`);
    }
    if (transfer.status !== 'REQUESTED') {
      throw new ValidationError(`Cannot approve transfer in status '${transfer.status}'`);
    }

    transfer.status = 'APPROVED';
    transfer.approvedBy = approvedBy;
    transfer.approvalTimestamp = new Date();
    if (notes) transfer.notes = notes;
    transfer.auditHistory.push({
      action: 'TRANSFER_APPROVED',
      performedBy: approvedBy,
      timestamp: new Date(),
      notes
    });

    await transfer.save();
    return transfer.toObject();
  }

  public async rejectDepotTransfer(transferId: string, rejectedBy: string, notes?: string): Promise<any> {
    const transfer = await DepotTransfer.findById(transferId);
    if (!transfer) {
      throw new NotFoundError(`Transfer record with id '${transferId}' not found`);
    }
    if (transfer.status !== 'REQUESTED') {
      throw new ValidationError(`Cannot reject transfer in status '${transfer.status}'`);
    }

    transfer.status = 'REJECTED';
    transfer.rejectedBy = rejectedBy;
    if (notes) transfer.notes = notes;
    transfer.auditHistory.push({
      action: 'TRANSFER_REJECTED',
      performedBy: rejectedBy,
      timestamp: new Date(),
      notes
    });

    await transfer.save();
    return transfer.toObject();
  }

  public async startDepotTransferTransit(transferId: string, performedBy: string, notes?: string): Promise<any> {
    const transfer = await DepotTransfer.findById(transferId);
    if (!transfer) {
      throw new NotFoundError(`Transfer record with id '${transferId}' not found`);
    }
    if (transfer.status !== 'APPROVED') {
      throw new ValidationError(`Transfer must be in APPROVED status to begin transit (currently '${transfer.status}')`);
    }

    transfer.status = 'IN_TRANSIT';
    transfer.auditHistory.push({
      action: 'TRANSIT_STARTED',
      performedBy,
      timestamp: new Date(),
      notes
    });

    await transfer.save();
    return transfer.toObject();
  }

  public async completeDepotTransfer(transferId: string, completedBy: string, notes?: string): Promise<any> {
    const transfer = await DepotTransfer.findById(transferId);
    if (!transfer) {
      throw new NotFoundError(`Transfer record with id '${transferId}' not found`);
    }
    if (!['APPROVED', 'IN_TRANSIT'].includes(transfer.status)) {
      throw new ValidationError(`Cannot complete transfer in status '${transfer.status}'`);
    }

    const [bus, destinationDepot] = await Promise.all([
      Bus.findById(transfer.busId),
      Depot.findById(transfer.toDepotId).lean()
    ]);

    if (!bus) {
      throw new NotFoundError(`Bus with id '${transfer.busId}' not found`);
    }
    if (!destinationDepot) {
      throw new NotFoundError(`Destination depot with id '${transfer.toDepotId}' not found`);
    }

    bus.depotId = destinationDepot._id;
    bus.depotName = destinationDepot.nameEn;
    if (bus.status !== 'BREAKDOWN') {
      bus.status = bus.isReserveFleet ? 'RESERVED' : 'AVAILABLE';
    }
    await bus.save();

    transfer.status = 'COMPLETED';
    transfer.completedBy = completedBy;
    transfer.completionTimestamp = new Date();
    transfer.auditHistory.push({
      action: 'TRANSFER_COMPLETED',
      performedBy: completedBy,
      timestamp: new Date(),
      notes: notes || `Bus ${bus.registrationNumber} transferred to ${destinationDepot.nameEn}`
    });

    await transfer.save();
    return transfer.toObject();
  }

  public async cancelDepotTransfer(transferId: string, cancelledBy: string, notes?: string): Promise<any> {
    const transfer = await DepotTransfer.findById(transferId);
    if (!transfer) {
      throw new NotFoundError(`Transfer record with id '${transferId}' not found`);
    }
    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(transfer.status)) {
      throw new ValidationError(`Cannot cancel transfer in status '${transfer.status}'`);
    }

    transfer.status = 'CANCELLED';
    transfer.cancelledBy = cancelledBy;
    transfer.auditHistory.push({
      action: 'TRANSFER_CANCELLED',
      performedBy: cancelledBy,
      timestamp: new Date(),
      notes
    });

    await transfer.save();
    return transfer.toObject();
  }

  public async getDepotTransfers(query: {
    page?: number;
    limit?: number;
    busId?: string;
    fromDepotId?: string;
    toDepotId?: string;
    status?: string;
    reason?: string;
    q?: string;
  }): Promise<PaginatedResult<unknown>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.busId) filter.busId = new Types.ObjectId(query.busId);
    if (query.fromDepotId) filter.fromDepotId = new Types.ObjectId(query.fromDepotId);
    if (query.toDepotId) filter.toDepotId = new Types.ObjectId(query.toDepotId);
    if (query.status) filter.status = query.status;
    if (query.reason) filter.reason = query.reason;
    if (query.q) {
      filter.transferNumber = { $regex: query.q, $options: 'i' };
    }

    const [total, data] = await Promise.all([
      DepotTransfer.countDocuments(filter),
      DepotTransfer.find(filter)
        .populate('busId', 'registrationNumber fleetNumber vehicleType status isReserveFleet')
        .populate('fromDepotId', 'nameEn nameTa code depotType')
        .populate('toDepotId', 'nameEn nameTa code depotType')
        .sort({ requestTimestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  public async getDepotTransferById(transferId: string): Promise<any> {
    const transfer = await DepotTransfer.findById(transferId)
      .populate('busId')
      .populate('fromDepotId')
      .populate('toDepotId')
      .lean();

    if (!transfer) {
      throw new NotFoundError(`Depot transfer with id '${transferId}' not found`);
    }
    return transfer;
  }

  public async getDepotStats(depotId: string): Promise<any> {
    const depot = await Depot.findById(depotId).lean();
    if (!depot) {
      throw new NotFoundError(`Depot with id '${depotId}' not found`);
    }

    const depotObjId = new Types.ObjectId(depotId);

    const [
      totalBuses,
      availableBuses,
      inServiceBuses,
      reserveBuses,
      underMaintenanceBuses,
      breakdownBuses,
      activeTransfers
    ] = await Promise.all([
      Bus.countDocuments({
        $or: [{ depotId: depotObjId }, { depotName: depot.nameEn }]
      }),
      Bus.countDocuments({
        $or: [{ depotId: depotObjId }, { depotName: depot.nameEn }],
        status: 'AVAILABLE'
      }),
      Bus.countDocuments({
        $or: [{ depotId: depotObjId }, { depotName: depot.nameEn }],
        status: 'IN_SERVICE'
      }),
      Bus.countDocuments({
        $or: [{ depotId: depotObjId }, { depotName: depot.nameEn }],
        isReserveFleet: true
      }),
      Bus.countDocuments({
        $or: [{ depotId: depotObjId }, { depotName: depot.nameEn }],
        status: { $in: ['UNDER_MAINTENANCE', 'MAINTENANCE'] }
      }),
      Bus.countDocuments({
        $or: [{ depotId: depotObjId }, { depotName: depot.nameEn }],
        status: 'BREAKDOWN'
      }),
      DepotTransfer.countDocuments({
        $or: [{ fromDepotId: depotObjId }, { toDepotId: depotObjId }],
        status: { $in: ['REQUESTED', 'APPROVED', 'IN_TRANSIT'] }
      })
    ]);

    return {
      depot: {
        id: depot._id,
        code: depot.code,
        nameEn: depot.nameEn,
        nameTa: depot.nameTa,
        depotType: depot.depotType,
        totalCapacity: depot.totalCapacity,
        serviceBaysCount: depot.serviceBaysCount
      },
      stats: {
        totalBuses,
        availableBuses,
        inServiceBuses,
        reserveBuses,
        underMaintenanceBuses,
        breakdownBuses,
        activeTransfers
      }
    };
  }

  public async getGlobalTransportStats(): Promise<any> {
    const [
      totalBuses,
      availableBuses,
      inServiceBuses,
      reserveBuses,
      underMaintenanceBuses,
      breakdownBuses,
      activeTransfers,
      workshopsCount,
      activeMaintenanceRecords,
      totalDepotsCount,
      primaryDepotsCount,
      backupDepotsCount
    ] = await Promise.all([
      Bus.countDocuments({}),
      Bus.countDocuments({ status: 'AVAILABLE' }),
      Bus.countDocuments({ status: 'IN_SERVICE' }),
      Bus.countDocuments({ isReserveFleet: true }),
      Bus.countDocuments({ status: { $in: ['UNDER_MAINTENANCE', 'MAINTENANCE'] } }),
      Bus.countDocuments({ status: 'BREAKDOWN' }),
      DepotTransfer.countDocuments({ status: { $in: ['REQUESTED', 'APPROVED', 'IN_TRANSIT'] } }),
      MaintenanceWorkshop.countDocuments({ status: 'ACTIVE' }),
      MaintenanceRecord.countDocuments({
        repairStatus: { $in: ['REPORTED', 'TRIAGED', 'IN_PROGRESS', 'WAITING_FOR_PARTS'] }
      }),
      Depot.countDocuments({ status: 'ACTIVE' }),
      Depot.countDocuments({ depotType: 'PRIMARY', status: 'ACTIVE' }),
      Depot.countDocuments({ depotType: 'BACKUP', status: 'ACTIVE' })
    ]);

    return {
      fleet: {
        totalRegisteredBuses: totalBuses,
        availableBuses,
        busesInService: inServiceBuses,
        reserveBuses,
        busesUnderMaintenance: underMaintenanceBuses,
        breakdownBuses
      },
      operations: {
        totalDepots: totalDepotsCount,
        primaryDepots: primaryDepotsCount,
        backupDepots: backupDepotsCount,
        activeTransfers
      },
      workshops: {
        activeWorkshops: workshopsCount,
        workloadPendingMaintenance: activeMaintenanceRecords
      }
    };
  }
}

export const transportService = new TransportService();
