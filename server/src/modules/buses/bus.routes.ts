import { Router } from 'express';
import { busController } from './bus.controller';
import { fleetController } from '../fleet/fleet.controller';
import { validate } from '../../common/validation';
import { authenticate, requireRole } from '../auth/auth.middleware';
import {
  listBusesQuerySchema,
  busIdParamSchema,
  busTripsQuerySchema,
  createBusBodySchema,
  updateBusStatusBodySchema,
  updateBusBodySchema,
  assignBusDepotBodySchema
} from './bus.validation';
import {
  listFleetPositionsQuerySchema,
  fleetBusParamSchema
} from '../fleet/fleet.validation';

const router = Router();

// ---------------------------------------------------------------------------
// Public Read Endpoints
// ---------------------------------------------------------------------------

// Retrieve all live bus positions
router.get(
  '/buses/live',
  validate({ query: listFleetPositionsQuerySchema }),
  (req, res, next) => fleetController.listFleetPositions(req, res, next)
);

// Retrieve live details for a single bus
router.get(
  '/buses/:busId/live',
  validate({ params: fleetBusParamSchema }),
  (req, res, next) => fleetController.getBusLiveDetails(req, res, next)
);

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

router.get(
  '/buses/:busId/assignments',
  validate({ params: busIdParamSchema }),
  (req, res, next) => busController.getBusAssignments(req, res, next)
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
  '/admin/buses/:busId',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: busIdParamSchema, body: updateBusBodySchema }),
  (req, res, next) => busController.updateBus(req, res, next)
);

router.patch(
  '/admin/buses/:busId/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: busIdParamSchema, body: updateBusStatusBodySchema }),
  (req, res, next) => busController.updateBusStatus(req, res, next)
);

router.patch(
  '/admin/buses/:busId/depot',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: busIdParamSchema, body: assignBusDepotBodySchema }),
  (req, res, next) => busController.assignBusDepot(req, res, next)
);

export const busRoutes = router;
