import { Router } from 'express';
import { ingestionController } from './ingestion.controller';
import { verifyGpsHmacSignature } from './ingestion.middleware';
import { ingestLocationBodySchema } from './ingestion.validation';
import { validate } from '../../common/validation';
import { ingestionLimiter } from '../../common/middleware/rateLimiter';

const router = Router();

/**
 * External GPS Ingestion Endpoint.
 * Authenticated via raw body HMAC-SHA256 signature, freshness window, and anti-replay nonce cache.
 */
router.post(
  '/ingest',
  ingestionLimiter,
  verifyGpsHmacSignature,
  validate({ body: ingestLocationBodySchema }),
  (req, res, next) => ingestionController.ingest(req, res, next)
);

export const ingestionRoutes = router;
