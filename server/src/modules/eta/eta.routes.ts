import { Router } from 'express';
import { validate } from '../../common/validation';
import { etaController } from './eta.controller';
import { tripIdParamSchema, busIdParamSchema } from './eta.validation';

const router = Router();

// -----------------------------------------------------------------------------
// Passenger Next-Stop & Dynamic ETA Endpoints
// -----------------------------------------------------------------------------

router.get(
  '/trips/:tripId/next-stop',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => etaController.getNextStop(req, res, next)
);

router.get(
  '/trips/:tripId/eta',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => etaController.getTripEta(req, res, next)
);

router.get(
  '/buses/:busId/eta',
  validate({ params: busIdParamSchema }),
  (req, res, next) => etaController.getBusEta(req, res, next)
);

export const etaRoutes = router;
