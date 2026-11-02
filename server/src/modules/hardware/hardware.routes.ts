import { Router } from 'express';
import { hardwareController } from './hardware.controller';
import {
  hardwareRateLimiter,
  authenticateHardwareDevice
} from './hardware.middleware';
import {
  hardwareAdapterParamsSchema,
  validatePayloadBodySchema
} from './hardware.validation';
import { validate } from '../../common/validation';

const router = Router();

/**
 * Public Adapter & Bandwidth Discovery Endpoints
 */
router.get('/adapters', (req, res) => hardwareController.listAdapters(req, res));
router.get('/bandwidth-estimates', (req, res) => hardwareController.getBandwidthEstimates(req, res));

/**
 * Developer & Field Testing Sandbox (Sanitized Validation without Live Streaming)
 */
router.post(
  '/test/validate-payload',
  validate({ body: validatePayloadBodySchema }),
  (req, res, next) => hardwareController.validateTestPayload(req, res, next)
);

/**
 * Hardware Telemetry Ingestion Endpoints (Secured via multi-mode device auth & rate limiting)
 */
router.post(
  '/gps/ingest',
  hardwareRateLimiter,
  authenticateHardwareDevice,
  (req, res, next) => hardwareController.ingestAuto(req, res, next)
);

router.post(
  '/gps/:adapterId',
  hardwareRateLimiter,
  validate({ params: hardwareAdapterParamsSchema }),
  authenticateHardwareDevice,
  (req, res, next) => hardwareController.ingestSpecific(req, res, next)
);

export const hardwareRoutes = router;

