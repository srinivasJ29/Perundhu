import { Router } from 'express';
import { routeController } from './route.controller';
import { validate } from '../../common/validation';
import { routeDirectionParamsSchema } from './route.validation';

const router = Router();

router.get(
  '/routes/:routeId/directions/:directionId',
  validate({ params: routeDirectionParamsSchema }),
  (req, res, next) => routeController.getDirectionDetails(req, res, next)
);

export const routeRoutes = router;
