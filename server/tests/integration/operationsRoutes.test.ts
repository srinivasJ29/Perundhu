import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import {
  Bus,
  Depot,
  ScheduledTrip,
  CrewMember,
  DeviceRegistry,
  LatestBusPosition,
  ServiceAlert,
  TransportDivision,
  AssignmentRecord
} from '../../src/models';
import { signAccessToken } from '../../src/modules/auth/auth.tokens';

describe('Phase 12 Operations Dashboards & RBAC Routes (Integration)', () => {
  const depotAId = new Types.ObjectId().toString();
  const depotBId = new Types.ObjectId().toString();
  const driverAId = new Types.ObjectId().toString();
  const driverBId = new Types.ObjectId().toString();
  const conductorAId = new Types.ObjectId().toString();

  const adminToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'admin@tnstc.perundhu.gov.in',
    role: 'ADMIN',
    sessionId: new Types.ObjectId().toString()
  });

  const transportAdminToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'transport.admin@tnstc.perundhu.gov.in',
    role: 'TRANSPORT_ADMIN',
    sessionId: new Types.ObjectId().toString()
  });

  const depotManagerAToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'manager.depotA@tnstc.perundhu.gov.in',
    role: 'DEPOT_MANAGER',
    depotId: depotAId,
    sessionId: new Types.ObjectId().toString()
  });

  const dispatcherAToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'dispatcher.depotA@tnstc.perundhu.gov.in',
    role: 'DISPATCHER',
    depotId: depotAId,
    sessionId: new Types.ObjectId().toString()
  });

  const driverAToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'driver.a@tnstc.perundhu.gov.in',
    role: 'DRIVER',
    crewMemberId: driverAId,
    sessionId: new Types.ObjectId().toString()
  });

  const conductorAToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'conductor.a@tnstc.perundhu.gov.in',
    role: 'CONDUCTOR',
    crewMemberId: conductorAId,
    sessionId: new Types.ObjectId().toString()
  });

  const passengerToken = signAccessToken({
    sub: new Types.ObjectId().toString(),
    email: 'citizen@example.com',
    role: 'PASSENGER',
    sessionId: new Types.ObjectId().toString()
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. RBAC & Access Control
  // =========================================================================
  describe('RBAC Protection & Access Control', () => {
    it('should reject unauthenticated requests to all dashboard endpoints with 401', async () => {
      const endpoints = [
        '/api/v1/operations/dashboard/transport-admin',
        '/api/v1/operations/dashboard/depot-manager',
        '/api/v1/operations/dashboard/dispatcher',
        '/api/v1/operations/dashboard/driver',
        '/api/v1/operations/dashboard/conductor',
        '/api/v1/operations/reports/export?reportType=FLEET_STATUS'
      ];

      for (const path of endpoints) {
        const res = await request(app).get(path);
        expect(res.status).toBe(401);
      }
    });

    it('should reject passengers from administrative command centres with 403 Forbidden', async () => {
      const endpoints = [
        '/api/v1/operations/dashboard/transport-admin',
        '/api/v1/operations/dashboard/depot-manager',
        '/api/v1/operations/dashboard/dispatcher',
        '/api/v1/operations/reports/export?reportType=FLEET_STATUS'
      ];

      for (const path of endpoints) {
        const res = await request(app)
          .get(path)
          .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(403);
      }
    });

    it('should allow TRANSPORT_ADMIN and ADMIN to access transport admin dashboard', async () => {
      vi.spyOn(Bus, 'countDocuments').mockResolvedValue(45 as any);
      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      } as any);
      vi.spyOn(ScheduledTrip, 'countDocuments').mockResolvedValue(120 as any);
      vi.spyOn(CrewMember, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      } as any);
      vi.spyOn(ServiceAlert, 'countDocuments').mockResolvedValue(2 as any);
      vi.spyOn(ServiceAlert, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([])
          })
        })
      } as any);
      vi.spyOn(Depot, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: new Types.ObjectId(depotAId), code: 'MDU-CEN', nameEn: 'Madurai Central', nameTa: 'மதுரை மத்திய' }
        ])
      } as any);
      vi.spyOn(TransportDivision, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      } as any);
      vi.spyOn(Bus, 'aggregate').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/operations/dashboard/transport-admin')
        .set('Authorization', `Bearer ${transportAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalRegisteredBuses).toBe(45);
      expect(res.body.data.etaServiceStatus.status).toBe('OPERATIONAL');
    });
  });

  // =========================================================================
  // 2. Depot Manager Scope Isolation & Operations
  // =========================================================================
  describe('Depot Manager Scope Isolation', () => {
    it('should reject Depot Manager A when attempting to access Depot B with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/operations/dashboard/depot-manager?depotId=${depotBId}`)
        .set('Authorization', `Bearer ${depotManagerAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/restricted to your assigned depot/i);
    });

    it('should return depot operational metrics when Depot Manager queries their own depot', async () => {
      vi.spyOn(Depot, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(depotAId),
            code: 'MDU-CEN',
            nameEn: 'Madurai Central Depot',
            nameTa: 'மதுரை மத்திய பணிமனை',
            totalCapacity: 60
          })
        })
      } as any);

      vi.spyOn(Bus, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              registrationNumber: 'TN-58-N-1234',
              fleetNumber: 'MDU-101',
              vehicleType: 'DELUXE',
              status: 'IN_SERVICE',
              isReserveFleet: false
            }
          ])
        })
      } as any);

      vi.spyOn(ScheduledTrip, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([])
              })
            })
          })
        })
      } as any);

      vi.spyOn(CrewMember, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      } as any);

      vi.spyOn(DeviceRegistry, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      } as any);

      vi.spyOn(LatestBusPosition, 'find').mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      } as any);

      const res = await request(app)
        .get('/api/v1/operations/dashboard/depot-manager')
        .set('Authorization', `Bearer ${depotManagerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.depot.code).toBe('MDU-CEN');
      expect(res.body.data.fleetSummary.total).toBe(1);
    });
  });

  // =========================================================================
  // 3. Trip Bus & Staff Assignment Conflict Validations
  // =========================================================================
  describe('Trip Assignments & Conflict Protection', () => {
    it('should reject assigning a bus belonging to another depot with 403 Forbidden', async () => {
      const tripId = new Types.ObjectId().toString();
      const busId = new Types.ObjectId().toString();

      vi.spyOn(ScheduledTrip, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(tripId),
        depotId: new Types.ObjectId(depotAId),
        tripCode: 'TRIP-70-01'
      } as any);

      vi.spyOn(Bus, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(busId),
        registrationNumber: 'TN-58-N-9999',
        depotId: new Types.ObjectId(depotBId), // Bus belongs to Depot B!
        isActive: true,
        status: 'AVAILABLE'
      } as any);

      const res = await request(app)
        .post('/api/v1/operations/assignments/trip-bus')
        .set('Authorization', `Bearer ${depotManagerAToken}`)
        .send({ tripId, busId });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/cannot assign a bus belonging to another depot/i);
    });

    it('should reject assigning a bus actively in transit on another trip with 409 Conflict', async () => {
      const tripId = new Types.ObjectId().toString();
      const busId = new Types.ObjectId().toString();
      const conflictingTripId = new Types.ObjectId().toString();

      vi.spyOn(ScheduledTrip, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(tripId),
        depotId: new Types.ObjectId(depotAId),
        tripCode: 'TRIP-70-01'
      } as any);

      vi.spyOn(Bus, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(busId),
        registrationNumber: 'TN-58-N-1234',
        depotId: new Types.ObjectId(depotAId),
        isActive: true,
        status: 'IN_SERVICE',
        currentAssignedTripId: new Types.ObjectId(conflictingTripId)
      } as any);

      const res = await request(app)
        .post('/api/v1/operations/assignments/trip-bus')
        .set('Authorization', `Bearer ${depotManagerAToken}`)
        .send({ tripId, busId });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already actively operating another trip/i);
    });

    it('should reject assigning a driver currently ON_LEAVE with 400 Validation Error', async () => {
      const tripId = new Types.ObjectId().toString();
      const driverId = new Types.ObjectId().toString();

      vi.spyOn(ScheduledTrip, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(tripId),
        depotId: new Types.ObjectId(depotAId),
        tripCode: 'TRIP-70-01'
      } as any);

      vi.spyOn(CrewMember, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(driverId),
        fullName: 'Murugan K',
        depotId: new Types.ObjectId(depotAId),
        role: 'DRIVER',
        isActive: true,
        status: 'ON_LEAVE'
      } as any);

      const res = await request(app)
        .post('/api/v1/operations/assignments/trip-driver')
        .set('Authorization', `Bearer ${depotManagerAToken}`)
        .send({ tripId, driverId });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/ON_LEAVE and cannot be assigned/i);
    });
  });

  // =========================================================================
  // 4. Driver Workflow Lifecycle
  // =========================================================================
  describe('Driver Trip Lifecycle Actions', () => {
    it('should reject driver starting another driver\'s trip with 403 Forbidden', async () => {
      const tripId = new Types.ObjectId().toString();

      vi.spyOn(ScheduledTrip, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(tripId),
        driverId: new Types.ObjectId(driverBId), // Assigned to Driver B!
        status: 'SCHEDULED'
      } as any);

      const res = await request(app)
        .post(`/api/v1/operations/driver/trips/${tripId}/start`)
        .set('Authorization', `Bearer ${driverAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/not assigned to this trip/i);
    });

    it('should successfully confirm readiness, start trip, and complete trip by authorized driver', async () => {
      const tripId = new Types.ObjectId().toString();
      const mockTrip = {
        _id: new Types.ObjectId(tripId),
        driverId: new Types.ObjectId(driverAId),
        busId: new Types.ObjectId(),
        status: 'SCHEDULED',
        metadata: {},
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(ScheduledTrip, 'findById').mockResolvedValue(mockTrip as any);
      vi.spyOn(Bus, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);
      vi.spyOn(CrewMember, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);

      // 1. Confirm readiness
      const readyRes = await request(app)
        .post(`/api/v1/operations/driver/trips/${tripId}/ready`)
        .set('Authorization', `Bearer ${driverAToken}`);
      expect(readyRes.status).toBe(200);
      expect(readyRes.body.data.success).toBe(true);

      // 2. Start trip
      const startRes = await request(app)
        .post(`/api/v1/operations/driver/trips/${tripId}/start`)
        .set('Authorization', `Bearer ${driverAToken}`);
      expect(startRes.status).toBe(200);
      expect(startRes.body.data.status).toBe('IN_TRANSIT');

      // 3. Complete trip
      mockTrip.status = 'IN_TRANSIT';
      const completeRes = await request(app)
        .post(`/api/v1/operations/driver/trips/${tripId}/complete`)
        .set('Authorization', `Bearer ${driverAToken}`);
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe('COMPLETED');
    });
  });

  // =========================================================================
  // 5. Conductor Dashboard & Honest ETM Telemetry
  // =========================================================================
  describe('Conductor Dashboard & Hardware Verification', () => {
    it('should return conductor dashboard with honest ETM pending notice', async () => {
      vi.spyOn(CrewMember, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue({
              _id: new Types.ObjectId(conductorAId),
              fullName: 'Kandasamy S',
              badgeNumber: 'COND-401',
              role: 'CONDUCTOR',
              status: 'AVAILABLE',
              depotId: { nameEn: 'Madurai Central' },
              assignedEtmDeviceId: {
                _id: new Types.ObjectId(),
                deviceId: 'ETM-MDU-101',
                deviceModel: 'Verifone P400',
                deviceStatus: 'ACTIVE',
                batteryHealthPercent: 94
              }
            })
          })
        })
      } as any);

      vi.spyOn(ScheduledTrip, 'findOne').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(null)
            })
          })
        })
      } as any);

      vi.spyOn(ServiceAlert, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([])
          })
        })
      } as any);

      vi.spyOn(ScheduledTrip, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([])
            })
          })
        })
      } as any);

      const res = await request(app)
        .get('/api/v1/operations/dashboard/conductor')
        .set('Authorization', `Bearer ${conductorAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conductor.badgeNumber).toBe('COND-401');
      expect(res.body.data.etmDevice.telemetryNotice).toMatch(/ETM Ticketing Telemetry Pending Live Terminal Handshake/i);
    });
  });

  // =========================================================================
  // 6. CSV Export & Formula Injection Prevention
  // =========================================================================
  describe('CSV Export Security & Formula Injection Defense', () => {
    it('should sanitize cells starting with formula triggers (=, +, -, @) by prepending a single quote', async () => {
      vi.spyOn(Bus, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              registrationNumber: '=cmd|\'/C calc\'!A0', // Formula injection attempt!
              fleetNumber: '+919999999999',
              vehicleType: 'DELUXE',
              status: '@CRITICAL',
              depotId: { code: '-DEPOT-1', nameEn: 'Test Depot' },
              isReserveFleet: false
            }
          ])
        })
      } as any);

      const res = await request(app)
        .get('/api/v1/operations/reports/export?reportType=FLEET_STATUS')
        .set('Authorization', `Bearer ${transportAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain("'=cmd|'/C calc'!A0"); // Sanitized with leading quote!
      expect(res.text).toContain("'+919999999999");
      expect(res.text).toContain("'@CRITICAL");
      expect(res.text).toContain("'-DEPOT-1");
    });
  });
});
