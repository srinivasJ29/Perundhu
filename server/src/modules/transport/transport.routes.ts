import { Router } from 'express';
import { transportController } from './transport.controller';
import { validate } from '../../common/validation';
import { authenticate, requireRole } from '../auth/auth.middleware';
import {
  idParamSchema,
  createOrganizationSchema,
  listOrganizationsQuerySchema,
  createDivisionSchema,
  listDivisionsQuerySchema,
  createDepotSchema,
  updateDepotSchema,
  listDepotsQuerySchema,
  createWorkshopSchema,
  listWorkshopsQuerySchema,
  createCrewMemberSchema,
  updateCrewMemberStatusSchema,
  listCrewMembersQuerySchema,
  createDeviceRegistrySchema,
  assignDeviceSchema,
  listDevicesQuerySchema,
  createMaintenanceRecordSchema,
  updateMaintenanceStatusSchema,
  listMaintenanceRecordsQuerySchema,
  createVehicleReplacementSchema,
  updateReplacementStatusSchema,
  listVehicleReplacementsQuerySchema,
  updateDepotStatusSchema,
  reassignBackupDepotSchema,
  depotBusesQuerySchema,
  reserveFleetQuerySchema,
  setBusReserveStatusSchema,
  createDepotTransferSchema,
  transferActionSchema,
  listDepotTransfersQuerySchema,
  updateWorkshopSchema
} from './transport.validation';

const router = Router();

// ===========================================================================
// Public Read Endpoints
// ===========================================================================

// 1. Organizations
router.get(
  '/organizations',
  validate({ query: listOrganizationsQuerySchema }),
  (req, res, next) => transportController.listOrganizations(req, res, next)
);

router.get(
  '/organizations/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getOrganizationById(req, res, next)
);

// 2. Divisions
router.get(
  '/divisions',
  validate({ query: listDivisionsQuerySchema }),
  (req, res, next) => transportController.listDivisions(req, res, next)
);

router.get(
  '/divisions/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getDivisionById(req, res, next)
);

// 3. Depots
router.get(
  '/depots',
  validate({ query: listDepotsQuerySchema }),
  (req, res, next) => transportController.listDepots(req, res, next)
);

router.get(
  '/depots/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getDepotById(req, res, next)
);

// 4. Workshops
router.get(
  '/workshops',
  validate({ query: listWorkshopsQuerySchema }),
  (req, res, next) => transportController.listWorkshops(req, res, next)
);

router.get(
  '/workshops/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getWorkshopById(req, res, next)
);

// 5. Crew (sanitized public view)
router.get(
  '/crew',
  validate({ query: listCrewMembersQuerySchema }),
  (req, res, next) => transportController.listCrewMembers(req, res, next)
);

router.get(
  '/crew/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getCrewMemberById(req, res, next)
);

// ===========================================================================
// Protected Administrative Endpoints (ADMIN only)
// ===========================================================================

// 1. Organization Management
router.post(
  '/admin/organizations',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createOrganizationSchema }),
  (req, res, next) => transportController.createOrganization(req, res, next)
);

// 2. Division Management
router.post(
  '/admin/divisions',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createDivisionSchema }),
  (req, res, next) => transportController.createDivision(req, res, next)
);

// 3. Depot Management
router.post(
  '/admin/depots',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createDepotSchema }),
  (req, res, next) => transportController.createDepot(req, res, next)
);

router.patch(
  '/admin/depots/:id',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateDepotSchema }),
  (req, res, next) => transportController.updateDepot(req, res, next)
);

// 4. Workshop Management
router.post(
  '/admin/workshops',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createWorkshopSchema }),
  (req, res, next) => transportController.createWorkshop(req, res, next)
);

// 5. Crew Management (includes full PII)
router.post(
  '/admin/crew',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createCrewMemberSchema }),
  (req, res, next) => transportController.createCrewMember(req, res, next)
);

router.patch(
  '/admin/crew/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateCrewMemberStatusSchema }),
  (req, res, next) => transportController.updateCrewMemberStatus(req, res, next)
);

// 6. Device Registry Management
router.get(
  '/admin/devices',
  authenticate,
  requireRole('ADMIN'),
  validate({ query: listDevicesQuerySchema }),
  (req, res, next) => transportController.listDevices(req, res, next)
);

router.get(
  '/admin/devices/:id',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getDeviceById(req, res, next)
);

router.post(
  '/admin/devices',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createDeviceRegistrySchema }),
  (req, res, next) => transportController.createDevice(req, res, next)
);

router.post(
  '/admin/devices/:id/assign',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: assignDeviceSchema }),
  (req, res, next) => transportController.assignDevice(req, res, next)
);

// 7. Maintenance Records Management
router.get(
  '/admin/maintenance',
  authenticate,
  requireRole('ADMIN'),
  validate({ query: listMaintenanceRecordsQuerySchema }),
  (req, res, next) => transportController.listMaintenanceRecords(req, res, next)
);

router.get(
  '/admin/maintenance/:id',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getMaintenanceRecordById(req, res, next)
);

router.post(
  '/admin/maintenance',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createMaintenanceRecordSchema }),
  (req, res, next) => transportController.createMaintenanceRecord(req, res, next)
);

router.patch(
  '/admin/maintenance/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateMaintenanceStatusSchema }),
  (req, res, next) => transportController.updateMaintenanceStatus(req, res, next)
);

// 8. Vehicle Replacement Records Management
router.get(
  '/admin/replacements',
  authenticate,
  requireRole('ADMIN'),
  validate({ query: listVehicleReplacementsQuerySchema }),
  (req, res, next) => transportController.listVehicleReplacements(req, res, next)
);

router.get(
  '/admin/replacements/:id',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getVehicleReplacementById(req, res, next)
);

router.post(
  '/admin/replacements',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createVehicleReplacementSchema }),
  (req, res, next) => transportController.createVehicleReplacement(req, res, next)
);

router.patch(
  '/admin/replacements/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateReplacementStatusSchema }),
  (req, res, next) => transportController.updateReplacementStatus(req, res, next)
);

// ===========================================================================
// Phase 2: Depot Fleet, Backup Depots, Reserves, Workshops & Transfers
// ===========================================================================

// Global Operational Statistics (Real-time DB aggregated counts)
router.get(
  '/stats/operational',
  (req, res, next) => transportController.getGlobalTransportStats(req, res, next)
);

// Single Depot Fleet
router.get(
  '/depots/:id/buses',
  validate({ params: idParamSchema, query: depotBusesQuerySchema }),
  (req, res, next) => transportController.getDepotBuses(req, res, next)
);

// Linked Backup Depots & Reserve Availability
router.get(
  '/depots/:id/backup-depots',
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getBackupDepots(req, res, next)
);

// Single Depot Statistics
router.get(
  '/depots/:id/stats',
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getDepotStats(req, res, next)
);

// Reserve Fleet Overview (Public / Crew read)
router.get(
  '/reserve-fleet',
  validate({ query: reserveFleetQuerySchema }),
  (req, res, next) => transportController.getReserveFleet(req, res, next)
);

// ---------------------------------------------------------------------------
// Protected Administrative Operations for Phase 2 (ADMIN only)
// ---------------------------------------------------------------------------

// Reassign backup depot primary relationship
router.patch(
  '/admin/depots/:id/primary',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: reassignBackupDepotSchema }),
  (req, res, next) => transportController.reassignBackupDepot(req, res, next)
);

// Update Depot Status (Activate / Deactivate)
router.patch(
  '/admin/depots/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateDepotStatusSchema }),
  (req, res, next) => transportController.updateDepotStatus(req, res, next)
);

// Mark / Unmark Bus Reserve Fleet Status
router.patch(
  '/admin/buses/:id/reserve',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: setBusReserveStatusSchema }),
  (req, res, next) => transportController.setBusReserveStatus(req, res, next)
);

// Update Workshop Details & Capabilities
router.patch(
  '/admin/workshops/:id',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: updateWorkshopSchema }),
  (req, res, next) => transportController.updateWorkshop(req, res, next)
);

// Depot Transfers Management
router.get(
  '/admin/transfers',
  authenticate,
  requireRole('ADMIN'),
  validate({ query: listDepotTransfersQuerySchema }),
  (req, res, next) => transportController.listDepotTransfers(req, res, next)
);

router.get(
  '/admin/transfers/:id',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema }),
  (req, res, next) => transportController.getDepotTransferById(req, res, next)
);

router.post(
  '/admin/transfers',
  authenticate,
  requireRole('ADMIN'),
  validate({ body: createDepotTransferSchema }),
  (req, res, next) => transportController.requestDepotTransfer(req, res, next)
);

router.patch(
  '/admin/transfers/:id/approve',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: transferActionSchema }),
  (req, res, next) => transportController.approveDepotTransfer(req, res, next)
);

router.patch(
  '/admin/transfers/:id/reject',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: transferActionSchema }),
  (req, res, next) => transportController.rejectDepotTransfer(req, res, next)
);

router.patch(
  '/admin/transfers/:id/start-transit',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: transferActionSchema }),
  (req, res, next) => transportController.startDepotTransferTransit(req, res, next)
);

router.patch(
  '/admin/transfers/:id/complete',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: transferActionSchema }),
  (req, res, next) => transportController.completeDepotTransfer(req, res, next)
);

router.patch(
  '/admin/transfers/:id/cancel',
  authenticate,
  requireRole('ADMIN'),
  validate({ params: idParamSchema, body: transferActionSchema }),
  (req, res, next) => transportController.cancelDepotTransfer(req, res, next)
);

export const transportRoutes = router;
