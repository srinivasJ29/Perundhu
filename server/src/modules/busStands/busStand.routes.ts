import { Router } from 'express';
import { busStandController } from './busStand.controller';
import { validate } from '../../common/validation';
import {
  nearbyBusStandsQuerySchema,
  standIdParamSchema,
  standRoutesQuerySchema
} from './busStand.validation';

const router = Router();

// 1. Nearby bus stands spatial query (Declared BEFORE :standId parameter routes)
router.get(
  '/bus-stands/nearby',
  validate({ query: nearbyBusStandsQuerySchema }),
  (req, res, next) => busStandController.getNearby(req, res, next)
);

// 2. Routes serving a specific bus stand
router.get(
  '/bus-stands/:standId/routes',
  validate({ params: standIdParamSchema, query: standRoutesQuerySchema }),
  (req, res, next) => busStandController.getRoutes(req, res, next)
);

export const busStandRoutes = router;
