import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from '../../common/validation';

export const busOperationalStatusEnum = z.enum([
  'IN_SERVICE',
  'MAINTENANCE',
  'OFFLINE',
  'AVAILABLE',
  'RESERVED',
  'UNDER_MAINTENANCE',
  'BREAKDOWN',
  'INACTIVE'
]);

export const fuelTypeEnum = z.enum(['DIESEL', 'CNG', 'ELECTRIC', 'HYBRID']);

export const listBusesQuerySchema = paginationQuerySchema.extend({
  status: busOperationalStatusEnum.optional(),
  vehicleType: z.enum(['ORDINARY_NON_AC', 'DELUXE', 'ULTRA_DELUXE']).optional(),
  depotName: z.string().trim().min(1).optional(),
  depotId: objectIdSchema.optional(),
  isReserveFleet: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  manufacturer: z.string().trim().min(1).optional(),
  fuelType: fuelTypeEnum.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  q: z.string().trim().min(1).optional()
});

export type ListBusesQuery = z.infer<typeof listBusesQuerySchema>;

export const busIdParamSchema = z.object({
  busId: objectIdSchema
});

export const busTripsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).optional(),
  dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional()
});

export type BusTripsQuery = z.infer<typeof busTripsQuerySchema>;

export const createBusBodySchema = z.object({
  registrationNumber: z
    .string({ required_error: 'Bus registration number is required' })
    .trim()
    .min(6, 'Registration number must be at least 6 characters')
    .max(20, 'Registration number cannot exceed 20 characters')
    .transform((val) => val.toUpperCase()),
  fleetNumber: z
    .string({ required_error: 'Fleet number is required' })
    .trim()
    .min(3, 'Fleet number must be at least 3 characters')
    .max(30, 'Fleet number cannot exceed 30 characters')
    .transform((val) => val.toUpperCase()),
  depotName: z
    .string({ required_error: 'Depot name is required' })
    .trim()
    .min(2, 'Depot name must be at least 2 characters'),
  vehicleType: z
    .enum(['ORDINARY_NON_AC', 'DELUXE', 'ULTRA_DELUXE'])
    .default('ORDINARY_NON_AC'),
  status: busOperationalStatusEnum.default('IN_SERVICE'),
  depotId: objectIdSchema.optional(),
  homeDepotId: objectIdSchema.optional(),
  isReserveFleet: z.boolean().default(false).optional(),
  manufacturer: z.string().trim().min(1).max(100).optional(),
  vehicleModel: z.string().trim().min(1).max(100).optional(),
  fuelType: fuelTypeEnum.default('DIESEL').optional(),
  seatingCapacity: z.number().int().min(1).max(120).optional(),
  chassisNumber: z.string().trim().max(50).optional(),
  engineNumber: z.string().trim().max(50).optional(),
  registrationDate: z.string().datetime().optional()
});

export type CreateBusBody = z.infer<typeof createBusBodySchema>;

export const updateBusBodySchema = z.object({
  manufacturer: z.string().trim().min(1).max(100).optional(),
  vehicleModel: z.string().trim().min(1).max(100).optional(),
  vehicleType: z.enum(['ORDINARY_NON_AC', 'DELUXE', 'ULTRA_DELUXE']).optional(),
  fuelType: fuelTypeEnum.optional(),
  seatingCapacity: z.number().int().min(1).max(120).optional(),
  chassisNumber: z.string().trim().max(50).optional(),
  engineNumber: z.string().trim().max(50).optional(),
  depotName: z.string().trim().min(2).optional(),
  depotId: objectIdSchema.optional(),
  homeDepotId: objectIdSchema.optional(),
  isReserveFleet: z.boolean().optional(),
  currentOdometerKm: z.number().min(0).optional()
});

export type UpdateBusBody = z.infer<typeof updateBusBodySchema>;

export const assignBusDepotBodySchema = z.object({
  depotId: objectIdSchema,
  notes: z.string().trim().max(500).optional()
});

export type AssignBusDepotBody = z.infer<typeof assignBusDepotBodySchema>;

export const updateBusStatusBodySchema = z.object({
  status: busOperationalStatusEnum
});

export type UpdateBusStatusBody = z.infer<typeof updateBusStatusBodySchema>;
