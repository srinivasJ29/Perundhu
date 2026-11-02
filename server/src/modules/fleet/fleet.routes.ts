import { Router } from 'express';
import { fleetController } from './fleet.controller';
import { validate } from '../../common/validation';
import {
  listFleetPositionsQuerySchema,
  fleetBusParamSchema
} from './fleet.validation';

const router = Router();

// Retrieve all buses with valid latest accepted positions
router.get(
  '/positions',
  validate({ query: listFleetPositionsQuerySchema }),
  (req, res, next) => fleetController.listFleetPositions(req, res, next)
);

// Retrieve live details for a selected bus
router.get(
  '/buses/:busId/live',
  validate({ params: fleetBusParamSchema }),
  (req, res, next) => fleetController.getBusLiveDetails(req, res, next)
);

export const fleetRoutes = router;

