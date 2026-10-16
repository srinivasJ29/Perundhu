import { Router } from 'express';
import { simulatorController } from './simulator.controller';
import { validate } from '../../common/validation';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { startSimulatorBodySchema } from './simulator.validation';

import { adminLimiter } from '../../common/middleware/rateLimiter';

const router = Router();

// All simulator controls require authentication, ADMIN role, and administrative rate limiting
router.use('/admin/simulator', adminLimiter, authenticate, requireRole('ADMIN'));

router.get(
  '/admin/simulator/status',
  (req, res, next) => simulatorController.getStatus(req, res, next)
);

router.post(
  '/admin/simulator/start',
  validate({ body: startSimulatorBodySchema }),
  (req, res, next) => simulatorController.start(req, res, next)
);

router.post(
  '/admin/simulator/stop',
  (req, res, next) => simulatorController.stop(req, res, next)
);

router.post(
  '/admin/simulator/reset',
  (req, res, next) => simulatorController.reset(req, res, next)
);

export const simulatorRoutes = router;
