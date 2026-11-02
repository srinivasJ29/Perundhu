import { Router } from 'express';
import { crewController } from './crew.controller';
import { validate, objectIdSchema } from '../../common/validation';
import { authenticate, requireRole, optionalAuthenticate } from '../auth/auth.middleware';
import { z } from 'zod';
import {
  listCrewQuerySchema,
  createDriverBodySchema,
  updateDriverBodySchema,
  createConductorBodySchema,
  updateConductorBodySchema,
  updateCrewStatusBodySchema
} from './crew.validation';

const router = Router();

const driverIdParamSchema = z.object({ driverId: objectIdSchema });
const conductorIdParamSchema = z.object({ conductorId: objectIdSchema });
const crewIdParamSchema = z.object({ crewId: objectIdSchema });

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

router.get(
  '/drivers',
  optionalAuthenticate,
  validate({ query: listCrewQuerySchema }),
  (req, res, next) => crewController.listDrivers(req, res, next)
);

router.get(
  '/drivers/:driverId',
  optionalAuthenticate,
  validate({ params: driverIdParamSchema }),
  (req, res, next) => crewController.getDriverById(req, res, next)
);

router.get(
  '/drivers/:crewId/assignments',
  validate({ params: crewIdParamSchema }),
  (req, res, next) => crewController.getCrewAssignments(req, res, next)
);

router.post(
  '/admin/drivers',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createDriverBodySchema }),
  (req, res, next) => crewController.createDriver(req, res, next)
);

router.patch(
  '/admin/drivers/:driverId',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: driverIdParamSchema, body: updateDriverBodySchema }),
  (req, res, next) => crewController.updateDriver(req, res, next)
);

router.patch(
  '/admin/drivers/:crewId/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: crewIdParamSchema, body: updateCrewStatusBodySchema }),
  (req, res, next) => crewController.updateCrewStatus(req, res, next)
);

// ---------------------------------------------------------------------------
// Conductors
// ---------------------------------------------------------------------------

router.get(
  '/conductors',
  optionalAuthenticate,
  validate({ query: listCrewQuerySchema }),
  (req, res, next) => crewController.listConductors(req, res, next)
);

router.get(
  '/conductors/:conductorId',
  optionalAuthenticate,
  validate({ params: conductorIdParamSchema }),
  (req, res, next) => crewController.getConductorById(req, res, next)
);

router.get(
  '/conductors/:crewId/assignments',
  validate({ params: crewIdParamSchema }),
  (req, res, next) => crewController.getCrewAssignments(req, res, next)
);

router.post(
  '/admin/conductors',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createConductorBodySchema }),
  (req, res, next) => crewController.createConductor(req, res, next)
);

router.patch(
  '/admin/conductors/:conductorId',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: conductorIdParamSchema, body: updateConductorBodySchema }),
  (req, res, next) => crewController.updateConductor(req, res, next)
);

router.patch(
  '/admin/conductors/:crewId/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: crewIdParamSchema, body: updateCrewStatusBodySchema }),
  (req, res, next) => crewController.updateCrewStatus(req, res, next)
);

export const crewRoutes = router;

