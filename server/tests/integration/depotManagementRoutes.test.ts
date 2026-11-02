import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import {
  Depot,
  Bus,
  BusStand,
  MaintenanceWorkshop,
  MaintenanceRecord,
  DepotTransfer
} from '../../src/models';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Depot, Workshop & Bus Stand Management Routes (Integration)', () => {
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
  // 1. RBAC & Auth Protection
  // =========================================================================
  describe('RBAC Protection', () => {
    it('should reject unauthenticated requests to Phase 2 admin endpoints with 401', async () => {
      const endpoints = [
        { method: 'patch', path: '/api/v1/admin/depots/650000000000000000000001/primary' },
        { method: 'patch', path: '/api/v1/admin/depots/650000000000000000000001/status' },
        { method: 'patch', path: '/api/v1/admin/buses/650000000000000000000001/reserve' },
        { method: 'post', path: '/api/v1/admin/bus-stands' },
        { method: 'post', path: '/api/v1/admin/transfers' }
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path);
        expect(res.status).toBe(401);
      }
    });

    it('should reject passenger access to Phase 2 admin endpoints with 403', async () => {
      const endpoints = [
        { method: 'patch', path: '/api/v1/admin/depots/650000000000000000000001/status' },
        { method: 'patch', path: '/api/v1/admin/buses/650000000000000000000001/reserve' },
        { method: 'post', path: '/api/v1/admin/bus-stands' },
        { method: 'post', path: '/api/v1/admin/transfers' }
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path)
          .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(403);
      }
    });
  });

  // =========================================================================
  // 2. Depot Fleet & Backup Depots
  // =========================================================================
  describe('Depot Fleet & Backup Depot Relationships', () => {
    it('should return buses assigned to a depot (200)', async () => {
      const depotId = new Types.ObjectId();
      const mockDepot = {
        _id: depotId,
        nameEn: 'Madurai Central Depot',
        code: 'MDU-CEN'
      };

      const mockBus = {
        _id: new Types.ObjectId(),
        registrationNumber: 'TN-58-N-2026',
        fleetNumber: 'MDU-01',
        status: 'AVAILABLE',
        isReserveFleet: false
      };

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockBus])
      };

      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDepot)
      } as any);
      vi.spyOn(Bus, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(Bus, 'find').mockReturnValue(mockQuery as any);

      const res = await request(app)
        .get(`/api/v1/depots/${depotId}/buses`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].registrationNumber).toBe('TN-58-N-2026');
      expect(res.body.pagination.total).toBe(1);
    });

    it('should return linked backup depots and their available reserve count (200)', async () => {
      const primaryDepotId = new Types.ObjectId();
      const backupDepotId = new Types.ObjectId();

      const mockPrimary = {
        _id: primaryDepotId,
        code: 'MDU-PRI',
        nameEn: 'Madurai Primary Depot',
        nameTa: 'மதுரை முதன்மை பணிமனை'
      };

      const mockBackup = {
        _id: backupDepotId,
        code: 'MDU-BCK',
        nameEn: 'Madurai Relief Backup',
        nameTa: 'மதுரை காப்பு பணிமனை',
        depotType: 'BACKUP',
        primaryDepotId
      };

      const mockReserveBus = {
        _id: new Types.ObjectId(),
        registrationNumber: 'TN-58-N-9999',
        fleetNumber: 'RES-01',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'RESERVED',
        isReserveFleet: true,
        currentAssignedTripId: undefined
      };

      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockPrimary)
      } as any);
      vi.spyOn(Depot, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockBackup])
      } as any);
      vi.spyOn(Bus, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockReserveBus])
      } as any);

      const res = await request(app)
        .get(`/api/v1/depots/${primaryDepotId}/backup-depots`)
        .expect(200);

      expect(res.body.data.primaryDepot.code).toBe('MDU-PRI');
      expect(res.body.data.backupDepots).toHaveLength(1);
      expect(res.body.data.backupDepots[0].availableReserveCount).toBe(1);
      expect(res.body.data.backupDepots[0].reserveBuses[0].isAvailable).toBe(true);
    });

    it('should allow admin to reassign backup depot primary relationship (200)', async () => {
      const backupId = new Types.ObjectId();
      const newPrimaryId = new Types.ObjectId();
      const orgId = new Types.ObjectId();

      const mockBackup = {
        _id: backupId,
        code: 'MDU-BCK',
        depotType: 'BACKUP',
        organizationId: orgId,
        primaryDepotId: new Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
        toObject: () => ({ _id: backupId, primaryDepotId: newPrimaryId })
      };

      const mockNewPrimary = {
        _id: newPrimaryId,
        code: 'MDU-PRI-2',
        depotType: 'PRIMARY',
        organizationId: orgId
      };

      vi.spyOn(Depot, 'findById').mockImplementation(((id: any) => {
        if (id.toString() === backupId.toString()) {
          return mockBackup as any;
        }
        return {
          lean: vi.fn().mockResolvedValue(mockNewPrimary)
        } as any;
      }) as any);

      const res = await request(app)
        .patch(`/api/v1/admin/depots/${backupId}/primary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPrimaryDepotId: newPrimaryId.toString() })
        .expect(200);

      expect(res.body.data.primaryDepotId.toString()).toBe(newPrimaryId.toString());
      expect(mockBackup.save).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. Reserve Fleet Management
  // =========================================================================
  describe('Reserve Fleet Management', () => {
    it('should list reserve fleet and calculate dispatch availability (200)', async () => {
      const availableReserveBus = {
        _id: new Types.ObjectId(),
        registrationNumber: 'TN-58-N-8888',
        fleetNumber: 'RES-08',
        status: 'RESERVED',
        isReserveFleet: true,
        currentAssignedTripId: undefined
      };

      const busyReserveBus = {
        _id: new Types.ObjectId(),
        registrationNumber: 'TN-58-N-7777',
        fleetNumber: 'RES-07',
        status: 'RESERVED',
        isReserveFleet: true,
        currentAssignedTripId: new Types.ObjectId() // Active on trip
      };

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([availableReserveBus, busyReserveBus])
      };

      vi.spyOn(Bus, 'countDocuments').mockResolvedValue(2 as any);
      vi.spyOn(Bus, 'find').mockReturnValue(mockQuery as any);

      const res = await request(app)
        .get('/api/v1/reserve-fleet')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].isAvailableForDispatch).toBe(true);
      expect(res.body.data[1].isAvailableForDispatch).toBe(false);
      expect(res.body.data[1].ineligibilityReason).toBe('Assigned to active trip');
    });

    it('should reject marking bus as reserve when bus is in active trip (400)', async () => {
      const busId = new Types.ObjectId();
      const mockBus = {
        _id: busId,
        status: 'IN_SERVICE',
        currentAssignedTripId: new Types.ObjectId()
      };

      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus as any);

      const res = await request(app)
        .patch(`/api/v1/admin/buses/${busId}/reserve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isReserveFleet: true })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Cannot designate bus as reserve while it is assigned to an active trip');
    });
  });

  // =========================================================================
  // 4. Workshop Management
  // =========================================================================
  describe('Workshop Management', () => {
    it('should allow admin to update workshop details and capabilities (200)', async () => {
      const wsId = new Types.ObjectId();
      const mockWorkshop = {
        _id: wsId,
        code: 'MDU-WS-01',
        totalBays: 6,
        capabilities: ['ROUTINE_SERVICE'],
        save: vi.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: wsId,
          code: 'MDU-WS-01',
          totalBays: 10,
          capabilities: ['ROUTINE_SERVICE', 'HEAVY_OVERHAUL']
        })
      };

      vi.spyOn(MaintenanceWorkshop, 'findById').mockResolvedValue(mockWorkshop as any);

      const res = await request(app)
        .patch(`/api/v1/admin/workshops/${wsId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          totalBays: 10,
          capabilities: ['ROUTINE_SERVICE', 'HEAVY_OVERHAUL']
        })
        .expect(200);

      expect(res.body.data.totalBays).toBe(10);
      expect(mockWorkshop.save).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 5. Bus Stand CRUD
  // =========================================================================
  describe('Bus Stand Management', () => {
    it('should list bus stands with search and district filtering (200)', async () => {
      const mockStand = {
        _id: new Types.ObjectId(),
        code: 'MDU-MGR',
        nameEn: 'Mattuthavani Integrated Bus Terminus',
        nameTa: 'மாட்டுத்தாவணி ஒருங்கிணைந்த பேருந்து நிலையம்',
        standType: 'INTERCITY_TERMINAL',
        totalPlatforms: 12
      };

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockStand])
      };

      vi.spyOn(BusStand, 'countDocuments').mockResolvedValue(1 as any);
      vi.spyOn(BusStand, 'find').mockReturnValue(mockQuery as any);

      const res = await request(app)
        .get('/api/v1/bus-stands?q=Mattuthavani')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].code).toBe('MDU-MGR');
    });

    it('should allow admin to create a new bus stand (201)', async () => {
      const districtId = new Types.ObjectId();
      const standId = new Types.ObjectId();

      const mockCreated = {
        _id: standId,
        code: 'MDU-PER',
        nameEn: 'Periyar Bus Stand',
        nameTa: 'பெரியார் பேருந்து நிலையம்',
        location: { type: 'Point', coordinates: [78.11, 9.91] },
        standType: 'TOWN_STAND',
        totalPlatforms: 6,
        toObject: () => ({
          _id: standId,
          code: 'MDU-PER',
          nameEn: 'Periyar Bus Stand'
        })
      };

      vi.spyOn(BusStand, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(BusStand, 'create').mockResolvedValue(mockCreated as any);

      const res = await request(app)
        .post('/api/v1/admin/bus-stands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          districtId: districtId.toString(),
          code: 'MDU-PER',
          nameEn: 'Periyar Bus Stand',
          nameTa: 'பெரியார் பேருந்து நிலையம்',
          location: { type: 'Point', coordinates: [78.11, 9.91] },
          standType: 'TOWN_STAND',
          totalPlatforms: 6
        })
        .expect(201);

      expect(res.body.data.code).toBe('MDU-PER');
    });
  });

  // =========================================================================
  // 6. Depot Transfers Workflow
  // =========================================================================
  describe('Depot Transfers Workflow', () => {
    it('should request a transfer and reject if identical source and destination (400)', async () => {
      const sameDepotId = new Types.ObjectId();

      const res = await request(app)
        .post('/api/v1/admin/transfers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          transferNumber: 'TRF-IDENTICAL-01',
          busId: new Types.ObjectId().toString(),
          fromDepotId: sameDepotId.toString(),
          toDepotId: sameDepotId.toString(),
          reason: 'FLEET_REBALANCING'
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should complete transfer workflow and reassign bus depot (200)', async () => {
      const transferId = new Types.ObjectId();
      const busId = new Types.ObjectId();
      const destDepotId = new Types.ObjectId();

      const mockBus = {
        _id: busId,
        registrationNumber: 'TN-58-N-3333',
        depotId: new Types.ObjectId(),
        depotName: 'Old Depot',
        status: 'AVAILABLE',
        isReserveFleet: false,
        save: vi.fn().mockResolvedValue(true)
      };

      const mockDestDepot = {
        _id: destDepotId,
        nameEn: 'Destination Depot'
      };

      const mockTransfer = {
        _id: transferId,
        busId,
        toDepotId: destDepotId,
        status: 'IN_TRANSIT',
        auditHistory: [],
        save: vi.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: transferId,
          status: 'COMPLETED'
        })
      };

      vi.spyOn(DepotTransfer, 'findById').mockResolvedValue(mockTransfer as any);
      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDestDepot)
      } as any);

      const res = await request(app)
        .patch(`/api/v1/admin/transfers/${transferId}/complete`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Arrived at destination depot' })
        .expect(200);

      expect(res.body.data.status).toBe('COMPLETED');
      expect(mockBus.depotId.toString()).toBe(destDepotId.toString());
      expect(mockBus.depotName).toBe('Destination Depot');
      expect(mockBus.save).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 7. Operational Statistics
  // =========================================================================
  describe('Depot Operational Statistics', () => {
    it('should return global operational statistics aggregated from real DB (200)', async () => {
      vi.spyOn(Bus, 'countDocuments').mockResolvedValue(25 as any);
      vi.spyOn(DepotTransfer, 'countDocuments').mockResolvedValue(2 as any);
      vi.spyOn(MaintenanceWorkshop, 'countDocuments').mockResolvedValue(4 as any);
      vi.spyOn(MaintenanceRecord, 'countDocuments').mockResolvedValue(3 as any);
      vi.spyOn(Depot, 'countDocuments').mockResolvedValue(6 as any);

      const res = await request(app)
        .get('/api/v1/stats/operational')
        .expect(200);

      expect(res.body.data.fleet).toBeDefined();
      expect(res.body.data.operations).toBeDefined();
      expect(res.body.data.workshops).toBeDefined();
    });
  });
});
