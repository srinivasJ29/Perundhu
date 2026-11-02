import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { Bus, CrewMember, DeviceRegistry, AssignmentRecord, Depot } from '../../src/models';
import { busService } from '../../src/modules/buses/bus.service';
import { crewService } from '../../src/modules/crew/crew.service';
import { deviceService } from '../../src/modules/devices/device.service';
import { ConflictError, ValidationError, NotFoundError } from '../../src/common/errors';

describe('Phase 3 — Fleet, Staff & Device Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Bus Fleet Management', () => {
    it('should reject creating a bus with duplicate registration number', async () => {
      vi.spyOn(Bus, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          registrationNumber: 'TN-58-N-1234',
          fleetNumber: 'MDU-001'
        })
      } as any);

      await expect(
        busService.createBus({
          registrationNumber: 'TN-58-N-1234',
          fleetNumber: 'MDU-999',
          depotName: 'Madurai Central Depot',
          vehicleType: 'ORDINARY_NON_AC',
          status: 'IN_SERVICE'
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should assign a bus to a valid active depot and create a BUS_DEPOT assignment record', async () => {
      const mockBusId = new Types.ObjectId();
      const mockDepotId = new Types.ObjectId();

      const mockBus: any = {
        _id: mockBusId,
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-001',
        depotName: 'Old Depot',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'AVAILABLE',
        isReserveFleet: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true)
      };

      const mockDepot: any = {
        _id: mockDepotId,
        nameEn: 'Madurai Central Depot',
        code: 'MDU-DEP-01',
        status: 'ACTIVE'
      };

      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus);
      vi.spyOn(Depot, 'findById').mockResolvedValue(mockDepot);
      vi.spyOn(AssignmentRecord, 'updateMany').mockResolvedValue({ modifiedCount: 1 } as any);
      vi.spyOn(AssignmentRecord, 'create').mockResolvedValue({ _id: new Types.ObjectId() } as any);

      const result = await busService.assignBusDepot(
        mockBusId.toString(),
        { depotId: mockDepotId.toString(), notes: 'Seasonal transfer' },
        'admin-user'
      );

      expect(mockBus.depotName).toBe('Madurai Central Depot');
      expect(mockBus.save).toHaveBeenCalled();
      expect(AssignmentRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentType: 'BUS_DEPOT',
          busId: mockBusId,
          depotId: mockDepotId,
          status: 'ACTIVE',
          assignedBy: 'admin-user'
        })
      );
      expect(result.depotName).toBe('Madurai Central Depot');
    });
  });

  describe('Driver & Conductor Management', () => {
    it('should reject creating driver with duplicate employeeId', async () => {
      vi.spyOn(CrewMember, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          employeeId: 'DRV-1001',
          badgeNumber: 'BDG-1001'
        })
      } as any);

      await expect(
        crewService.createDriver({
          employeeId: 'DRV-1001',
          badgeNumber: 'BDG-9999',
          fullName: 'Test Driver',
          organizationId: new Types.ObjectId().toString(),
          divisionId: new Types.ObjectId().toString(),
          depotId: new Types.ObjectId().toString(),
          status: 'AVAILABLE'
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should prevent updating driver status to ON_LEAVE if assigned to active trip', async () => {
      const mockDriver: any = {
        _id: new Types.ObjectId(),
        fullName: 'Sundaram P',
        role: 'DRIVER',
        status: 'ON_DUTY',
        currentAssignedTripId: new Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(CrewMember, 'findById').mockResolvedValue(mockDriver);

      await expect(
        crewService.updateCrewStatus(mockDriver._id.toString(), { status: 'ON_LEAVE' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Device Registry & Assignments', () => {
    it('should default ETM device gpsAvailabilityStatus to UNKNOWN', async () => {
      const mockDepotId = new Types.ObjectId();
      const mockDeviceId = 'ETM-MDU-999';

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: mockDepotId, nameEn: 'Depot 1' })
      } as any);

      const createdDevice: any = {
        _id: new Types.ObjectId(),
        deviceId: mockDeviceId,
        deviceCategory: 'ETM',
        gpsAvailabilityStatus: 'UNKNOWN',
        status: 'ACTIVE'
      };

      vi.spyOn(DeviceRegistry, 'create').mockResolvedValue(createdDevice as any);
      vi.spyOn(deviceService, 'getDeviceById').mockResolvedValue({
        id: createdDevice._id.toString(),
        deviceId: mockDeviceId,
        deviceCategory: 'ETM',
        manufacturer: 'Analogics',
        deviceModel: 'PR-3',
        gpsAvailabilityStatus: 'UNKNOWN',
        networkGenerations: ['4G'],
        status: 'ACTIVE',
        depotId: mockDepotId.toString(),
        isOnline: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const res = await deviceService.createEtm({
        deviceId: mockDeviceId,
        manufacturer: 'Analogics',
        deviceModel: 'PR-3',
        depotId: mockDepotId.toString()
      });

      expect(res.gpsAvailabilityStatus).toBe('UNKNOWN');
    });

    it('should reject assigning an ETM to a bus if the device is already assigned to another bus', async () => {
      const bus1Id = new Types.ObjectId();
      const bus2Id = new Types.ObjectId();
      const deviceId = new Types.ObjectId();

      const mockBus2: any = {
        _id: bus2Id,
        registrationNumber: 'TN-58-N-2002',
        save: vi.fn()
      };

      const mockDevice: any = {
        _id: deviceId,
        deviceId: 'ETM-001',
        deviceCategory: 'ETM',
        status: 'ACTIVE',
        currentAssignedBusId: bus1Id,
        save: vi.fn()
      };

      vi.spyOn(Bus, 'findById').mockImplementation(async (id: any) => {
        if (id.toString() === bus2Id.toString()) return mockBus2;
        if (id.toString() === bus1Id.toString()) return { registrationNumber: 'TN-58-N-1001' } as any;
        return null;
      });
      vi.spyOn(DeviceRegistry, 'findById').mockResolvedValue(mockDevice);
      vi.spyOn(AssignmentRecord, 'updateMany').mockResolvedValue({} as any);

      await expect(
        deviceService.assignBusEtm(
          { busId: bus2Id.toString(), deviceId: deviceId.toString() },
          'admin-user'
        )
      ).rejects.toThrow(ConflictError);
    });

    it('should pair an ETM to a conductor and create CONDUCTOR_ETM assignment record', async () => {
      const conductorId = new Types.ObjectId();
      const deviceId = new Types.ObjectId();

      const mockConductor: any = {
        _id: conductorId,
        fullName: 'Karthik R',
        role: 'CONDUCTOR',
        status: 'ACTIVE',
        save: vi.fn().mockResolvedValue(true)
      };

      const mockDevice: any = {
        _id: deviceId,
        deviceId: 'ETM-MDU-101',
        deviceCategory: 'ETM',
        status: 'ACTIVE',
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(CrewMember, 'findOne').mockResolvedValue(mockConductor);
      vi.spyOn(DeviceRegistry, 'findById').mockResolvedValue(mockDevice);
      vi.spyOn(AssignmentRecord, 'updateMany').mockResolvedValue({} as any);
      vi.spyOn(AssignmentRecord, 'create').mockResolvedValue({} as any);

      const res = await deviceService.assignConductorEtm(
        { conductorId: conductorId.toString(), deviceId: deviceId.toString() },
        'admin-user'
      );

      expect(res.success).toBe(true);
      expect(mockConductor.assignedEtmDeviceId).toEqual(deviceId);
      expect(mockDevice.currentAssignedCrewId).toEqual(conductorId);
      expect(AssignmentRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignmentType: 'CONDUCTOR_ETM',
          crewMemberId: conductorId,
          deviceId: deviceId,
          status: 'ACTIVE'
        })
      );
    });
  });
});
