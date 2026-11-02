import { Router } from 'express';
import { healthRoutes } from '../modules/health';
import { districtRoutes } from '../modules/districts/district.routes';
import { busStandRoutes } from '../modules/busStands/busStand.routes';
import { routeRoutes } from '../modules/routes/route.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { busRoutes } from '../modules/buses/bus.routes';
import { tripRoutes } from '../modules/trips/trip.routes';
import { simulatorRoutes, ingestionRoutes } from '../modules/location';
import { etaRoutes } from '../modules/eta/eta.routes';
import { transportRoutes } from '../modules/transport/transport.routes';
import { crewRoutes } from '../modules/crew/crew.routes';
import { deviceRoutes } from '../modules/devices/device.routes';
import { hardwareRoutes } from '../modules/hardware/hardware.routes';
import { fleetRoutes } from '../modules/fleet/fleet.routes';
import { alertRoutes } from '../modules/alerts/alert.routes';
import { analyticsRouter } from '../modules/analytics/analytics.routes';
import { operationsRoutes } from '../modules/operations/operations.routes';

const router = Router();

// Mount feature modules
router.use('/', healthRoutes);
router.use('/', alertRoutes);
router.use('/', districtRoutes);
router.use('/', busStandRoutes);
router.use('/', routeRoutes);
router.use('/', busRoutes);
router.use('/', tripRoutes);
router.use('/', etaRoutes);
router.use('/fleet', fleetRoutes);
router.use('/analytics', analyticsRouter);
router.use('/operations', operationsRoutes);
router.use('/', transportRoutes);
router.use('/', crewRoutes);
router.use('/', deviceRoutes);
router.use('/hardware', hardwareRoutes);
router.use('/', simulatorRoutes);
router.use('/location', ingestionRoutes);
router.use('/auth', authRoutes);

export const apiRouter = router;
