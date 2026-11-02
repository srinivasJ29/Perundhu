/**
 * PERUNDHU (பேருந்து) — Phase 12 Operations Routes
 * Server-side RBAC and organizational data isolation for Admin, Depot, Dispatcher,
 * Driver, and Conductor command centres.
 */

import { Router } from 'express';
import { operationsController } from './operations.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validate } from '../../common/validation';
import {
  depotManagerQuerySchema,
  dispatcherQuerySchema,
  tripIdParamSchema,
  assignTripBusBodySchema,
  assignTripDriverBodySchema,
  assignTripConductorBodySchema,
  addTripRemarkBodySchema,
  exportReportQuerySchema
} from './operations.validation';

const router = Router();

// ---------------------------------------------------------------------------
// 1. Role-Based Dashboards
// ---------------------------------------------------------------------------

// Transport Administrator Command Centre
router.get(
  '/dashboard/transport-admin',
  authenticate,
  requireRole('SUPER_ADMIN', 'TRANSPORT_ADMIN', 'ADMIN'),
  (req, res, next) => operationsController.getTransportAdminDashboard(req, res, next)
);

// Depot Manager Operational Dashboard
router.get(
  '/dashboard/depot-manager',
  authenticate,
  requireRole('SUPER_ADMIN', 'TRANSPORT_ADMIN', 'ADMIN', 'DEPOT_MANAGER'),
  validate({ query: depotManagerQuerySchema }),
  (req, res, next) => operationsController.getDepotManagerDashboard(req, res, next)
);

// Dispatcher Live Operations Radar
router.get(
  '/dashboard/dispatcher',
  authenticate,
  requireRole('SUPER_ADMIN', 'TRANSPORT_ADMIN', 'ADMIN', 'DEPOT_MANAGER', 'DISPATCHER'),
  validate({ query: dispatcherQuerySchema }),
  (req, res, next) => operationsController.getDispatcherDashboard(req, res, next)
);

// Driver Mobile-First Portal
router.get(
  '/dashboard/driver',
  authenticate,
  requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'),
  (req, res, next) => operationsController.getDriverDashboard(req, res, next)
);

// Conductor Mobile-First Portal
router.get(
  '/dashboard/conductor',
  authenticate,
  requireRole('CONDUCTOR', 'ADMIN', 'SUPER_ADMIN'),
  (req, res, next) => operationsController.getConductorDashboard(req, res, next)
);

// ---------------------------------------------------------------------------
// 2. Driver Operational Workflow Actions
// ---------------------------------------------------------------------------

router.post(
  '/driver/trips/:tripId/ready',
  authenticate,
  requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'),
  validate({ params: tripIdParamSchema }),
  (req, res, next) => operationsController.driverConfirmReady(req, res, next)
);

router.post(
  '/driver/trips/:tripId/start',
  authenticate,
  requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'),
  validate({ params: tripIdParamSchema }),
  (req, res, next) => operationsController.driverStartTrip(req, res, next)
);

router.post(
  '/driver/trips/:tripId/complete',
  authenticate,
  requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'),
  validate({ params: tripIdParamSchema }),
  (req, res, next) => operationsController.driverCompleteTrip(req, res, next)
);

// ---------------------------------------------------------------------------
// 3. Depot Assignment Workflows
// ---------------------------------------------------------------------------

router.post(
  '/assignments/trip-bus',
  authenticate,
  requireRole('SUPER_ADMIN', 'TRANSPORT_ADMIN', 'ADMIN', 'DEPOT_MANAGER'),
  validate({ body: assignTripBusBodySchema }),
  (req, res, next) => operationsController.assignTripBus(req, res, next)
);

router.post(
  '/assignments/trip-driver',
  authenticate,
  requireRole('SUPER_ADMIN', 'TRANSPORT_ADMIN', 'ADMIN', 'DEPOT_MANAGER'),
  validate({ body: assignTripDriverBodySchema }),
  (req, res, next) => operationsController.assignTripDriver(req, res, next)
);

router.post(
  '/assignments/trip-conductor',
  authenticate,
  requireRole('SUPER_ADMIN', 'TRANSPORT_ADMIN', 'ADMIN', 'DEPOT_MANAGER'),
  validate({ body: assignTripConductorBodySchema }),
  (req, res, next) => operationsController.assignTripConductor(req, res, next)
);

router.post(
  '/trips/:tripId/remarks',
  authenticate,
  requireRole('SUPER_ADMIN', 'TRANSPORT_ADMIN', 'ADMIN', 'DEPOT_MANAGER', 'DISPATCHER'),
  validate({ params: tripIdParamSchema, body: addTripRemarkBodySchema }),
  (req, res, next) => operationsController.addTripRemark(req, res, next)
);

// ---------------------------------------------------------------------------
// 4. Role-Authorized Sanitized CSV Export
// ---------------------------------------------------------------------------

router.get(
  '/reports/export',
  authenticate,
  requireRole('SUPER_ADMIN', 'TRANSPORT_ADMIN', 'ADMIN', 'DEPOT_MANAGER', 'ANALYST'),
  validate({ query: exportReportQuerySchema }),
  (req, res, next) => operationsController.exportReport(req, res, next)
);

export const operationsRoutes = router;

