import { Router } from 'express';
import { busStandController } from './busStand.controller';
import { validate } from '../../common/validation';
import { authenticate, requireRole } from '../auth/auth.middleware';
import {
  nearbyBusStandsQuerySchema,
  standIdParamSchema,
  standRoutesQuerySchema,
  listBusStandsQuerySchema,
  createBusStandBodySchema,
  updateBusStandBodySchema
} from './busStand.validation';

import { heavyApiLimiter } from '../../common/middleware/rateLimiter';

const router = Router();

// 1. Nearby bus stands spatial query (Declared BEFORE :standId parameter routes)
router.get(
  '/bus-stands/nearby',
  heavyApiLimiter,
  validate({ query: nearbyBusStandsQuerySchema }),
  (req, res, next) => busStandController.getNearby(req, res, next)
);

// 2. List all bus stands with pagination and search
router.get(
  '/bus-stands',
  validate({ query: listBusStandsQuerySchema }),
  (req, res, next) => busStandController.listBusStands(req, res, next)
);

// 3. Single bus stand details
router.get(
  '/bus-stands/:standId',
  validate({ params: standIdParamSchema }),
  (req, res, next) => busStandController.getBusStandById(req, res, next)
);

// 4. Routes serving a specific bus stand
router.get(
  '/bus-stands/:standId/routes',
  validate({ params: standIdParamSchema, query: standRoutesQuerySchema }),
  (req, res, next) => busStandController.getRoutes(req, res, next)
);

// ---------------------------------------------------------------------------
// Protected Administrative Operations (ADMIN only)
// ---------------------------------------------------------------------------

router.post(
  '/admin/bus-stands',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createBusStandBodySchema }),
  (req, res, next) => busStandController.createBusStand(req, res, next)
);

router.patch(
  '/admin/bus-stands/:standId',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: standIdParamSchema, body: updateBusStandBodySchema }),
  (req, res, next) => busStandController.updateBusStand(req, res, next)
);

export const busStandRoutes = router;
