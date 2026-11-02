import crypto from 'crypto';
import { FilterQuery, Types } from 'mongoose';
import { logger } from '../../common/logger';
import {
  DeviceRegistry,
  DeviceRegistryDocument,
  Bus,
  CrewMember,
  Depot,
  AssignmentRecord
} from '../../models';
import { NotFoundError, ConflictError, ValidationError } from '../../common/errors';
import { buildPaginationMeta, PaginatedResult } from '../../common/validation';
import {
  ListDevicesQuery,
  CreateEtmBody,
  UpdateEtmBody,
  CreateGpsTrackerBody,
  UpdateGpsTrackerBody,
  UpdateDeviceStatusBody,
  AssignBusEtmBody,
  AssignBusGpsBody,
  AssignConductorEtmBody,
  AssignDriverBusBody,
  ListAssignmentsQuery
} from './device.validation';

export interface DeviceDto {
  id: string;
  deviceId: string;
  deviceCategory: 'ETM' | 'GPS_TRACKER';
  manufacturer: string;
  deviceModel: string;
  serialNumber?: string;
  imei?: string;
  simIccid?: string;
  simPhoneNumber?: string;
  operatingSystem?: string;
  firmwareVersion?: string;
  gpsAvailabilityStatus: 'VERIFIED_AVAILABLE' | 'VERIFIED_UNAVAILABLE' | 'UNKNOWN';
  gpsVerificationStatus?: string;
  supportedProtocols?: string[];
  installationStatus?: string;
  networkGenerations: string[];
  status: string;
  healthStatus?: string;
  depotId: string;
  depot?: { id: string; nameEn: string; nameTa: string; code: string };
  currentAssignedBusId?: string;
  currentAssignedBus?: { id: string; registrationNumber: string; fleetNumber: string };
  currentAssignedCrewId?: string;
  currentAssignedCrew?: { id: string; fullName: string; employeeId: string; role: string };
  batteryHealthPercent?: number;
  lastHeartbeatAt?: string;
  lastCommunicationAt?: string;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FleetAndDeviceStatsDto {
  fleet: {
    totalRegisteredBuses: number;
    availableBuses: number;
    busesInService: number;
    reserveBuses: number;
    busesUnderMaintenance: number;
    breakdownBuses: number;
  };
  staff: {
    totalDrivers: number;
    activeDrivers: number;
    availableDrivers: number;
    totalConductors: number;
    activeConductors: number;
    availableConductors: number;
  };
  devices: {
    registeredEtmCount: number;
    gpsCapableEtmCount: number;
    unknownGpsEtmCount: number;
    dedicatedGpsTrackerCount: number;
    activeDevicesCount: number;
    faultyDevicesCount: number;
    offlineNotCommunicatingCount: number;
    communicationHealthThresholdMinutes: number;
  };
}

export class DeviceService {
  private readonly COMMUNICATION_THRESHOLD_MINUTES = 15;

  /**
   * Lists devices by category ('ETM' or 'GPS_TRACKER') with filters.
   */
  public async listDevices(query: ListDevicesQuery): Promise<PaginatedResult<DeviceDto>> {
    const { page, limit, deviceCategory, depotId, status, gpsAvailabilityStatus, q } = query;
    const filter: FilterQuery<DeviceRegistryDocument> = {};

    if (deviceCategory) filter.deviceCategory = deviceCategory;
    if (depotId) filter.depotId = new Types.ObjectId(depotId);
    if (status) filter.status = status;
    if (gpsAvailabilityStatus) filter.gpsAvailabilityStatus = gpsAvailabilityStatus;

    if (q && q.trim().length > 0) {
      const sanitizedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitizedQ, 'i');
      filter.$or = [
        { deviceId: regex },
        { manufacturer: regex },
        { deviceModel: regex },
        { serialNumber: regex }
      ];
    }

    const [total, docs] = await Promise.all([
      DeviceRegistry.countDocuments(filter),
      DeviceRegistry.find(filter)
        .sort({ deviceId: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('depotId', '_id nameEn nameTa code')
        .populate('currentAssignedBusId', '_id registrationNumber fleetNumber')
        .populate('currentAssignedCrewId', '_id fullName employeeId role')
        .lean()
    ]);

    const thresholdMs = this.COMMUNICATION_THRESHOLD_MINUTES * 60 * 1000;
    const now = Date.now();

    const data: DeviceDto[] = docs.map((doc: any) => {
      const commDate = doc.lastCommunicationAt || doc.lastHeartbeatAt;
      const isOnline = commDate ? now - new Date(commDate).getTime() < thresholdMs : false;

      return {
        id: doc._id.toString(),
        deviceId: doc.deviceId,
        deviceCategory: doc.deviceCategory,
        manufacturer: doc.manufacturer,
        deviceModel: doc.deviceModel,
        serialNumber: doc.serialNumber,
        imei: doc.imei,
        simIccid: doc.simIccid,
        simPhoneNumber: doc.simPhoneNumber,
        operatingSystem: doc.operatingSystem,
        firmwareVersion: doc.firmwareVersion,
        gpsAvailabilityStatus: doc.gpsAvailabilityStatus,
        gpsVerificationStatus: doc.gpsVerificationStatus,
        supportedProtocols: doc.supportedProtocols,
        installationStatus: doc.installationStatus,
        networkGenerations: doc.networkGenerations,
        status: doc.status,
        healthStatus: doc.healthStatus,
        depotId: doc.depotId ? (doc.depotId._id ? doc.depotId._id.toString() : doc.depotId.toString()) : '',
        depot: doc.depotId && typeof doc.depotId === 'object'
          ? {
              id: doc.depotId._id.toString(),
              nameEn: doc.depotId.nameEn,
              nameTa: doc.depotId.nameTa,
              code: doc.depotId.code
            }
          : undefined,
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
        currentAssignedCrewId: doc.currentAssignedCrewId
          ? (doc.currentAssignedCrewId._id ? doc.currentAssignedCrewId._id.toString() : doc.currentAssignedCrewId.toString())
          : undefined,
        currentAssignedCrew: doc.currentAssignedCrewId && typeof doc.currentAssignedCrewId === 'object'
          ? {
              id: doc.currentAssignedCrewId._id.toString(),
              fullName: doc.currentAssignedCrewId.fullName,
              employeeId: doc.currentAssignedCrewId.employeeId,
              role: doc.currentAssignedCrewId.role
            }
          : undefined,
        batteryHealthPercent: doc.batteryHealthPercent,
        lastHeartbeatAt: doc.lastHeartbeatAt ? doc.lastHeartbeatAt.toISOString() : undefined,
        lastCommunicationAt: commDate ? new Date(commDate).toISOString() : undefined,
        isOnline,
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
   * Retrieves single device document.
   */
  public async getDeviceById(id: string): Promise<DeviceDto> {
    const doc: any = await DeviceRegistry.findById(new Types.ObjectId(id))
      .populate('depotId', '_id nameEn nameTa code')
      .populate('currentAssignedBusId', '_id registrationNumber fleetNumber vehicleType status')
      .populate('currentAssignedCrewId', '_id fullName employeeId role contactNumber')
      .lean();

    if (!doc) {
      throw new NotFoundError(`Device with ID '${id}' not found`);
    }

    const thresholdMs = this.COMMUNICATION_THRESHOLD_MINUTES * 60 * 1000;
    const now = Date.now();
    const commDate = doc.lastCommunicationAt || doc.lastHeartbeatAt;
    const isOnline = commDate ? now - new Date(commDate).getTime() < thresholdMs : false;

    return {
      id: doc._id.toString(),
      deviceId: doc.deviceId,
      deviceCategory: doc.deviceCategory,
      manufacturer: doc.manufacturer,
      deviceModel: doc.deviceModel,
      serialNumber: doc.serialNumber,
      imei: doc.imei,
      simIccid: doc.simIccid,
      simPhoneNumber: doc.simPhoneNumber,
      operatingSystem: doc.operatingSystem,
      firmwareVersion: doc.firmwareVersion,
      gpsAvailabilityStatus: doc.gpsAvailabilityStatus,
      gpsVerificationStatus: doc.gpsVerificationStatus,
      supportedProtocols: doc.supportedProtocols,
      installationStatus: doc.installationStatus,
      networkGenerations: doc.networkGenerations,
      status: doc.status,
      healthStatus: doc.healthStatus,
      depotId: doc.depotId ? (doc.depotId._id ? doc.depotId._id.toString() : doc.depotId.toString()) : '',
      depot: doc.depotId && typeof doc.depotId === 'object'
        ? {
            id: doc.depotId._id.toString(),
            nameEn: doc.depotId.nameEn,
            nameTa: doc.depotId.nameTa,
            code: doc.depotId.code
          }
        : undefined,
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
      currentAssignedCrewId: doc.currentAssignedCrewId
        ? (doc.currentAssignedCrewId._id ? doc.currentAssignedCrewId._id.toString() : doc.currentAssignedCrewId.toString())
        : undefined,
      currentAssignedCrew: doc.currentAssignedCrewId && typeof doc.currentAssignedCrewId === 'object'
        ? {
            id: doc.currentAssignedCrewId._id.toString(),
            fullName: doc.currentAssignedCrewId.fullName,
            employeeId: doc.currentAssignedCrewId.employeeId,
            role: doc.currentAssignedCrewId.role
          }
        : undefined,
      batteryHealthPercent: doc.batteryHealthPercent,
      lastHeartbeatAt: doc.lastHeartbeatAt ? doc.lastHeartbeatAt.toISOString() : undefined,
      lastCommunicationAt: commDate ? new Date(commDate).toISOString() : undefined,
      isOnline,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    };
  }

  /**
   * Registers a new ETM device.
   */
  public async createEtm(data: CreateEtmBody): Promise<DeviceDto> {
    await this.validateUniqueDevice(data.deviceId);

    const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
    if (!depot) {
      throw new ValidationError(`Depot with ID '${data.depotId}' not found`);
    }

    const doc = await DeviceRegistry.create({
      deviceId: data.deviceId,
      deviceCategory: 'ETM',
      manufacturer: data.manufacturer,
      deviceModel: data.deviceModel,
      serialNumber: data.serialNumber,
      depotId: new Types.ObjectId(data.depotId),
      gpsAvailabilityStatus: data.gpsAvailabilityStatus || 'UNKNOWN',
      gpsVerificationStatus: data.gpsAvailabilityStatus === 'VERIFIED_AVAILABLE'
        ? 'VERIFIED_BENCH_TEST'
        : 'PENDING_INSPECTION',
      operatingSystem: data.operatingSystem || 'UNKNOWN',
      firmwareVersion: data.firmwareVersion,
      simIccid: data.simIccid,
      simPhoneNumber: data.simPhoneNumber,
      networkGenerations: data.networkGenerations || ['4G'],
      status: data.status || 'ACTIVE',
      healthStatus: 'HEALTHY'
    });

    return this.getDeviceById(doc._id.toString());
  }

  /**
   * Updates an existing ETM device.
   */
  public async updateEtm(id: string, data: UpdateEtmBody): Promise<DeviceDto> {
    const doc = await DeviceRegistry.findOne({ _id: new Types.ObjectId(id), deviceCategory: 'ETM' });
    if (!doc) {
      throw new NotFoundError(`ETM device with ID '${id}' not found`);
    }

    if (data.manufacturer !== undefined) doc.manufacturer = data.manufacturer;
    if (data.deviceModel !== undefined) doc.deviceModel = data.deviceModel;
    if (data.serialNumber !== undefined) doc.serialNumber = data.serialNumber;
    if (data.operatingSystem !== undefined) doc.operatingSystem = data.operatingSystem;
    if (data.firmwareVersion !== undefined) doc.firmwareVersion = data.firmwareVersion;
    if (data.gpsAvailabilityStatus !== undefined) doc.gpsAvailabilityStatus = data.gpsAvailabilityStatus;
    if (data.gpsVerificationStatus !== undefined) doc.gpsVerificationStatus = data.gpsVerificationStatus;
    if (data.status !== undefined) doc.status = data.status;

    if (data.depotId) {
      const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
      if (!depot) throw new ValidationError(`Depot '${data.depotId}' not found`);
      doc.depotId = depot._id;
    }

    await doc.save();
    return this.getDeviceById(doc._id.toString());
  }

  /**
   * Registers a dedicated GPS tracker.
   */
  public async createGpsTracker(data: CreateGpsTrackerBody): Promise<DeviceDto> {
    await this.validateUniqueDevice(data.deviceId);

    const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
    if (!depot) {
      throw new ValidationError(`Depot with ID '${data.depotId}' not found`);
    }

    const doc = await DeviceRegistry.create({
      deviceId: data.deviceId,
      deviceCategory: 'GPS_TRACKER',
      manufacturer: data.manufacturer,
      deviceModel: data.deviceModel,
      serialNumber: data.serialNumber,
      depotId: new Types.ObjectId(data.depotId),
      gpsAvailabilityStatus: 'VERIFIED_AVAILABLE',
      gpsVerificationStatus: 'OPERATIONAL_CONFIRMED',
      supportedProtocols: data.supportedProtocols || ['HTTP', 'HTTPS', 'MQTT', 'TCP'],
      networkGenerations: data.networkGenerations || ['4G'],
      installationStatus: data.installationStatus || 'UNINSTALLED',
      status: data.status || 'ACTIVE',
      healthStatus: 'HEALTHY'
    });

    return this.getDeviceById(doc._id.toString());
  }

  /**
   * Updates an existing GPS tracker.
   */
  public async updateGpsTracker(id: string, data: UpdateGpsTrackerBody): Promise<DeviceDto> {
    const doc = await DeviceRegistry.findOne({ _id: new Types.ObjectId(id), deviceCategory: 'GPS_TRACKER' });
    if (!doc) {
      throw new NotFoundError(`GPS Tracker with ID '${id}' not found`);
    }

    if (data.manufacturer !== undefined) doc.manufacturer = data.manufacturer;
    if (data.deviceModel !== undefined) doc.deviceModel = data.deviceModel;
    if (data.serialNumber !== undefined) doc.serialNumber = data.serialNumber;
    if (data.supportedProtocols !== undefined) doc.supportedProtocols = data.supportedProtocols;
    if (data.installationStatus !== undefined) doc.installationStatus = data.installationStatus as any;
    if (data.status !== undefined) doc.status = data.status;

    if (data.depotId) {
      const depot = await Depot.findById(new Types.ObjectId(data.depotId)).lean();
      if (!depot) throw new ValidationError(`Depot '${data.depotId}' not found`);
      doc.depotId = depot._id;
    }

    await doc.save();
    return this.getDeviceById(doc._id.toString());
  }

  /**
   * Updates device operational status.
   */
  public async updateDeviceStatus(id: string, body: UpdateDeviceStatusBody): Promise<DeviceDto> {
    const doc = await DeviceRegistry.findById(new Types.ObjectId(id));
    if (!doc) {
      throw new NotFoundError(`Device with ID '${id}' not found`);
    }

    doc.status = body.status;
    if (body.status === 'FAULTY') {
      doc.healthStatus = 'CRITICAL';
    } else if (body.status === 'ACTIVE') {
      doc.healthStatus = 'HEALTHY';
    }

    await doc.save();
    return this.getDeviceById(doc._id.toString());
  }

  // -------------------------------------------------------------------------
  // Assignment Operations
  // -------------------------------------------------------------------------

  /**
   * Assigns or unassigns an ETM device to/from a Bus.
   */
  public async assignBusEtm(data: AssignBusEtmBody, assignedBy: string): Promise<any> {
    const busObjectId = new Types.ObjectId(data.busId);
    const bus = await Bus.findById(busObjectId);
    if (!bus) throw new NotFoundError(`Bus with ID '${data.busId}' not found`);

    // Supersede any active BUS_ETM assignment for this bus
    await AssignmentRecord.updateMany(
      { busId: bus._id, assignmentType: 'BUS_ETM', status: 'ACTIVE' },
      { status: 'SUPERSEDED', unassignedAt: new Date(), unassignedBy: assignedBy }
    );

    if (data.deviceId) {
      const deviceObjectId = new Types.ObjectId(data.deviceId);
      const device = await DeviceRegistry.findById(deviceObjectId);
      if (!device) throw new NotFoundError(`Device '${data.deviceId}' not found`);
      if (device.deviceCategory !== 'ETM') {
        throw new ValidationError(`Device '${device.deviceId}' is not an ETM machine`);
      }
      if (device.status !== 'ACTIVE' && device.status !== 'STANDBY') {
        throw new ValidationError(`Cannot assign inactive ETM device (status: ${device.status})`);
      }

      // Check if device is already actively assigned to another bus
      if (device.currentAssignedBusId && device.currentAssignedBusId.toString() !== bus._id.toString()) {
        const otherBus = await Bus.findById(device.currentAssignedBusId);
        throw new ConflictError(
          `ETM '${device.deviceId}' is already assigned to bus ${otherBus?.registrationNumber || device.currentAssignedBusId}`
        );
      }

      // Unassign device from any other bus
      await Bus.updateMany(
        { assignedEtmDeviceId: device._id, _id: { $ne: bus._id } },
        { assignedEtmDeviceId: undefined }
      );

      // Create new assignment record
      await AssignmentRecord.create({
        assignmentType: 'BUS_ETM',
        busId: bus._id,
        deviceId: device._id,
        status: 'ACTIVE',
        assignedAt: new Date(),
        assignedBy,
        notes: data.notes || `Assigned ETM ${device.deviceId} to ${bus.registrationNumber}`
      });

      bus.assignedEtmDeviceId = device._id;
      device.currentAssignedBusId = bus._id;
      await Promise.all([bus.save(), device.save()]);
    } else {
      // Unassign
      if (bus.assignedEtmDeviceId) {
        await DeviceRegistry.findByIdAndUpdate(bus.assignedEtmDeviceId, {
          currentAssignedBusId: undefined
        });
      }
      bus.assignedEtmDeviceId = undefined;
      await bus.save();
    }

    return { success: true, busId: bus._id.toString(), assignedEtmDeviceId: bus.assignedEtmDeviceId?.toString() };
  }

  /**
   * Assigns or unassigns a dedicated GPS tracker to/from a Bus.
   */
  public async assignBusGps(data: AssignBusGpsBody, assignedBy: string): Promise<any> {
    const busObjectId = new Types.ObjectId(data.busId);
    const bus = await Bus.findById(busObjectId);
    if (!bus) throw new NotFoundError(`Bus with ID '${data.busId}' not found`);

    // Supersede any active BUS_GPS assignment for this bus
    await AssignmentRecord.updateMany(
      { busId: bus._id, assignmentType: 'BUS_GPS', status: 'ACTIVE' },
      { status: 'SUPERSEDED', unassignedAt: new Date(), unassignedBy: assignedBy }
    );

    if (data.deviceId) {
      const deviceObjectId = new Types.ObjectId(data.deviceId);
      const device = await DeviceRegistry.findById(deviceObjectId);
      if (!device) throw new NotFoundError(`Device '${data.deviceId}' not found`);
      if (device.deviceCategory !== 'GPS_TRACKER') {
        throw new ValidationError(`Device '${device.deviceId}' is not a dedicated GPS tracker`);
      }
      if (device.status !== 'ACTIVE' && device.status !== 'STANDBY') {
        throw new ValidationError(`Cannot assign inactive GPS tracker (status: ${device.status})`);
      }

      if (device.currentAssignedBusId && device.currentAssignedBusId.toString() !== bus._id.toString()) {
        const otherBus = await Bus.findById(device.currentAssignedBusId);
        throw new ConflictError(
          `GPS Tracker '${device.deviceId}' is already assigned to bus ${otherBus?.registrationNumber || device.currentAssignedBusId}`
        );
      }

      // Unassign tracker from any other bus
      await Bus.updateMany(
        { assignedGpsTrackerId: device._id, _id: { $ne: bus._id } },
        { assignedGpsTrackerId: undefined }
      );

      await AssignmentRecord.create({
        assignmentType: 'BUS_GPS',
        busId: bus._id,
        deviceId: device._id,
        status: 'ACTIVE',
        assignedAt: new Date(),
        assignedBy,
        notes: data.notes || `Assigned GPS tracker ${device.deviceId} to ${bus.registrationNumber}`
      });

      bus.assignedGpsTrackerId = device._id;
      device.currentAssignedBusId = bus._id;
      device.installationStatus = 'INSTALLED';
      await Promise.all([bus.save(), device.save()]);
    } else {
      // Unassign
      if (bus.assignedGpsTrackerId) {
        await DeviceRegistry.findByIdAndUpdate(bus.assignedGpsTrackerId, {
          currentAssignedBusId: undefined,
          installationStatus: 'UNINSTALLED'
        });
      }
      bus.assignedGpsTrackerId = undefined;
      await bus.save();
    }

    return { success: true, busId: bus._id.toString(), assignedGpsTrackerId: bus.assignedGpsTrackerId?.toString() };
  }

  /**
   * Assigns or unassigns an ETM device to/from a Conductor.
   */
  public async assignConductorEtm(data: AssignConductorEtmBody, assignedBy: string): Promise<any> {
    const conductorObjectId = new Types.ObjectId(data.conductorId);
    const conductor = await CrewMember.findOne({ _id: conductorObjectId, role: 'CONDUCTOR' });
    if (!conductor) throw new NotFoundError(`Conductor with ID '${data.conductorId}' not found`);

    // Supersede active CONDUCTOR_ETM assignments
    await AssignmentRecord.updateMany(
      { crewMemberId: conductor._id, assignmentType: 'CONDUCTOR_ETM', status: 'ACTIVE' },
      { status: 'SUPERSEDED', unassignedAt: new Date(), unassignedBy: assignedBy }
    );

    if (data.deviceId) {
      const deviceObjectId = new Types.ObjectId(data.deviceId);
      const device = await DeviceRegistry.findById(deviceObjectId);
      if (!device) throw new NotFoundError(`Device '${data.deviceId}' not found`);
      if (device.deviceCategory !== 'ETM') {
        throw new ValidationError(`Device '${device.deviceId}' is not an ETM`);
      }
      if (device.status !== 'ACTIVE' && device.status !== 'STANDBY') {
        throw new ValidationError(`Cannot assign inactive ETM device (status: ${device.status})`);
      }

      await AssignmentRecord.create({
        assignmentType: 'CONDUCTOR_ETM',
        crewMemberId: conductor._id,
        deviceId: device._id,
        status: 'ACTIVE',
        assignedAt: new Date(),
        assignedBy,
        notes: data.notes || `Paired ETM ${device.deviceId} with conductor ${conductor.fullName}`
      });

      conductor.assignedEtmDeviceId = device._id;
      device.currentAssignedCrewId = conductor._id;
      await Promise.all([conductor.save(), device.save()]);
    } else {
      if (conductor.assignedEtmDeviceId) {
        await DeviceRegistry.findByIdAndUpdate(conductor.assignedEtmDeviceId, {
          currentAssignedCrewId: undefined
        });
      }
      conductor.assignedEtmDeviceId = undefined;
      await conductor.save();
    }

    return {
      success: true,
      conductorId: conductor._id.toString(),
      assignedEtmDeviceId: conductor.assignedEtmDeviceId?.toString()
    };
  }

  /**
   * Assigns or unassigns a Driver to/from a Bus.
   */
  public async assignDriverBus(data: AssignDriverBusBody, assignedBy: string): Promise<any> {
    const driverObjectId = new Types.ObjectId(data.driverId);
    const driver = await CrewMember.findOne({ _id: driverObjectId, role: 'DRIVER' });
    if (!driver) throw new NotFoundError(`Driver with ID '${data.driverId}' not found`);

    if (data.busId) {
      if (driver.status === 'ON_LEAVE' || driver.status === 'INACTIVE' || driver.status === 'SUSPENDED') {
        throw new ValidationError(`Cannot assign driver with status '${driver.status}' to a bus`);
      }

      const busObjectId = new Types.ObjectId(data.busId);
      const bus = await Bus.findById(busObjectId);
      if (!bus) throw new NotFoundError(`Bus with ID '${data.busId}' not found`);

      // Check if driver is already assigned to active scheduled trip
      if (driver.currentAssignedTripId) {
        throw new ConflictError(
          `Driver '${driver.fullName}' is currently operating active trip. Complete trip before reassigning bus.`
        );
      }

      // Supersede previous DRIVER_BUS assignments for this driver and this bus
      await AssignmentRecord.updateMany(
        {
          $or: [{ crewMemberId: driver._id }, { busId: bus._id }],
          assignmentType: 'DRIVER_BUS',
          status: 'ACTIVE'
        },
        { status: 'SUPERSEDED', unassignedAt: new Date(), unassignedBy: assignedBy }
      );

      // Unassign driver from prior bus
      if (driver.currentAssignedBusId && driver.currentAssignedBusId.toString() !== bus._id.toString()) {
        await Bus.findByIdAndUpdate(driver.currentAssignedBusId, { assignedDriverId: undefined });
      }

      await AssignmentRecord.create({
        assignmentType: 'DRIVER_BUS',
        crewMemberId: driver._id,
        busId: bus._id,
        status: 'ACTIVE',
        assignedAt: new Date(),
        assignedBy,
        notes: data.notes || `Assigned driver ${driver.fullName} to bus ${bus.registrationNumber}`
      });

      driver.currentAssignedBusId = bus._id;
      driver.status = 'ASSIGNED';
      bus.assignedDriverId = driver._id;
      await Promise.all([driver.save(), bus.save()]);
    } else {
      // Unassign driver from bus
      if (driver.currentAssignedBusId) {
        await Bus.findByIdAndUpdate(driver.currentAssignedBusId, { assignedDriverId: undefined });
      }
      driver.currentAssignedBusId = undefined;
      driver.status = 'AVAILABLE';
      await driver.save();
    }

    return {
      success: true,
      driverId: driver._id.toString(),
      currentAssignedBusId: driver.currentAssignedBusId?.toString()
    };
  }

  /**
   * Lists assignment records from the audit ledger.
   */
  public async listAssignments(query: ListAssignmentsQuery): Promise<PaginatedResult<any>> {
    const { page, limit, assignmentType, busId, deviceId, crewMemberId, depotId, status } = query;
    const filter: FilterQuery<any> = {};

    if (assignmentType) filter.assignmentType = assignmentType;
    if (busId) filter.busId = new Types.ObjectId(busId);
    if (deviceId) filter.deviceId = new Types.ObjectId(deviceId);
    if (crewMemberId) filter.crewMemberId = new Types.ObjectId(crewMemberId);
    if (depotId) filter.depotId = new Types.ObjectId(depotId);
    if (status) filter.status = status;

    const [total, docs] = await Promise.all([
      AssignmentRecord.countDocuments(filter),
      AssignmentRecord.find(filter)
        .sort({ assignedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('busId', 'registrationNumber fleetNumber vehicleType')
        .populate('deviceId', 'deviceId deviceModel deviceCategory status')
        .populate('crewMemberId', 'fullName employeeId badgeNumber role')
        .populate('depotId', 'nameEn code')
        .lean()
    ]);

    const data = docs.map((doc: any) => ({
      id: doc._id.toString(),
      assignmentType: doc.assignmentType,
      status: doc.status,
      assignedAt: doc.assignedAt.toISOString(),
      unassignedAt: doc.unassignedAt ? doc.unassignedAt.toISOString() : undefined,
      assignedBy: doc.assignedBy,
      unassignedBy: doc.unassignedBy,
      notes: doc.notes,
      bus: doc.busId
        ? {
            id: doc.busId._id.toString(),
            registrationNumber: doc.busId.registrationNumber,
            fleetNumber: doc.busId.fleetNumber
          }
        : undefined,
      device: doc.deviceId
        ? {
            id: doc.deviceId._id.toString(),
            deviceId: doc.deviceId.deviceId,
            deviceModel: doc.deviceId.deviceModel,
            deviceCategory: doc.deviceId.deviceCategory
          }
        : undefined,
      crewMember: doc.crewMemberId
        ? {
            id: doc.crewMemberId._id.toString(),
            fullName: doc.crewMemberId.fullName,
            employeeId: doc.crewMemberId.employeeId,
            role: doc.crewMemberId.role
          }
        : undefined,
      depot: doc.depotId
        ? {
            id: doc.depotId._id.toString(),
            nameEn: doc.depotId.nameEn,
            code: doc.depotId.code
          }
        : undefined
    }));

    return {
      data,
      pagination: buildPaginationMeta(total, page, limit)
    };
  }

  /**
   * Aggregates fleet, crew, and device monitoring statistics.
   */
  public async getFleetAndDeviceMonitoringStats(): Promise<FleetAndDeviceStatsDto> {
    const thresholdMs = this.COMMUNICATION_THRESHOLD_MINUTES * 60 * 1000;
    const cutoffDate = new Date(Date.now() - thresholdMs);

    const [
      totalRegisteredBuses,
      availableBuses,
      busesInService,
      reserveBuses,
      busesUnderMaintenance,
      breakdownBuses,
      totalDrivers,
      activeDrivers,
      availableDrivers,
      totalConductors,
      activeConductors,
      availableConductors,
      registeredEtmCount,
      gpsCapableEtmCount,
      unknownGpsEtmCount,
      dedicatedGpsTrackerCount,
      activeDevicesCount,
      faultyDevicesCount,
      offlineNotCommunicatingCount
    ] = await Promise.all([
      Bus.countDocuments({ isActive: true }),
      Bus.countDocuments({ isActive: true, status: 'AVAILABLE' }),
      Bus.countDocuments({ isActive: true, status: 'IN_SERVICE' }),
      Bus.countDocuments({ isActive: true, isReserveFleet: true }),
      Bus.countDocuments({
        isActive: true,
        status: { $in: ['MAINTENANCE', 'UNDER_MAINTENANCE'] }
      }),
      Bus.countDocuments({ isActive: true, status: 'BREAKDOWN' }),
      CrewMember.countDocuments({ role: 'DRIVER', isActive: true }),
      CrewMember.countDocuments({
        role: 'DRIVER',
        isActive: true,
        status: { $in: ['ACTIVE', 'ASSIGNED', 'ON_DUTY'] }
      }),
      CrewMember.countDocuments({ role: 'DRIVER', isActive: true, status: 'AVAILABLE' }),
      CrewMember.countDocuments({ role: 'CONDUCTOR', isActive: true }),
      CrewMember.countDocuments({
        role: 'CONDUCTOR',
        isActive: true,
        status: { $in: ['ACTIVE', 'ASSIGNED', 'ON_DUTY'] }
      }),
      CrewMember.countDocuments({ role: 'CONDUCTOR', isActive: true, status: 'AVAILABLE' }),
      DeviceRegistry.countDocuments({ deviceCategory: 'ETM' }),
      DeviceRegistry.countDocuments({ deviceCategory: 'ETM', gpsAvailabilityStatus: 'VERIFIED_AVAILABLE' }),
      DeviceRegistry.countDocuments({ deviceCategory: 'ETM', gpsAvailabilityStatus: 'UNKNOWN' }),
      DeviceRegistry.countDocuments({ deviceCategory: 'GPS_TRACKER' }),
      DeviceRegistry.countDocuments({ status: 'ACTIVE' }),
      DeviceRegistry.countDocuments({ status: 'FAULTY' }),
      DeviceRegistry.countDocuments({
        $or: [
          { lastCommunicationAt: { $lt: cutoffDate } },
          { lastCommunicationAt: null, lastHeartbeatAt: null }
        ]
      })
    ]);

    return {
      fleet: {
        totalRegisteredBuses,
        availableBuses,
        busesInService,
        reserveBuses,
        busesUnderMaintenance,
        breakdownBuses
      },
      staff: {
        totalDrivers,
        activeDrivers,
        availableDrivers,
        totalConductors,
        activeConductors,
        availableConductors
      },
      devices: {
        registeredEtmCount,
        gpsCapableEtmCount,
        unknownGpsEtmCount,
        dedicatedGpsTrackerCount,
        activeDevicesCount,
        faultyDevicesCount,
        offlineNotCommunicatingCount,
        communicationHealthThresholdMinutes: this.COMMUNICATION_THRESHOLD_MINUTES
      }
    };
  }

  private async validateUniqueDevice(deviceId: string): Promise<void> {
    const existing = await DeviceRegistry.findOne({ deviceId }).lean();
    if (existing) {
      throw new ConflictError(`Device with ID '${deviceId}' is already registered`);
    }
  }

  /**
   * Rotates credentials for a registered hardware device:
   * Generates a cryptographically strong 32-byte hexadecimal secret,
   * stores the SHA-256 hash in DeviceRegistry.apiKeyHash,
   * and returns the plaintext key ONCE for authorized provisioning.
   */
  public async rotateDeviceCredentials(
    idOrDeviceId: string
  ): Promise<{ deviceId: string; apiKey: string; rotatedAt: Date }> {
    const isObjectId = Types.ObjectId.isValid(idOrDeviceId);
    const filter: FilterQuery<DeviceRegistryDocument> = isObjectId
      ? { _id: idOrDeviceId }
      : { deviceId: idOrDeviceId.trim().toUpperCase() };

    const device = await DeviceRegistry.findOne(filter);
    if (!device) {
      throw new NotFoundError(`Device '${idOrDeviceId}' was not found`);
    }

    if (device.status === 'DECOMMISSIONED') {
      throw new ConflictError(`Cannot rotate credentials for DECOMMISSIONED device '${device.deviceId}'`);
    }

    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const now = new Date();

    device.apiKeyHash = apiKeyHash;
    await device.save();

    logger.info({ deviceId: device.deviceId }, 'Device credentials rotated successfully');

    return {
      deviceId: device.deviceId,
      apiKey,
      rotatedAt: now
    };
  }
}

export const deviceService = new DeviceService();
