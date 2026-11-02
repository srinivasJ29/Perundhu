import { describe, it, expect, vi } from 'vitest';
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
  Bus
} from '../../src/models';

describe('Transport Infrastructure Foundation (Unit Tests)', () => {
  // =========================================================================
  // 1. Transport Organization
  // =========================================================================
  describe('TransportOrganization Model', () => {
    it('should validate a valid transport organization', () => {
      const org = new TransportOrganization({
        name: 'Tamil Nadu State Transport Corporation',
        code: 'tnstc',
        shortName: 'TNSTC',
        status: 'ACTIVE'
      });

      const err = org.validateSync();
      expect(err).toBeUndefined();
      expect(org.code).toBe('TNSTC');
    });

    it('should fail when required fields are missing', () => {
      const org = new TransportOrganization({});
      const err = org.validateSync();
      expect(err?.errors['name']).toBeDefined();
      expect(err?.errors['code']).toBeDefined();
    });

    it('should reject invalid status enum', () => {
      const org = new TransportOrganization({
        name: 'TNSTC',
        code: 'TNSTC',
        status: 'TERMINATED' as any
      });
      const err = org.validateSync();
      expect(err?.errors['status']).toBeDefined();
    });
  });

  // =========================================================================
  // 2. Transport Division
  // =========================================================================
  describe('TransportDivision Model', () => {
    it('should validate a valid transport division', () => {
      const division = new TransportDivision({
        organizationId: new Types.ObjectId(),
        name: 'Madurai Division',
        code: 'mdu-div',
        status: 'ACTIVE'
      });

      const err = division.validateSync();
      expect(err).toBeUndefined();
      expect(division.code).toBe('MDU-DIV');
    });

    it('should fail when organizationId is missing', () => {
      const division = new TransportDivision({
        name: 'Madurai Division',
        code: 'MDU-DIV'
      });
      const err = division.validateSync();
      expect(err?.errors['organizationId']).toBeDefined();
    });
  });

  // =========================================================================
  // 3. Depot Model
  // =========================================================================
  describe('Depot Model', () => {
    it('should validate a valid PRIMARY depot with 2dsphere index', () => {
      const depot = new Depot({
        organizationId: new Types.ObjectId(),
        divisionId: new Types.ObjectId(),
        code: 'mdu-cen',
        nameEn: 'Madurai Central Depot',
        nameTa: 'மதுரை மத்திய பணிமனை',
        depotType: 'PRIMARY',
        location: {
          type: 'Point',
          coordinates: [78.1198, 9.9252]
        },
        totalCapacity: 80,
        serviceBaysCount: 8,
        status: 'ACTIVE'
      });

      expect(depot.validateSync()).toBeUndefined();
      expect(depot.code).toBe('MDU-CEN');

      const indexes = Depot.schema.indexes();
      const geoIndex = indexes.find(([spec]) => spec.location === '2dsphere');
      expect(geoIndex).toBeDefined();
    });

    it('should reject pre-save when BACKUP depot has no primaryDepotId', async () => {
      const depot = new Depot({
        _id: new Types.ObjectId(),
        organizationId: new Types.ObjectId(),
        divisionId: new Types.ObjectId(),
        code: 'MDU-BCK',
        nameEn: 'Backup Depot',
        nameTa: 'காப்பு பணிமனை',
        depotType: 'BACKUP',
        location: {
          type: 'Point',
          coordinates: [78.12, 9.93]
        }
      });

      const hook = (Depot.schema as any).s.hooks._pres.get('validate')[0].fn;
      await new Promise<void>((resolve) => {
        hook.call(depot, (err?: Error) => {
          expect(err).toBeDefined();
          expect(err?.message).toContain('A BACKUP depot must specify an explicit primaryDepotId reference');
          resolve();
        });
      });
    });

    it('should reject pre-save when depot references itself as primaryDepotId', async () => {
      const selfId = new Types.ObjectId();
      const depot = new Depot({
        _id: selfId,
        organizationId: new Types.ObjectId(),
        divisionId: new Types.ObjectId(),
        code: 'MDU-SELF',
        nameEn: 'Self Ref Depot',
        nameTa: 'சுய பணிமனை',
        depotType: 'BACKUP',
        primaryDepotId: selfId,
        location: {
          type: 'Point',
          coordinates: [78.12, 9.93]
        }
      });

      const hook = (Depot.schema as any).s.hooks._pres.get('validate')[0].fn;
      await new Promise<void>((resolve) => {
        hook.call(depot, (err?: Error) => {
          expect(err).toBeDefined();
          expect(err?.message).toContain('A depot cannot reference itself as its primary depot');
          resolve();
        });
      });
    });

    it('should reject pre-save when circular depot relationship is detected', async () => {
      const depotAId = new Types.ObjectId();
      const depotBId = new Types.ObjectId();

      const findByIdSpy = vi.spyOn(Depot, 'findById').mockResolvedValue({
        _id: depotAId,
        primaryDepotId: depotBId
      } as any);

      const depotB = new Depot({
        _id: depotBId,
        organizationId: new Types.ObjectId(),
        divisionId: new Types.ObjectId(),
        code: 'DEPOT-B',
        nameEn: 'Depot B',
        nameTa: 'பணிமனை பி',
        depotType: 'BACKUP',
        primaryDepotId: depotAId,
        location: {
          type: 'Point',
          coordinates: [78.12, 9.93]
        }
      });

      const hook = (Depot.schema as any).s.hooks._pres.get('validate')[0].fn;
      await new Promise<void>((resolve) => {
        hook.call(depotB, (err?: Error) => {
          expect(err).toBeDefined();
          expect(err?.message).toContain(
            'Circular depot relationship detected: Primary depot already references this depot'
          );
          resolve();
        });
      });

      findByIdSpy.mockRestore();
    });
  });

  // =========================================================================
  // 4. Maintenance Workshop
  // =========================================================================
  describe('MaintenanceWorkshop Model', () => {
    it('should validate a valid maintenance workshop with capabilities', () => {
      const workshop = new MaintenanceWorkshop({
        organizationId: new Types.ObjectId(),
        divisionId: new Types.ObjectId(),
        depotId: new Types.ObjectId(),
        code: 'mdu-ws-01',
        nameEn: 'Central Workshop Madurai',
        nameTa: 'மத்திய பணிமனை மதுரை',
        workshopType: 'REGIONAL_CENTRAL_WORKSHOP',
        location: {
          type: 'Point',
          coordinates: [78.12, 9.93]
        },
        totalBays: 12,
        capabilities: ['MINOR_REPAIRS', 'HEAVY_OVERHAUL', 'TYRE_RETREADING'],
        status: 'ACTIVE'
      });

      expect(workshop.validateSync()).toBeUndefined();
      expect(workshop.code).toBe('MDU-WS-01');

      const indexes = MaintenanceWorkshop.schema.indexes();
      const geoIndex = indexes.find(([spec]) => spec.location === '2dsphere');
      expect(geoIndex).toBeDefined();
    });

    it('should reject invalid capability value', () => {
      const workshop = new MaintenanceWorkshop({
        organizationId: new Types.ObjectId(),
        divisionId: new Types.ObjectId(),
        code: 'MDU-WS-02',
        nameEn: 'Test WS',
        nameTa: 'சோதனை',
        location: { type: 'Point', coordinates: [78.12, 9.93] },
        capabilities: ['PAINT_SHOP' as any]
      });
      const err = workshop.validateSync();
      expect(err?.errors['capabilities.0']).toBeDefined();
    });
  });

  // =========================================================================
  // 5. Crew Member Model
  // =========================================================================
  describe('CrewMember Model', () => {
    it('should validate a valid crew member (driver/conductor)', () => {
      const driver = new CrewMember({
        employeeId: 'drv-10024',
        badgeNumber: 'b-842',
        fullName: 'Murugan K',
        role: 'DRIVER',
        organizationId: new Types.ObjectId(),
        divisionId: new Types.ObjectId(),
        depotId: new Types.ObjectId(),
        licenseNumber: 'TN-58-20150001234',
        contactNumber: '+91 98400 12345',
        status: 'ACTIVE',
        assignmentHistory: []
      });

      expect(driver.validateSync()).toBeUndefined();
      expect(driver.employeeId).toBe('DRV-10024');
      expect(driver.badgeNumber).toBe('B-842');
    });

    it('should reject invalid role enum', () => {
      const crew = new CrewMember({
        employeeId: 'EMP-01',
        badgeNumber: 'B-01',
        fullName: 'Test',
        role: 'MECHANIC' as any,
        organizationId: new Types.ObjectId(),
        divisionId: new Types.ObjectId(),
        depotId: new Types.ObjectId()
      });
      const err = crew.validateSync();
      expect(err?.errors['role']).toBeDefined();
    });
  });

  // =========================================================================
  // 6. Device Registry Model
  // =========================================================================
  describe('DeviceRegistry Model', () => {
    it('should default GPS availability status to UNKNOWN', () => {
      const device = new DeviceRegistry({
        deviceId: 'etm-mdu-441',
        deviceCategory: 'ETM',
        manufacturer: 'Verifone / OEM',
        deviceModel: 'Vx680 / TNSTC Variant',
        depotId: new Types.ObjectId()
      });

      expect(device.validateSync()).toBeUndefined();
      expect(device.deviceId).toBe('ETM-MDU-441');
      expect(device.gpsAvailabilityStatus).toBe('UNKNOWN');
      expect(device.status).toBe('STANDBY');
    });

    it('should validate VERIFIED_AVAILABLE and VERIFIED_UNAVAILABLE statuses', () => {
      const dev1 = new DeviceRegistry({
        deviceId: 'GPS-TRK-01',
        deviceCategory: 'GPS_TRACKER',
        manufacturer: 'Teltonika',
        deviceModel: 'FMB120',
        gpsAvailabilityStatus: 'VERIFIED_AVAILABLE',
        depotId: new Types.ObjectId()
      });
      expect(dev1.validateSync()).toBeUndefined();

      const dev2 = new DeviceRegistry({
        deviceId: 'ETM-LEGACY-02',
        deviceCategory: 'ETM',
        manufacturer: 'Analog POS',
        deviceModel: 'POS-200',
        gpsAvailabilityStatus: 'VERIFIED_UNAVAILABLE',
        depotId: new Types.ObjectId()
      });
      expect(dev2.validateSync()).toBeUndefined();
    });

    it('should reject invalid gpsAvailabilityStatus', () => {
      const device = new DeviceRegistry({
        deviceId: 'ETM-INV',
        deviceCategory: 'ETM',
        manufacturer: 'Test',
        deviceModel: 'Test',
        gpsAvailabilityStatus: 'ASSUMED_AVAILABLE' as any,
        depotId: new Types.ObjectId()
      });
      const err = device.validateSync();
      expect(err?.errors['gpsAvailabilityStatus']).toBeDefined();
    });
  });

  // =========================================================================
  // 7. Maintenance Record Model
  // =========================================================================
  describe('MaintenanceRecord Model', () => {
    it('should validate a valid maintenance record with parts replaced', () => {
      const record = new MaintenanceRecord({
        recordNumber: 'maint-2026-001',
        busId: new Types.ObjectId(),
        depotId: new Types.ObjectId(),
        maintenanceCategory: 'BREAKDOWN',
        priority: 'CRITICAL',
        issueDescription: 'Clutch plate slippage on Route 44B near Periyar Bus Stand',
        repairStatus: 'REPORTED',
        odometerAtReportKm: 142500,
        partsReplaced: [
          {
            partName: 'Clutch Plate 350mm',
            partCode: 'CP-350-AL',
            quantity: 1
          }
        ]
      });

      expect(record.validateSync()).toBeUndefined();
      expect(record.recordNumber).toBe('MAINT-2026-001');
      expect(record.partsReplaced).toHaveLength(1);
    });

    it('should reject invalid maintenanceCategory', () => {
      const record = new MaintenanceRecord({
        recordNumber: 'MAINT-002',
        busId: new Types.ObjectId(),
        depotId: new Types.ObjectId(),
        maintenanceCategory: 'UPGRADE' as any,
        priority: 'LOW',
        issueDescription: 'Test issue'
      });
      const err = record.validateSync();
      expect(err?.errors['maintenanceCategory']).toBeDefined();
    });
  });

  // =========================================================================
  // 8. Vehicle Replacement Record Model
  // =========================================================================
  describe('VehicleReplacementRecord Model', () => {
    it('should validate a valid replacement record', () => {
      const originalBusId = new Types.ObjectId();
      const replacementBusId = new Types.ObjectId();

      const record = new VehicleReplacementRecord({
        replacementNumber: 'rep-2026-008',
        originalBusId,
        replacementBusId,
        originalDepotId: new Types.ObjectId(),
        replacementDepotId: new Types.ObjectId(),
        reason: 'BREAKDOWN',
        reasonDetails: 'Alternator failure during trip',
        authorizedBy: 'depot_manager@tnstc.gov.in',
        status: 'APPROVED',
        passengersTransferred: true
      });

      expect(record.validateSync()).toBeUndefined();
      expect(record.replacementNumber).toBe('REP-2026-008');
    });

    it('should reject pre-validate when originalBusId equals replacementBusId', async () => {
      const sameBusId = new Types.ObjectId();

      const record = new VehicleReplacementRecord({
        replacementNumber: 'REP-IDENTICAL',
        originalBusId: sameBusId,
        replacementBusId: sameBusId,
        originalDepotId: new Types.ObjectId(),
        replacementDepotId: new Types.ObjectId(),
        reason: 'BREAKDOWN',
        authorizedBy: 'officer@tnstc.gov.in'
      });

      await new Promise<void>((resolve) => {
        const next = (err?: Error) => {
          expect(err).toBeDefined();
          expect(err?.message).toContain('Replacement bus cannot be identical to the original bus');
          resolve();
        };
        const hook = (VehicleReplacementRecord.schema as any).s.hooks._pres.get('validate')[0].fn;
        hook.call(record, next);
      });
    });
  });

  // =========================================================================
  // 9. Bus Model Extensions
  // =========================================================================
  describe('Bus Model Extensions', () => {
    it('should support expanded operational statuses (AVAILABLE, RESERVED, UNDER_MAINTENANCE, BREAKDOWN)', () => {
      const validStatuses = [
        'AVAILABLE',
        'IN_SERVICE',
        'RESERVED',
        'UNDER_MAINTENANCE',
        'BREAKDOWN',
        'MAINTENANCE',
        'OFFLINE',
        'INACTIVE'
      ] as const;

      validStatuses.forEach((status) => {
        const bus = new Bus({
          registrationNumber: `TN-58-N-${Math.floor(1000 + Math.random() * 9000)}`,
          fleetNumber: `MDU-TEST-${Math.floor(100 + Math.random() * 900)}`,
          depotName: 'Madurai Central Depot',
          status,
          isReserveFleet: status === 'RESERVED'
        });
        expect(bus.validateSync()).toBeUndefined();
      });
    });

    it('should have reserve fleet and depot indexes defined', () => {
      const indexes = Bus.schema.indexes();
      const reserveIndex = indexes.find(
        ([spec]) => spec.isReserveFleet === 1 && spec.status === 1
      );
      expect(reserveIndex).toBeDefined();

      const depotIndex = indexes.find(
        ([spec]) => spec.depotId === 1 && spec.status === 1
      );
      expect(depotIndex).toBeDefined();
    });
  });
});
