import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import {
  Bus,
  CrewMember,
  DeviceRegistry,
  AssignmentRecord,
  Depot
} from '../../src/models';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Fleet, Staff & Device Management Routes (Integration)', () => {
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

  describe('RBAC Guards', () => {
    it('should reject unauthenticated requests to admin fleet & staff endpoints with 401', async () => {
      const endpoints = [
        { method: 'patch', path: '/api/v1/admin/buses/650000000000000000000001/depot' },
        { method: 'post', path: '/api/v1/admin/drivers' },
        { method: 'post', path: '/api/v1/admin/conductors' },
        { method: 'post', path: '/api/v1/admin/devices/etms' },
        { method: 'post', path: '/api/v1/admin/devices/gps-trackers' },
        { method: 'post', path: '/api/v1/admin/assignments/bus-etm' },
        { method: 'get', path: '/api/v1/admin/assignments' }
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path);
        expect(res.status).toBe(401);
      }
    });

    it('should reject non-admin (passenger) users with 403 Forbidden', async () => {
      const endpoints = [
        { method: 'patch', path: '/api/v1/admin/buses/650000000000000000000001/depot' },
        { method: 'post', path: '/api/v1/admin/drivers' },
        { method: 'post', path: '/api/v1/admin/conductors' },
        { method: 'post', path: '/api/v1/admin/devices/etms' },
        { method: 'post', path: '/api/v1/admin/devices/gps-trackers' },
        { method: 'post', path: '/api/v1/admin/assignments/bus-etm' }
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path)
          .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(403);
      }
    });
  });

  describe('Fleet Extensions Endpoints', () => {
    it('PATCH /api/v1/admin/buses/:busId/depot assigns depot to bus with admin token', async () => {
      const busId = new Types.ObjectId();
      const depotId = new Types.ObjectId();

      const mockBus: any = {
        _id: busId,
        registrationNumber: 'TN-58-N-1234',
        fleetNumber: 'MDU-001',
        depotName: 'Old Depot',
        vehicleType: 'ORDINARY_NON_AC',
        status: 'AVAILABLE',
        isReserveFleet: false,
        isActive: true,
        save: vi.fn().mockResolvedValue(true)
      };

      const mockDepot: any = {
        _id: depotId,
        nameEn: 'Madurai Central Depot',
        code: 'MDU-DEP-01',
        status: 'ACTIVE'
      };

      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus);
      vi.spyOn(Depot, 'findById').mockResolvedValue(mockDepot);
      vi.spyOn(AssignmentRecord, 'updateMany').mockResolvedValue({} as any);
      vi.spyOn(AssignmentRecord, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .patch(`/api/v1/admin/buses/${busId}/depot`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ depotId: depotId.toString(), notes: 'Assigned to central depot' });

      expect(res.status).toBe(200);
      expect(res.body.data.depotName).toBe('Madurai Central Depot');
    });

    it('GET /api/v1/buses/:busId/assignments returns assignment history', async () => {
      const busId = new Types.ObjectId();

      vi.spyOn(AssignmentRecord, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([
                  {
                    _id: new Types.ObjectId(),
                    assignmentType: 'BUS_DEPOT',
                    status: 'ACTIVE',
                    assignedAt: new Date(),
                    assignedBy: 'admin',
                    depotId: { _id: new Types.ObjectId(), nameEn: 'Madurai Central', code: 'MDU-DEP-01' }
                  }
                ])
              })
            })
          })
        })
      } as any);

      const res = await request(app).get(`/api/v1/buses/${busId}/assignments`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].assignmentType).toBe('BUS_DEPOT');
    });
  });

  describe('Driver & Conductor Registry Endpoints', () => {
    it('POST /api/v1/admin/drivers registers a new driver', async () => {
      const orgId = new Types.ObjectId();
      const divId = new Types.ObjectId();
      const depotId = new Types.ObjectId();

      vi.spyOn(CrewMember, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: depotId, nameEn: 'Depot 1' })
      } as any);

      const mockCreated: any = {
        _id: new Types.ObjectId(),
        employeeId: 'DRV-2001',
        badgeNumber: 'BDG-2001',
        fullName: 'Murugan K',
        role: 'DRIVER',
        organizationId: orgId,
        divisionId: divId,
        depotId,
        status: 'AVAILABLE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(CrewMember, 'create').mockResolvedValue(mockCreated as any);
      vi.spyOn(CrewMember, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockCreated)
              })
            })
          })
        })
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/drivers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: 'DRV-2001',
          badgeNumber: 'BDG-2001',
          fullName: 'Murugan K',
          organizationId: orgId.toString(),
          divisionId: divId.toString(),
          depotId: depotId.toString(),
          licenseNumber: 'TN-58-2015-001234',
          status: 'AVAILABLE'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.employeeId).toBe('DRV-2001');
      expect(res.body.data.fullName).toBe('Murugan K');
    });

    it('GET /api/v1/drivers sanitizes sensitive licenseNumber for unauthenticated users', async () => {
      vi.spyOn(CrewMember, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(CrewMember, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                populate: vi.fn().mockReturnValue({
                  populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                      lean: vi.fn().mockResolvedValue([
                        {
                          _id: new Types.ObjectId(),
                          employeeId: 'DRV-2001',
                          badgeNumber: 'BDG-2001',
                          fullName: 'Murugan K',
                          role: 'DRIVER',
                          licenseNumber: 'CONFIDENTIAL-LICENSE-1234',
                          contactNumber: '9876543210',
                          status: 'AVAILABLE',
                          isActive: true,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        }
                      ])
                    })
                  })
                })
              })
            })
          })
        })
      } as any);

      const res = await request(app).get('/api/v1/drivers');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].licenseNumber).toBeUndefined();
      expect(res.body.data[0].contactNumber).toBeUndefined();
    });

    it('POST /api/v1/admin/conductors registers a new conductor', async () => {
      const orgId = new Types.ObjectId();
      const divId = new Types.ObjectId();
      const depotId = new Types.ObjectId();

      vi.spyOn(CrewMember, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: depotId, nameEn: 'Depot 1' })
      } as any);

      const mockCreated: any = {
        _id: new Types.ObjectId(),
        employeeId: 'CND-2001',
        badgeNumber: 'BDG-CND-01',
        fullName: 'Ramasamy T',
        role: 'CONDUCTOR',
        organizationId: orgId,
        divisionId: divId,
        depotId,
        status: 'AVAILABLE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(CrewMember, 'create').mockResolvedValue(mockCreated as any);
      vi.spyOn(CrewMember, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockCreated)
              })
            })
          })
        })
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/conductors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: 'CND-2001',
          badgeNumber: 'BDG-CND-01',
          fullName: 'Ramasamy T',
          organizationId: orgId.toString(),
          divisionId: divId.toString(),
          depotId: depotId.toString(),
          status: 'AVAILABLE'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.employeeId).toBe('CND-2001');
    });
  });

  describe('ETM & GPS Tracker Device Registries', () => {
    it('POST /api/v1/admin/devices/etms creates ETM with default UNKNOWN GPS status', async () => {
      const depotId = new Types.ObjectId();
      const deviceObjectId = new Types.ObjectId();

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: depotId, nameEn: 'Depot 1' })
      } as any);

      const mockEtm: any = {
        _id: deviceObjectId,
        deviceId: 'ETM-MDU-501',
        deviceCategory: 'ETM',
        manufacturer: 'Analogics',
        deviceModel: 'PR-3',
        gpsAvailabilityStatus: 'UNKNOWN',
        networkGenerations: ['4G'],
        status: 'ACTIVE',
        depotId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(DeviceRegistry, 'create').mockResolvedValue(mockEtm as any);
      vi.spyOn(DeviceRegistry, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockEtm)
            })
          })
        })
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/devices/etms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          deviceId: 'ETM-MDU-501',
          manufacturer: 'Analogics',
          deviceModel: 'PR-3',
          depotId: depotId.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.data.gpsAvailabilityStatus).toBe('UNKNOWN');
      expect(res.body.data.deviceCategory).toBe('ETM');
    });

    it('POST /api/v1/admin/devices/gps-trackers creates dedicated GPS tracker with VERIFIED_AVAILABLE status', async () => {
      const depotId = new Types.ObjectId();
      const deviceObjectId = new Types.ObjectId();

      vi.spyOn(DeviceRegistry, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);
      vi.spyOn(Depot, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: depotId, nameEn: 'Depot 1' })
      } as any);

      const mockGps: any = {
        _id: deviceObjectId,
        deviceId: 'GPS-MDU-701',
        deviceCategory: 'GPS_TRACKER',
        manufacturer: 'Teltonika',
        deviceModel: 'FMB120',
        gpsAvailabilityStatus: 'VERIFIED_AVAILABLE',
        networkGenerations: ['4G'],
        status: 'ACTIVE',
        depotId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(DeviceRegistry, 'create').mockResolvedValue(mockGps as any);
      vi.spyOn(DeviceRegistry, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockGps)
            })
          })
        })
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/devices/gps-trackers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          deviceId: 'GPS-MDU-701',
          manufacturer: 'Teltonika',
          deviceModel: 'FMB120',
          depotId: depotId.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.data.gpsAvailabilityStatus).toBe('VERIFIED_AVAILABLE');
      expect(res.body.data.deviceCategory).toBe('GPS_TRACKER');
    });
  });

  describe('Controlled Device & Crew Assignments', () => {
    it('POST /api/v1/admin/assignments/bus-gps pairs GPS tracker to bus', async () => {
      const busId = new Types.ObjectId();
      const deviceId = new Types.ObjectId();

      const mockBus: any = {
        _id: busId,
        registrationNumber: 'TN-58-N-1234',
        save: vi.fn().mockResolvedValue(true)
      };

      const mockDevice: any = {
        _id: deviceId,
        deviceId: 'GPS-MDU-101',
        deviceCategory: 'GPS_TRACKER',
        status: 'ACTIVE',
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(Bus, 'findById').mockResolvedValue(mockBus);
      vi.spyOn(DeviceRegistry, 'findById').mockResolvedValue(mockDevice);
      vi.spyOn(Bus, 'updateMany').mockResolvedValue({} as any);
      vi.spyOn(AssignmentRecord, 'updateMany').mockResolvedValue({} as any);
      vi.spyOn(AssignmentRecord, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/admin/assignments/bus-gps')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ busId: busId.toString(), deviceId: deviceId.toString(), notes: 'Bench test verified' });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.assignedGpsTrackerId).toBe(deviceId.toString());
    });

    it('GET /api/v1/admin/assignments retrieves paginated assignment records', async () => {
      vi.spyOn(AssignmentRecord, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(AssignmentRecord, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                populate: vi.fn().mockReturnValue({
                  populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                      lean: vi.fn().mockResolvedValue([
                        {
                          _id: new Types.ObjectId(),
                          assignmentType: 'BUS_GPS',
                          status: 'ACTIVE',
                          assignedAt: new Date(),
                          assignedBy: 'admin',
                          notes: 'Testing'
                        }
                      ])
                    })
                  })
                })
              })
            })
          })
        })
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/assignments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].assignmentType).toBe('BUS_GPS');
    });
  });

  describe('Fleet & Device Monitoring Aggregations', () => {
    it('GET /api/v1/stats/fleet-devices returns fleet, crew, and device telemetry counts', async () => {
      vi.spyOn(Bus, 'countDocuments').mockResolvedValue(10);
      vi.spyOn(CrewMember, 'countDocuments').mockResolvedValue(8);
      vi.spyOn(DeviceRegistry, 'countDocuments').mockResolvedValue(6);

      const res = await request(app).get('/api/v1/stats/fleet-devices');
      expect(res.status).toBe(200);
      expect(res.body.data.fleet).toBeDefined();
      expect(res.body.data.staff).toBeDefined();
      expect(res.body.data.devices).toBeDefined();
      expect(res.body.data.devices.communicationHealthThresholdMinutes).toBe(15);
    });
  });
});

