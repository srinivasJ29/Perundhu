import { Router } from 'express';
import { deviceController } from './device.controller';
import { validate, objectIdSchema } from '../../common/validation';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { z } from 'zod';
import {
  listDevicesQuerySchema,
  createEtmBodySchema,
  updateEtmBodySchema,
  createGpsTrackerBodySchema,
  updateGpsTrackerBodySchema,
  updateDeviceStatusBodySchema,
  assignBusEtmBodySchema,
  assignBusGpsBodySchema,
  assignConductorEtmBodySchema,
  assignDriverBusBodySchema,
  listAssignmentsQuerySchema
} from './device.validation';

const router = Router();
const idParamSchema = z.object({ id: objectIdSchema });

// ---------------------------------------------------------------------------
// ETM Devices
// ---------------------------------------------------------------------------

router.get(
  '/devices/etms',
  validate({ query: listDevicesQuerySchema }),
  (req, res, next) => deviceController.listEtms(req, res, next)
);

router.get(
  '/devices/etms/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => deviceController.getEtmById(req, res, next)
);

router.post(
  '/admin/devices/etms',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createEtmBodySchema }),
  (req, res, next) => deviceController.createEtm(req, res, next)
);

router.patch(
  '/admin/devices/etms/:id',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateEtmBodySchema }),
  (req, res, next) => deviceController.updateEtm(req, res, next)
);

router.patch(
  '/admin/devices/etms/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateDeviceStatusBodySchema }),
  (req, res, next) => deviceController.updateDeviceStatus(req, res, next)
);

// ---------------------------------------------------------------------------
// GPS Trackers
// ---------------------------------------------------------------------------

router.get(
  '/devices/gps-trackers',
  validate({ query: listDevicesQuerySchema }),
  (req, res, next) => deviceController.listGpsTrackers(req, res, next)
);

router.get(
  '/devices/gps-trackers/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => deviceController.getGpsTrackerById(req, res, next)
);

router.post(
  '/admin/devices/gps-trackers',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createGpsTrackerBodySchema }),
  (req, res, next) => deviceController.createGpsTracker(req, res, next)
);

router.patch(
  '/admin/devices/gps-trackers/:id',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateGpsTrackerBodySchema }),
  (req, res, next) => deviceController.updateGpsTracker(req, res, next)
);

router.patch(
  '/admin/devices/gps-trackers/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateDeviceStatusBodySchema }),
  (req, res, next) => deviceController.updateDeviceStatus(req, res, next)
);

router.post(
  '/admin/devices/:id/rotate-credentials',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema }),
  (req, res, next) => deviceController.rotateCredentials(req, res, next)
);

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

router.post(
  '/admin/assignments/bus-etm',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: assignBusEtmBodySchema }),
  (req, res, next) => deviceController.assignBusEtm(req, res, next)
);

router.post(
  '/admin/assignments/bus-gps',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: assignBusGpsBodySchema }),
  (req, res, next) => deviceController.assignBusGps(req, res, next)
);

router.post(
  '/admin/assignments/conductor-etm',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: assignConductorEtmBodySchema }),
  (req, res, next) => deviceController.assignConductorEtm(req, res, next)
);

router.post(
  '/admin/assignments/driver-bus',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: assignDriverBusBodySchema }),
  (req, res, next) => deviceController.assignDriverBus(req, res, next)
);

router.get(
  '/admin/assignments',
  authenticate,
  requireRole('ADMIN'),
  validate({ query: listAssignmentsQuerySchema }),
  (req, res, next) => deviceController.listAssignments(req, res, next)
);

// ---------------------------------------------------------------------------
// Monitoring & Stats
// ---------------------------------------------------------------------------

router.get(
  '/stats/fleet-devices',
  (req, res, next) => deviceController.getFleetAndDeviceStats(req, res, next)
);

export const deviceRoutes = router;

