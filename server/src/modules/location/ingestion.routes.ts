import { Router } from 'express';
import { ingestionController } from './ingestion.controller';
import { verifyGpsHmacSignature } from './ingestion.middleware';
import {
  ingestLocationBodySchema,
  ingestBatchLocationBodySchema
} from './ingestion.validation';
import { validate } from '../../common/validation';
import { ingestionLimiter } from '../../common/middleware/rateLimiter';

const router = Router();

/**
 * Single External GPS Ingestion Endpoint.
 * Authenticated via raw body HMAC-SHA256 signature, freshness window, and anti-replay nonce cache.
 */
router.post(
  '/ingest',
  ingestionLimiter,
  verifyGpsHmacSignature,
  validate({ body: ingestLocationBodySchema }),
  (req, res, next) => ingestionController.ingest(req, res, next)
);

/**
 * Offline Batch Telemetry Ingestion Endpoint.
 * Ingests chronologically ordered batches from devices recovering from temporary network dead zones.
 */
router.post(
  '/ingest/batch',
  ingestionLimiter,
  verifyGpsHmacSignature,
  validate({ body: ingestBatchLocationBodySchema }),
  (req, res, next) => ingestionController.ingestBatch(req, res, next)
);

/**
 * Telemetry Observability & Metrics Endpoint.
 * Reports aggregated metrics: message rates, latencies, rejection reasons, and source distributions.
 */
router.get('/metrics', (req, res) => ingestionController.getMetrics(req, res));

export const ingestionRoutes = router;
