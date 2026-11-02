import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from '../../common/validation';

export const gpsAvailabilityStatusEnum = z.enum([
  'VERIFIED_AVAILABLE',
  'VERIFIED_UNAVAILABLE',
  'UNKNOWN'
]);

export const deviceStatusEnum = z.enum([
  'ACTIVE',
  'STANDBY',
  'INACTIVE',
  'UNDER_MAINTENANCE',
  'MAINTENANCE',
  'FAULTY',
  'UNREGISTERED',
  'DECOMMISSIONED'
]);

export const deviceHealthEnum = z.enum(['HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE']);
export const installationStatusEnum = z.enum(['INSTALLED', 'UNINSTALLED', 'PENDING_INSTALLATION']);

export const listDevicesQuerySchema = paginationQuerySchema.extend({
  deviceCategory: z.enum(['ETM', 'GPS_TRACKER']).optional(),
  depotId: objectIdSchema.optional(),
  status: deviceStatusEnum.optional(),
  gpsAvailabilityStatus: gpsAvailabilityStatusEnum.optional(),
  q: z.string().trim().min(1).optional()
});

export type ListDevicesQuery = z.infer<typeof listDevicesQuerySchema>;

export const deviceParamSchema = z.object({
  id: objectIdSchema
});

export const createEtmBodySchema = z.object({
  deviceId: z
    .string({ required_error: 'Device ID is required' })
    .trim()
    .min(3)
    .max(50)
    .transform((val) => val.toUpperCase()),
  manufacturer: z.string({ required_error: 'Manufacturer is required' }).trim().min(1).max(100),
  deviceModel: z.string({ required_error: 'Device model is required' }).trim().min(1).max(100),
  serialNumber: z.string().trim().max(100).optional(),
  depotId: objectIdSchema,
  gpsAvailabilityStatus: gpsAvailabilityStatusEnum.default('UNKNOWN'),
  operatingSystem: z.string().trim().max(80).optional(),
  firmwareVersion: z.string().trim().max(50).optional(),
  simIccid: z.string().trim().max(30).optional(),
  simPhoneNumber: z.string().trim().max(20).optional(),
  networkGenerations: z.array(z.enum(['2G', '3G', '4G', '5G'])).default(['4G']).optional(),
  status: deviceStatusEnum.default('ACTIVE').optional()
});

export type CreateEtmBody = z.infer<typeof createEtmBodySchema>;

export const updateEtmBodySchema = z.object({
  manufacturer: z.string().trim().min(1).max(100).optional(),
  deviceModel: z.string().trim().min(1).max(100).optional(),
  serialNumber: z.string().trim().max(100).optional(),
  depotId: objectIdSchema.optional(),
  gpsAvailabilityStatus: gpsAvailabilityStatusEnum.optional(),
  gpsVerificationStatus: z.string().trim().max(80).optional(),
  operatingSystem: z.string().trim().max(80).optional(),
  firmwareVersion: z.string().trim().max(50).optional(),
  status: deviceStatusEnum.optional()
});

export type UpdateEtmBody = z.infer<typeof updateEtmBodySchema>;

export const createGpsTrackerBodySchema = z.object({
  deviceId: z
    .string({ required_error: 'Tracker ID is required' })
    .trim()
    .min(3)
    .max(50)
    .transform((val) => val.toUpperCase()),
  manufacturer: z.string({ required_error: 'Manufacturer is required' }).trim().min(1).max(100),
  deviceModel: z.string({ required_error: 'Device model is required' }).trim().min(1).max(100),
  serialNumber: z.string().trim().max(100).optional(),
  depotId: objectIdSchema,
  supportedProtocols: z.array(z.string().trim()).default(['HTTP', 'HTTPS', 'MQTT', 'TCP']).optional(),
  networkGenerations: z.array(z.enum(['2G', '3G', '4G', '5G'])).default(['4G']).optional(),
  installationStatus: installationStatusEnum.default('UNINSTALLED').optional(),
  status: deviceStatusEnum.default('ACTIVE').optional()
});

export type CreateGpsTrackerBody = z.infer<typeof createGpsTrackerBodySchema>;

export const updateGpsTrackerBodySchema = z.object({
  manufacturer: z.string().trim().min(1).max(100).optional(),
  deviceModel: z.string().trim().min(1).max(100).optional(),
  serialNumber: z.string().trim().max(100).optional(),
  depotId: objectIdSchema.optional(),
  supportedProtocols: z.array(z.string().trim()).optional(),
  installationStatus: installationStatusEnum.optional(),
  status: deviceStatusEnum.optional()
});

export type UpdateGpsTrackerBody = z.infer<typeof updateGpsTrackerBodySchema>;

export const updateDeviceStatusBodySchema = z.object({
  status: deviceStatusEnum
});

export type UpdateDeviceStatusBody = z.infer<typeof updateDeviceStatusBodySchema>;

// Assignment Schemas
export const assignBusEtmBodySchema = z.object({
  busId: objectIdSchema,
  deviceId: objectIdSchema.nullable(),
  notes: z.string().trim().max(500).optional()
});

export type AssignBusEtmBody = z.infer<typeof assignBusEtmBodySchema>;

export const assignBusGpsBodySchema = z.object({
  busId: objectIdSchema,
  deviceId: objectIdSchema.nullable(),
  notes: z.string().trim().max(500).optional()
});

export type AssignBusGpsBody = z.infer<typeof assignBusGpsBodySchema>;

export const assignConductorEtmBodySchema = z.object({
  conductorId: objectIdSchema,
  deviceId: objectIdSchema.nullable(),
  notes: z.string().trim().max(500).optional()
});

export type AssignConductorEtmBody = z.infer<typeof assignConductorEtmBodySchema>;

export const assignDriverBusBodySchema = z.object({
  driverId: objectIdSchema,
  busId: objectIdSchema.nullable(),
  notes: z.string().trim().max(500).optional()
});

export type AssignDriverBusBody = z.infer<typeof assignDriverBusBodySchema>;

export const listAssignmentsQuerySchema = paginationQuerySchema.extend({
  assignmentType: z.enum(['BUS_ETM', 'BUS_GPS', 'CONDUCTOR_ETM', 'DRIVER_BUS', 'BUS_DEPOT']).optional(),
  busId: objectIdSchema.optional(),
  deviceId: objectIdSchema.optional(),
  crewMemberId: objectIdSchema.optional(),
  depotId: objectIdSchema.optional(),
  status: z.enum(['ACTIVE', 'UNASSIGNED', 'SUPERSEDED']).optional()
});

export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;

