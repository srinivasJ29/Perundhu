import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from '../../common/validation';

export const crewStatusEnum = z.enum([
  'AVAILABLE',
  'ASSIGNED',
  'ON_DUTY',
  'OFF_DUTY',
  'ON_LEAVE',
  'INACTIVE',
  'ACTIVE',
  'SUSPENDED'
]);

export const listCrewQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['DRIVER', 'CONDUCTOR']).optional(),
  depotId: objectIdSchema.optional(),
  status: crewStatusEnum.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  q: z.string().trim().min(1).optional()
});

export type ListCrewQuery = z.infer<typeof listCrewQuerySchema>;

export const crewIdParamSchema = z.object({
  crewId: objectIdSchema
});

export const createDriverBodySchema = z.object({
  employeeId: z
    .string({ required_error: 'Employee ID is required' })
    .trim()
    .min(3)
    .max(30)
    .transform((val) => val.toUpperCase()),
  badgeNumber: z
    .string({ required_error: 'Badge number is required' })
    .trim()
    .min(2)
    .max(30)
    .transform((val) => val.toUpperCase()),
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2)
    .max(100),
  organizationId: objectIdSchema,
  divisionId: objectIdSchema,
  depotId: objectIdSchema,
  licenseNumber: z.string().trim().max(50).optional(),
  licenseExpiryDate: z.string().datetime().optional(),
  contactNumber: z.string().trim().max(20).optional(),
  status: crewStatusEnum.default('AVAILABLE')
});

export type CreateDriverBody = z.infer<typeof createDriverBodySchema>;

export const updateDriverBodySchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  licenseNumber: z.string().trim().max(50).optional(),
  licenseExpiryDate: z.string().datetime().optional(),
  contactNumber: z.string().trim().max(20).optional(),
  depotId: objectIdSchema.optional(),
  status: crewStatusEnum.optional()
});

export type UpdateDriverBody = z.infer<typeof updateDriverBodySchema>;

export const createConductorBodySchema = z.object({
  employeeId: z
    .string({ required_error: 'Employee ID is required' })
    .trim()
    .min(3)
    .max(30)
    .transform((val) => val.toUpperCase()),
  badgeNumber: z
    .string({ required_error: 'Badge number is required' })
    .trim()
    .min(2)
    .max(30)
    .transform((val) => val.toUpperCase()),
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2)
    .max(100),
  organizationId: objectIdSchema,
  divisionId: objectIdSchema,
  depotId: objectIdSchema,
  contactNumber: z.string().trim().max(20).optional(),
  status: crewStatusEnum.default('AVAILABLE')
});

export type CreateConductorBody = z.infer<typeof createConductorBodySchema>;

export const updateConductorBodySchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  contactNumber: z.string().trim().max(20).optional(),
  depotId: objectIdSchema.optional(),
  status: crewStatusEnum.optional()
});

export type UpdateConductorBody = z.infer<typeof updateConductorBodySchema>;

export const updateCrewStatusBodySchema = z.object({
  status: crewStatusEnum
});

export type UpdateCrewStatusBody = z.infer<typeof updateCrewStatusBodySchema>;

