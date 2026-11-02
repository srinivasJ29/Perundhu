/**
 * PERUNDHU (பேருந்து) — Service Alert Routes
 */

import { Router } from 'express';
import { validate } from '../../common/validation';
import { alertController } from './alert.controller';
import { listAlertsQuerySchema, alertIdParamSchema } from './alert.validation';

const router = Router();

router.get(
  '/alerts',
  validate({ query: listAlertsQuerySchema }),
  (req, res, next) => alertController.listAlerts(req, res, next)
);

router.get(
  '/alerts/:alertId',
  validate({ params: alertIdParamSchema }),
  (req, res, next) => alertController.getAlertById(req, res, next)
);

export const alertRoutes = router;

