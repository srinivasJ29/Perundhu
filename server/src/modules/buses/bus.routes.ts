import { Router } from 'express';
import { busController } from './bus.controller';
import { validate } from '../../common/validation';
import { authenticate, requireRole } from '../auth/auth.middleware';
import {
  listBusesQuerySchema,
  busIdParamSchema,
  busTripsQuerySchema,
  createBusBodySchema,
  updateBusStatusBodySchema
} from './bus.validation';

const router = Router();

// ---------------------------------------------------------------------------
// Public Read Endpoints
// ---------------------------------------------------------------------------

router.get(
  '/buses',
  validate({ query: listBusesQuerySchema }),
  (req, res, next) => busController.listBuses(req, res, next)
);

router.get(
  '/buses/:busId',
  validate({ params: busIdParamSchema }),
  (req, res, next) => busController.getBusById(req, res, next)
);

router.get(
  '/buses/:busId/trips',
  validate({ params: busIdParamSchema, query: busTripsQuerySchema }),
  (req, res, next) => busController.getBusTrips(req, res, next)
);

// ---------------------------------------------------------------------------
// Protected Administrative Operations
// ---------------------------------------------------------------------------

router.post(
  '/admin/buses',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createBusBodySchema }),
  (req, res, next) => busController.createBus(req, res, next)
);

router.patch(
  '/admin/buses/:busId/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: busIdParamSchema, body: updateBusStatusBodySchema }),
  (req, res, next) => busController.updateBusStatus(req, res, next)
);

export const busRoutes = router;
