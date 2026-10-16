import { Router } from 'express';
import { tripController } from './trip.controller';
import { timetableController } from './timetable.controller';
import { validate } from '../../common/validation';
import { authenticate, requireRole } from '../auth/auth.middleware';
import {
  listTripsQuerySchema,
  tripIdParamSchema,
  activeTripsQuerySchema,
  createTripBodySchema,
  assignBusBodySchema,
  updateTripStatusBodySchema,
  updateTripStopTimesBodySchema
} from './trip.validation';
import {
  routeTimetableParamsSchema,
  routeTimetableQuerySchema,
  stopDeparturesParamsSchema,
  stopDeparturesQuerySchema
} from './timetable.validation';

const router = Router();

// ---------------------------------------------------------------------------
// Public Read Endpoints
// ---------------------------------------------------------------------------

router.get(
  '/trips',
  validate({ query: listTripsQuerySchema }),
  (req, res, next) => tripController.listTrips(req, res, next)
);

// Specific path `/trips/active` must precede parameterized `/trips/:tripId`
router.get(
  '/trips/active',
  validate({ query: activeTripsQuerySchema }),
  (req, res, next) => tripController.getActiveTrips(req, res, next)
);

router.get(
  '/trips/:tripId',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => tripController.getTripById(req, res, next)
);

router.get(
  '/routes/:routeId/timetable',
  validate({ params: routeTimetableParamsSchema, query: routeTimetableQuerySchema }),
  (req, res, next) => timetableController.getRouteTimetable(req, res, next)
);

router.get(
  '/stops/:stopId/departures',
  validate({ params: stopDeparturesParamsSchema, query: stopDeparturesQuerySchema }),
  (req, res, next) => timetableController.getStopDepartures(req, res, next)
);

// ---------------------------------------------------------------------------
// Protected Administrative Operations (Requires ADMIN Role)
// ---------------------------------------------------------------------------

router.post(
  '/admin/trips',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createTripBodySchema }),
  (req, res, next) => tripController.createTrip(req, res, next)
);

router.patch(
  '/admin/trips/:tripId/bus',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: tripIdParamSchema, body: assignBusBodySchema }),
  (req, res, next) => tripController.assignBus(req, res, next)
);

router.patch(
  '/admin/trips/:tripId/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: tripIdParamSchema, body: updateTripStatusBodySchema }),
  (req, res, next) => tripController.updateTripStatus(req, res, next)
);

router.put(
  '/admin/trips/:tripId/stop-times',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: tripIdParamSchema, body: updateTripStopTimesBodySchema }),
  (req, res, next) => tripController.updateTripStopTimes(req, res, next)
);

export const tripRoutes = router;
