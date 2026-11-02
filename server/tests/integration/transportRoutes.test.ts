import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
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
  ScheduledTrip
} from '../../src/models';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Transport Infrastructure Routes (Integration)', () => {
  const adminToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'admin@tnstc.gov.in',
    role: 'ADMIN',
    sessionId: new Types.ObjectId().toString()
  });

  const passengerToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'passenger@example.com',
    role: 'PASSENGER',
    sessionId: new Types.ObjectId().toString()
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. RBAC & Authentication Guards
  // =========================================================================
  describe('RBAC & Authentication Protection', () => {
    it('should reject unauthenticated requests to admin endpoints with 401', async () => {
      const endpoints = [
        { method: 'post', path: '/api/v1/admin/organizations' },
        { method: 'post', path: '/api/v1/admin/depots' },
        { method: 'post', path: '/api/v1/admin/crew' },
        { method: 'get', path: '/api/v1/admin/devices' },
        { method: 'post', path: '/api/v1/admin/maintenance' },
        { method: 'post', path: '/api/v1/admin/replacements' }
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path);
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should reject passenger access to admin endpoints with 403', async () => {
      const endpoints = [
        { method: 'post', path: '/api/v1/admin/organizations' },
        { method: 'post', path: '/api/v1/admin/depots' },
        { method: 'post', path: '/api/v1/admin/crew' },
        { method: 'get', path: '/api/v1/admin/devices' },
        { method: 'post', path: '/api/v1/admin/maintenance' },
        { method: 'post', path: '/api/v1/admin/replacements' }
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path)
          .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
      }
    });
  });

  // =========================================================================
  // 2. Transport Organization Endpoints
  // =========================================================================
  describe('Transport Organization Endpoints', () => {
    it('should allow admin to create an organization (201)', async () => {
      const orgId = new Types.ObjectId();
      const mockOrg = {
        _id: orgId,
        name: 'TNSTC Madurai Region',
        code: 'TNSTC-MDU',
        shortName: 'TNSTC',
        status: 'ACTIVE',
        toObject: () => ({
          _id: orgId,
          name: 'TNSTC Madurai Region',
          code: 'TNSTC-MDU',
          shortName: 'TNSTC',
          status: 'ACTIVE'
        })
      };

      vi.spyOn(TransportOrganization, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(TransportOrganization, 'create').mockResolvedValue(mockOrg as any);

      const res = await request(app)
        .post('/api/v1/admin/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TNSTC Madurai Region',
          code: 'TNSTC-MDU',
          shortName: 'TNSTC'
        })
        .expect(201);

      expect(res.body.data.name).toBe('TNSTC Madurai Region');
      expect(res.body.data.code).toBe('TNSTC-MDU');
    });

    it('should list organizations for public read (200)', async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: new Types.ObjectId(), name: 'TNSTC', code: 'TNSTC' }
        ])
      };

      vi.spyOn(TransportOrganization, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(TransportOrganization, 'find').mockReturnValue(mockQuery as any);

      const res = await request(app)
        .get('/api/v1/organizations')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  // =========================================================================
  // 3. Depot Management Endpoints
  // =========================================================================
  describe('Depot Endpoints', () => {
    it('should allow admin to create a primary depot (201)', async () => {
      const orgId = new Types.ObjectId();
      const depotId = new Types.ObjectId();

      const mockDepot = {
        _id: depotId,
        code: 'MDU-CEN',
        nameEn: 'Madurai Central Depot',
        nameTa: 'மதுரை மத்திய பணிமனை',
        organizationId: orgId,
        depotType: 'PRIMARY',
        location: { type: 'Point', coordinates: [78.11, 9.92] },
        totalCapacity: 60,
        status: 'ACTIVE',
        toObject: () => ({
          _id: depotId,
          code: 'MDU-CEN',
          nameEn: 'Madurai Central Depot'
        })
      };

      vi.spyOn(Depot, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(TransportOrganization, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: orgId })
      } as any);
      vi.spyOn(Depot, 'create').mockResolvedValue(mockDepot as any);

      const res = await request(app)
        .post('/api/v1/admin/depots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'MDU-CEN',
          nameEn: 'Madurai Central Depot',
          nameTa: 'மதுரை மத்திய பணிமனை',
          organizationId: orgId.toString(),
          depotType: 'PRIMARY',
          location: { type: 'Point', coordinates: [78.11, 9.92] },
          totalCapacity: 60
        })
        .expect(201);

      expect(res.body.data.code).toBe('MDU-CEN');
    });

    it('should reject backup depot creation if primary depot reference is missing (400)', async () => {
      const orgId = new Types.ObjectId();

      vi.spyOn(Depot, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(TransportOrganization, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: orgId })
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/depots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'MDU-BACKUP',
          nameEn: 'Backup Depot',
          nameTa: 'காப்பு பணிமனை',
          organizationId: orgId.toString(),
          depotType: 'BACKUP',
          location: { type: 'Point', coordinates: [78.11, 9.92] }
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // 4. Crew Members & PII Protection
  // =========================================================================
  describe('Crew Management & PII Protection', () => {
    it('should sanitize driver and conductor PII on public read (200)', async () => {
      const publicCrewMember = {
        _id: new Types.ObjectId(),
        employeeId: 'DRV-101',
        badgeNumber: 'B-12',
        fullName: 'Kandasamy M',
        role: 'DRIVER',
        status: 'ON_DUTY'
        // contactNumber and licenseNumber omitted by projection
      };

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([publicCrewMember])
      };

      const findSpy = vi.spyOn(CrewMember, 'find').mockReturnValue(mockQuery as any);
      vi.spyOn(CrewMember, 'countDocuments').mockResolvedValue(1 as any);

      const res = await request(app)
        .get('/api/v1/crew')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].fullName).toBe('Kandasamy M');
      expect(res.body.data[0].contactNumber).toBeUndefined();
      expect(res.body.data[0].licenseNumber).toBeUndefined();

      // Check projection had contactNumber: 0
      expect(findSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ contactNumber: 0, licenseNumber: 0 })
      );
    });

    it('should allow admin to create crew member with full credentials (201)', async () => {
      const depotId = new Types.ObjectId();
      const orgId = new Types.ObjectId();
      const crewId = new Types.ObjectId();

      const mockCrew = {
        _id: crewId,
        employeeId: 'CND-202',
        badgeNumber: 'C-88',
        fullName: 'Senthil Nathan',
        role: 'CONDUCTOR',
        organizationId: orgId,
        depotId,
        contactNumber: '+91 94433 11223',
        status: 'ACTIVE',
        toObject: () => ({
          _id: crewId,
          employeeId: 'CND-202',
          fullName: 'Senthil Nathan',
          role: 'CONDUCTOR'
        })
      };

      vi.spyOn(CrewMember, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: depotId })
      } as any);
      vi.spyOn(CrewMember, 'create').mockResolvedValue(mockCrew as any);

      const res = await request(app)
        .post('/api/v1/admin/crew')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: 'CND-202',
          badgeNumber: 'C-88',
          fullName: 'Senthil Nathan',
          role: 'CONDUCTOR',
          organizationId: orgId.toString(),
          depotId: depotId.toString(),
          contactNumber: '+91 94433 11223'
        })
        .expect(201);

      expect(res.body.data.employeeId).toBe('CND-202');
      expect(res.body.data.role).toBe('CONDUCTOR');
    });
  });

  // =========================================================================
  // 5. Device Registry Endpoints
  // =========================================================================
  describe('Device Registry Endpoints', () => {
    it('should register an ETM with default UNKNOWN GPS availability (201)', async () => {
      const depotId = new Types.ObjectId();
      const devId = new Types.ObjectId();

      const mockDevice = {
        _id: devId,
        deviceId: 'ETM-MDU-891',
        deviceCategory: 'ETM',
        manufacturer: 'POS OEM',
        deviceModel: 'T-POS-800',
        gpsAvailabilityStatus: 'UNKNOWN',
        status: 'STANDBY',
        toObject: () => ({
          _id: devId,
          deviceId: 'ETM-MDU-891',
          deviceCategory: 'ETM',
          gpsAvailabilityStatus: 'UNKNOWN',
          status: 'STANDBY'
        })
      };

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: depotId })
      } as any);
      vi.spyOn(DeviceRegistry, 'create').mockResolvedValue(mockDevice as any);

      const res = await request(app)
        .post('/api/v1/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          deviceId: 'ETM-MDU-891',
          deviceCategory: 'ETM',
          manufacturer: 'POS OEM',
          deviceModel: 'T-POS-800',
          depotId: depotId.toString()
        })
        .expect(201);

      expect(res.body.data.deviceId).toBe('ETM-MDU-891');
      expect(res.body.data.gpsAvailabilityStatus).toBe('UNKNOWN');
    });
  });

  // =========================================================================
  // 6. Maintenance & Bus Status Transition
  // =========================================================================
  describe('Maintenance Workflow & Bus Status Transitions', () => {
    it('should automatically transition bus status to BREAKDOWN when breakdown reported (201)', async () => {
      const busId = new Types.ObjectId();
      const depotId = new Types.ObjectId();
      const recId = new Types.ObjectId();

      const mockBus = {
        _id: busId,
        registrationNumber: 'TN-58-N-1200',
        status: 'IN_SERVICE',
        save: vi.fn().mockResolvedValue(true)
      };

      const mockRecord = {
        _id: recId,
        recordNumber: 'BRK-2026-009',
        busId,
        depotId,
        maintenanceCategory: 'BREAKDOWN',
        issueDescription: 'Engine overheating on Madurai bypass',
        repairStatus: 'REPORTED',
        toObject: () => ({
          _id: recId,
          recordNumber: 'BRK-2026-009',
          maintenanceCategory: 'BREAKDOWN'
        })
      };

      vi.spyOn(MaintenanceRecord, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: depotId })
      } as any);
      vi.spyOn(MaintenanceRecord, 'create').mockResolvedValue(mockRecord as any);

      const res = await request(app)
        .post('/api/v1/admin/maintenance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recordNumber: 'BRK-2026-009',
          busId: busId.toString(),
          depotId: depotId.toString(),
          maintenanceCategory: 'BREAKDOWN',
          issueDescription: 'Engine overheating on Madurai bypass'
        })
        .expect(201);

      expect(res.body.data.recordNumber).toBe('BRK-2026-009');
      expect(mockBus.status).toBe('BREAKDOWN');
      expect(mockBus.save).toHaveBeenCalled();
    });

    it('should restore bus status to AVAILABLE when repair is RESOLVED (200)', async () => {
      const busId = new Types.ObjectId();
      const recId = new Types.ObjectId();

      const mockRecord = {
        _id: recId,
        busId,
        repairStatus: 'IN_PROGRESS',
        save: vi.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: recId,
          repairStatus: 'RESOLVED'
        })
      };

      vi.spyOn(MaintenanceRecord, 'findById').mockResolvedValue(mockRecord as any);
      const updateBusSpy = vi.spyOn(Bus, 'findByIdAndUpdate').mockResolvedValue({} as any);

      const res = await request(app)
        .patch(`/api/v1/admin/maintenance/${recId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          repairStatus: 'RESOLVED',
          repairNotes: 'Radiator flushed and coolant refilled'
        })
        .expect(200);

      expect(res.body.data.repairStatus).toBe('RESOLVED');
      expect(updateBusSpy).toHaveBeenCalledWith(busId, { status: 'AVAILABLE' });
    });
  });

  // =========================================================================
  // 7. Vehicle Replacement Workflow
  // =========================================================================
  describe('Vehicle Replacement Workflow', () => {
    it('should reject replacement when original bus and replacement bus are identical (400)', async () => {
      const sameBusId = new Types.ObjectId();

      const res = await request(app)
        .post('/api/v1/admin/replacements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          replacementNumber: 'REP-INVALID-01',
          originalBusId: sameBusId.toString(),
          replacementBusId: sameBusId.toString(),
          originalDepotId: new Types.ObjectId().toString(),
          replacementDepotId: new Types.ObjectId().toString(),
          reason: 'BREAKDOWN'
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should successfully execute replacement, update bus statuses and trip assignment (201)', async () => {
      const origBusId = new Types.ObjectId();
      const replBusId = new Types.ObjectId();
      const tripId = new Types.ObjectId();
      const origDepotId = new Types.ObjectId();
      const replDepotId = new Types.ObjectId();
      const repRecordId = new Types.ObjectId();

      const mockOrigBus = {
        _id: origBusId,
        registrationNumber: 'TN-58-N-1111',
        status: 'IN_SERVICE',
        save: vi.fn().mockResolvedValue(true)
      };

      const mockReplBus = {
        _id: replBusId,
        registrationNumber: 'TN-58-N-9999',
        status: 'AVAILABLE',
        currentAssignedTripId: undefined,
        save: vi.fn().mockResolvedValue(true)
      };

      const mockReplacement = {
        _id: repRecordId,
        replacementNumber: 'REP-SUCCESS-01',
        status: 'APPROVED',
        authorizedBy: 'admin@tnstc.gov.in',
        toObject: () => ({
          _id: repRecordId,
          replacementNumber: 'REP-SUCCESS-01',
          status: 'APPROVED'
        })
      };

      vi.spyOn(VehicleReplacementRecord, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Bus, 'findById').mockImplementation(async (id: any) => {
        if (id.toString() === origBusId.toString()) return mockOrigBus as any;
        if (id.toString() === replBusId.toString()) return mockReplBus as any;
        return null;
      });
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: origDepotId })
      } as any);
      const updateTripSpy = vi.spyOn(ScheduledTrip, 'findByIdAndUpdate').mockResolvedValue({} as any);
      vi.spyOn(VehicleReplacementRecord, 'create').mockResolvedValue(mockReplacement as any);

      const res = await request(app)
        .post('/api/v1/admin/replacements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          replacementNumber: 'REP-SUCCESS-01',
          originalBusId: origBusId.toString(),
          replacementBusId: replBusId.toString(),
          tripId: tripId.toString(),
          originalDepotId: origDepotId.toString(),
          replacementDepotId: replDepotId.toString(),
          reason: 'BREAKDOWN',
          passengersTransferred: true
        })
        .expect(201);

      expect(res.body.data.replacementNumber).toBe('REP-SUCCESS-01');
      expect(mockOrigBus.status).toBe('BREAKDOWN');
      expect(mockReplBus.status).toBe('IN_SERVICE');
      expect(mockReplBus.currentAssignedTripId?.toString()).toBe(tripId.toString());
      expect(updateTripSpy).toHaveBeenCalledWith(tripId.toString(), {
        busId: replBusId
      });
    });
  });
});

