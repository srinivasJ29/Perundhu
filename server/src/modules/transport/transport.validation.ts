import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from '../../common/validation';

export const idParamSchema = z.object({
  id: objectIdSchema
});

export const geoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // Longitude
    z.number().min(-90).max(90)    // Latitude
  ])
});

// ---------------------------------------------------------------------------
// 1. Transport Organization Schemas
// ---------------------------------------------------------------------------

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  shortName: z.string().trim().max(30).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const listOrganizationsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  q: z.string().trim().min(1).optional()
});

// ---------------------------------------------------------------------------
// 2. Transport Division Schemas
// ---------------------------------------------------------------------------

export const createDivisionSchema = z.object({
  organizationId: objectIdSchema,
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  districtId: objectIdSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

export const updateDivisionSchema = createDivisionSchema.partial();

export const listDivisionsQuerySchema = paginationQuerySchema.extend({
  organizationId: objectIdSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  q: z.string().trim().min(1).optional()
});

// ---------------------------------------------------------------------------
// 3. Depot Schemas
// ---------------------------------------------------------------------------

export const createDepotSchema = z.object({
  code: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  nameEn: z.string().trim().min(2).max(120),
  nameTa: z.string().trim().min(2).max(120),
  organizationId: objectIdSchema,
  divisionId: objectIdSchema.optional(),
  depotType: z.enum(['PRIMARY', 'SECONDARY', 'BACKUP']).default('PRIMARY'),
  primaryDepotId: objectIdSchema.optional(),
  sisterBackupDepotIds: z.array(objectIdSchema).optional(),
  location: geoPointSchema,
  totalCapacity: z.number().int().min(0).default(50),
  serviceBaysCount: z.number().int().min(0).default(5),
  fuelPumpsAvailable: z.number().int().min(0).default(2),
  associatedBusStandIds: z.array(objectIdSchema).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE']).default('ACTIVE')
});

export const updateDepotSchema = createDepotSchema.partial();

export const listDepotsQuerySchema = paginationQuerySchema.extend({
  organizationId: objectIdSchema.optional(),
  divisionId: objectIdSchema.optional(),
  depotType: z.enum(['PRIMARY', 'SECONDARY', 'BACKUP']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE']).optional(),
  q: z.string().trim().min(1).optional()
});

// ---------------------------------------------------------------------------
// 4. Workshop Schemas
// ---------------------------------------------------------------------------

export const createWorkshopSchema = z.object({
  code: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  nameEn: z.string().trim().min(2).max(120),
  nameTa: z.string().trim().min(2).max(120),
  organizationId: objectIdSchema,
  divisionId: objectIdSchema.optional(),
  depotId: objectIdSchema.optional(),
  workshopType: z
    .enum(['DEPOT_PIT_LANE', 'REGIONAL_CENTRAL_WORKSHOP'])
    .default('DEPOT_PIT_LANE'),
  location: geoPointSchema,
  totalBays: z.number().int().min(1).default(4),
  capabilities: z
    .array(
      z.enum([
        'ROUTINE_SERVICE',
        'MINOR_REPAIRS',
        'HEAVY_OVERHAUL',
        'BODY_REPAIR',
        'BODY_WORK',
        'ELECTRICAL',
        'TYRE_RETREADING',
        'FITNESS_INSPECTION',
        'FITNESS_CERTIFICATION'
      ])
    )
    .default(['ROUTINE_SERVICE', 'MINOR_REPAIRS']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_RENOVATION']).default('ACTIVE')
});

export const updateWorkshopSchema = createWorkshopSchema.partial();

export const listWorkshopsQuerySchema = paginationQuerySchema.extend({
  depotId: objectIdSchema.optional(),
  workshopType: z.enum(['DEPOT_PIT_LANE', 'REGIONAL_CENTRAL_WORKSHOP']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_RENOVATION']).optional(),
  q: z.string().trim().min(1).optional()
});

// ---------------------------------------------------------------------------
// 5. Crew Member Schemas
// ---------------------------------------------------------------------------

export const createCrewMemberSchema = z.object({
  employeeId: z.string().trim().min(3).max(30).transform((v) => v.toUpperCase()),
  badgeNumber: z.string().trim().min(2).max(30).transform((v) => v.toUpperCase()),
  fullName: z.string().trim().min(2).max(100),
  role: z.enum(['DRIVER', 'CONDUCTOR']),
  organizationId: objectIdSchema,
  divisionId: objectIdSchema.optional(),
  depotId: objectIdSchema,
  licenseNumber: z.string().trim().max(50).optional(),
  licenseExpiryDate: z.coerce.date().optional(),
  contactNumber: z.string().trim().max(20).optional(),
  status: z
    .enum(['ACTIVE', 'ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'SUSPENDED'])
    .default('ACTIVE')
});

export const updateCrewMemberStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'SUSPENDED']),
  currentAssignedBusId: objectIdSchema.optional().nullable(),
  currentAssignedTripId: objectIdSchema.optional().nullable()
});

export const listCrewMembersQuerySchema = paginationQuerySchema.extend({
  depotId: objectIdSchema.optional(),
  role: z.enum(['DRIVER', 'CONDUCTOR']).optional(),
  status: z.enum(['ACTIVE', 'ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'SUSPENDED']).optional(),
  q: z.string().trim().min(1).optional()
});

// ---------------------------------------------------------------------------
// 6. Device Registry Schemas
// ---------------------------------------------------------------------------

export const createDeviceRegistrySchema = z.object({
  deviceId: z.string().trim().min(3).max(50).transform((v) => v.toUpperCase()),
  deviceCategory: z.enum(['ETM', 'GPS_TRACKER']),
  manufacturer: z.string().trim().min(2).max(80),
  deviceModel: z.string().trim().min(2).max(80),
  serialNumber: z.string().trim().max(80).optional(),
  imei: z.string().trim().max(20).optional(),
  simIccid: z.string().trim().max(30).optional(),
  simPhoneNumber: z.string().trim().max(20).optional(),
  gpsAvailabilityStatus: z
    .enum(['VERIFIED_AVAILABLE', 'VERIFIED_UNAVAILABLE', 'UNKNOWN'])
    .default('UNKNOWN'),
  networkGenerations: z
    .array(z.enum(['2G', '3G', '4G', '5G']))
    .default(['4G']),
  status: z
    .enum(['ACTIVE', 'STANDBY', 'MAINTENANCE', 'DECOMMISSIONED'])
    .default('STANDBY'),
  depotId: objectIdSchema,
  batteryHealthPercent: z.number().int().min(0).max(100).optional()
});

export const assignDeviceSchema = z.object({
  assignedBusId: objectIdSchema.optional().nullable(),
  assignedCrewId: objectIdSchema.optional().nullable(),
  notes: z.string().trim().max(300).optional()
});

export const listDevicesQuerySchema = paginationQuerySchema.extend({
  deviceCategory: z.enum(['ETM', 'GPS_TRACKER']).optional(),
  gpsAvailabilityStatus: z
    .enum(['VERIFIED_AVAILABLE', 'VERIFIED_UNAVAILABLE', 'UNKNOWN'])
    .optional(),
  depotId: objectIdSchema.optional(),
  status: z
    .enum(['ACTIVE', 'STANDBY', 'MAINTENANCE', 'DECOMMISSIONED'])
    .optional(),
  q: z.string().trim().min(1).optional()
});

// ---------------------------------------------------------------------------
// 7. Maintenance Record Schemas
// ---------------------------------------------------------------------------

export const partReplacedSchema = z.object({
  partName: z.string().trim().min(1).max(100),
  partCode: z.string().trim().max(50).optional(),
  quantity: z.number().int().min(1).default(1)
});

export const createMaintenanceRecordSchema = z.object({
  recordNumber: z.string().trim().min(3).max(40).transform((v) => v.toUpperCase()),
  busId: objectIdSchema,
  depotId: objectIdSchema,
  workshopId: objectIdSchema.optional(),
  reportedByCrewId: objectIdSchema.optional(),
  maintenanceCategory: z.enum([
    'PREVENTIVE',
    'BREAKDOWN',
    'ACCIDENT',
    'ROUTINE_INSPECTION',
    'FITNESS_CERT'
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  issueDescription: z.string().trim().min(5).max(1000),
  odometerAtReportKm: z.number().min(0).optional(),
  partsReplaced: z.array(partReplacedSchema).optional().default([])
});

export const updateMaintenanceStatusSchema = z.object({
  repairStatus: z.enum([
    'REPORTED',
    'TRIAGED',
    'IN_PROGRESS',
    'WAITING_FOR_PARTS',
    'RESOLVED',
    'CLOSED'
  ]),
  repairNotes: z.string().trim().max(1000).optional(),
  technicianSignOff: z.string().trim().max(100).optional(),
  partsReplaced: z.array(partReplacedSchema).optional()
});

export const listMaintenanceRecordsQuerySchema = paginationQuerySchema.extend({
  busId: objectIdSchema.optional(),
  depotId: objectIdSchema.optional(),
  maintenanceCategory: z
    .enum(['PREVENTIVE', 'BREAKDOWN', 'ACCIDENT', 'ROUTINE_INSPECTION', 'FITNESS_CERT'])
    .optional(),
  repairStatus: z
    .enum([
      'REPORTED',
      'TRIAGED',
      'IN_PROGRESS',
      'WAITING_FOR_PARTS',
      'RESOLVED',
      'CLOSED'
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});

// ---------------------------------------------------------------------------
// 8. Vehicle Replacement Record Schemas
// ---------------------------------------------------------------------------

export const createVehicleReplacementSchema = z
  .object({
    replacementNumber: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .transform((v) => v.toUpperCase()),
    originalBusId: objectIdSchema,
    replacementBusId: objectIdSchema,
    tripId: objectIdSchema.optional(),
    routeId: objectIdSchema.optional(),
    originalDepotId: objectIdSchema,
    replacementDepotId: objectIdSchema,
    reason: z.enum([
      'BREAKDOWN',
      'ACCIDENT',
      'MAINTENANCE_DUE',
      'CREW_UNAVAILABLE',
      'OVERCROWDING',
      'OTHER'
    ]),
    reasonDetails: z.string().trim().max(500).optional(),
    driverReassignedId: objectIdSchema.optional(),
    conductorReassignedId: objectIdSchema.optional(),
    gpsReassignedDeviceId: objectIdSchema.optional(),
    passengersTransferred: z.boolean().default(false)
  })
  .refine((data) => data.originalBusId !== data.replacementBusId, {
    message: 'Replacement bus cannot be identical to the original bus',
    path: ['replacementBusId']
  });

export const updateReplacementStatusSchema = z.object({
  status: z.enum([
    'REQUESTED',
    'APPROVED',
    'DISPATCHED',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
  ]),
  notes: z.string().trim().max(500).optional(),
  passengersTransferred: z.boolean().optional()
});

export const listVehicleReplacementsQuerySchema = paginationQuerySchema.extend({
  originalBusId: objectIdSchema.optional(),
  replacementBusId: objectIdSchema.optional(),
  status: z
    .enum([
      'REQUESTED',
      'APPROVED',
      'DISPATCHED',
      'ACTIVE',
      'COMPLETED',
      'CANCELLED'
    ])
    .optional(),
  reason: z
    .enum([
      'BREAKDOWN',
      'ACCIDENT',
      'MAINTENANCE_DUE',
      'CREW_UNAVAILABLE',
      'OVERCROWDING',
      'OTHER'
    ])
    .optional()
});

// ---------------------------------------------------------------------------
// 9. Phase 2: Depot Fleet, Backup Depots & Transfers Schemas
// ---------------------------------------------------------------------------

export const updateDepotStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'])
});

export const reassignBackupDepotSchema = z.object({
  newPrimaryDepotId: objectIdSchema
});

export const depotBusesQuerySchema = paginationQuerySchema.extend({
  status: z.string().optional(),
  isReserveFleet: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  vehicleType: z.string().optional(),
  q: z.string().trim().min(1).optional()
});

export const reserveFleetQuerySchema = paginationQuerySchema.extend({
  depotId: objectIdSchema.optional(),
  status: z.string().optional(),
  q: z.string().trim().min(1).optional()
});

export const setBusReserveStatusSchema = z.object({
  isReserveFleet: z.boolean(),
  reason: z.string().trim().max(300).optional()
});

export const createDepotTransferSchema = z
  .object({
    transferNumber: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .transform((v) => v.toUpperCase()),
    busId: objectIdSchema,
    fromDepotId: objectIdSchema,
    toDepotId: objectIdSchema,
    reason: z
      .enum([
        'FLEET_REBALANCING',
        'MAINTENANCE_TRANSFER',
        'PERMANENT_REALLOCATION',
        'SEASONAL_DEMAND',
        'EMERGENCY_RELIEF',
        'OTHER'
      ])
      .default('FLEET_REBALANCING'),
    reasonDetails: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional()
  })
  .refine((data) => data.fromDepotId !== data.toDepotId, {
    message: 'Source and destination depots cannot be the same depot',
    path: ['toDepotId']
  });

export const transferActionSchema = z.object({
  notes: z.string().trim().max(500).optional()
});

export const listDepotTransfersQuerySchema = paginationQuerySchema.extend({
  busId: objectIdSchema.optional(),
  fromDepotId: objectIdSchema.optional(),
  toDepotId: objectIdSchema.optional(),
  status: z
    .enum([
      'REQUESTED',
      'APPROVED',
      'REJECTED',
      'IN_TRANSIT',
      'COMPLETED',
      'CANCELLED'
    ])
    .optional(),
  reason: z.string().optional(),
  q: z.string().trim().min(1).optional()
});

