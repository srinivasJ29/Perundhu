import { Router } from 'express';
import { healthRoutes } from '../modules/health';
import { districtRoutes } from '../modules/districts/district.routes';
import { busStandRoutes } from '../modules/busStands/busStand.routes';
import { routeRoutes } from '../modules/routes/route.routes';
import { authRoutes } from '../modules/auth/auth.routes';

const router = Router();

// Mount feature modules
router.use('/', healthRoutes);
router.use('/', districtRoutes);
router.use('/', busStandRoutes);
router.use('/', routeRoutes);
router.use('/auth', authRoutes);

export const apiRouter = router;
