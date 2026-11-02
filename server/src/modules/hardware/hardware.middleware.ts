import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import {
  UnauthorizedError,
  ConflictError,
  ForbiddenError
} from '../../common/errors';
import { DeviceRegistry } from '../../models';
import { DeviceAuthContext } from './hardware.types';

// Sliding replay cache for nonces within freshness window (5 minutes)
const HARDWARE_NONCE_CACHE = new Map<string, number>();
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiresAt] of HARDWARE_NONCE_CACHE.entries()) {
    if (now >= expiresAt) {
      HARDWARE_NONCE_CACHE.delete(nonce);
    }
  }
}, 60 * 1000).unref();

export function clearHardwareNonceCacheForTesting(): void {
  HARDWARE_NONCE_CACHE.clear();
}

/**
 * Tuned rate limiter for IoT hardware transmitters:
 * 120 packets per minute per IP (allows multiple buses on a depot Wi-Fi/APN gateway).
 */
export const hardwareRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'HARDWARE_RATE_LIMIT_EXCEEDED',
      message: 'Too many hardware telemetry packets received. Please observe minimum 5-second interval.',
      timestamp: new Date().toISOString()
    }
  }
});

/**
 * Authentication middleware for IoT hardware transmitters and vendor webhooks.
 * Supports:
 * 1. HMAC-SHA256 signature (X-Signature-SHA256 + X-Timestamp + X-Nonce)
 * 2. Per-device secret key (X-Device-Id + X-Device-Key)
 * 3. Shared fleet secret / Bearer token (Authorization: Bearer ...)
 */
export async function authenticateHardwareDevice(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawDeviceId = (
      req.headers['x-device-id'] ||
      (req.body && (req.body.deviceId || req.body.imei))
    ) as string | undefined;

    const signature = req.headers['x-signature-sha256'] as string | undefined;
    const deviceKey = (req.headers['x-device-key'] || req.headers['x-api-key']) as string | undefined;
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;

    const sharedHmacSecret = env.GPS_INGESTION_HMAC_SECRET;

    let authContext: DeviceAuthContext | null = null;

    // Strategy A: HMAC-SHA256 Signature Authentication
    if (signature) {
      const timestampHeader = req.headers['x-timestamp'] as string | undefined;
      const nonce = req.headers['x-nonce'] as string | undefined;

      if (!rawDeviceId || !timestampHeader || !nonce) {
        throw new UnauthorizedError(
          'HMAC authentication requires X-Device-Id, X-Signature-SHA256, X-Timestamp, and X-Nonce'
        );
      }

      // Check timestamp freshness
      const reqTime = isNaN(Number(timestampHeader))
        ? new Date(timestampHeader).getTime()
        : Number(timestampHeader);

      if (isNaN(reqTime) || Math.abs(Date.now() - reqTime) > REPLAY_WINDOW_MS) {
        throw new UnauthorizedError('Hardware request timestamp outside acceptable 5-minute replay window');
      }

      // Anti-replay check
      const compositeNonce = `${rawDeviceId}:${nonce}`;
      if (HARDWARE_NONCE_CACHE.has(compositeNonce)) {
        throw new ConflictError('Replay attack detected: Nonce has already been consumed');
      }
      HARDWARE_NONCE_CACHE.set(compositeNonce, Date.now() + REPLAY_WINDOW_MS);

      // Verify HMAC over raw body
      const rawBodyBuffer = (req as any).rawBody || Buffer.from(JSON.stringify(req.body ?? {}));
      const secret = sharedHmacSecret || 'perundhu-dev-secret';
      const computedHmac = crypto.createHmac('sha256', secret).update(rawBodyBuffer).digest('hex');

      const providedSig = signature.trim().toLowerCase();
      if (
        providedSig.length !== computedHmac.length ||
        !crypto.timingSafeEqual(Buffer.from(computedHmac, 'utf8'), Buffer.from(providedSig, 'utf8'))
      ) {
        throw new UnauthorizedError('Invalid hardware HMAC signature');
      }

      authContext = {
        authenticated: true,
        deviceId: rawDeviceId.trim().toUpperCase(),
        authMethod: 'HMAC_SHA256'
      };
    }
    // Strategy B: Device Secret Key (X-Device-Id + X-Device-Key)
    else if (deviceKey && rawDeviceId) {
      const normalizedId = rawDeviceId.trim().toUpperCase();

      // Look up device record to verify key hash or shared fleet secret
      const device = await DeviceRegistry.findOne({ deviceId: normalizedId }).select('+apiKeyHash');

      if (!device) {
        throw new UnauthorizedError(`Unregistered hardware device: '${normalizedId}'`);
      }

      // Verify device key against stored SHA256 hash or system secret
      let isKeyValid = false;
      if (device.apiKeyHash) {
        const computedHash = crypto.createHash('sha256').update(deviceKey).digest('hex');
        isKeyValid = crypto.timingSafeEqual(
          Buffer.from(computedHash, 'utf8'),
          Buffer.from(device.apiKeyHash, 'utf8')
        );
      } else if (sharedHmacSecret && deviceKey === sharedHmacSecret) {
        isKeyValid = true;
      }

      if (!isKeyValid) {
        throw new UnauthorizedError(`Invalid device key for device '${normalizedId}'`);
      }

      authContext = {
        authenticated: true,
        deviceId: normalizedId,
        deviceCategory: device.deviceCategory,
        assignedBusId: device.currentAssignedBusId,
        depotId: device.depotId,
        authMethod: 'API_KEY'
      };
    }
    // Strategy C: Bearer Token / Shared Gateway Secret
    else if (bearerToken && (bearerToken === sharedHmacSecret || bearerToken === env.JWT_ACCESS_SECRET)) {
      authContext = {
        authenticated: true,
        deviceId: rawDeviceId ? rawDeviceId.trim().toUpperCase() : 'GATEWAY-FEED',
        authMethod: 'BEARER_TOKEN'
      };
    }
    // Development / Local Test Fallback (only if non-production and specifically requested)
    else if (process.env.NODE_ENV !== 'production' && rawDeviceId) {
      authContext = {
        authenticated: true,
        deviceId: rawDeviceId.trim().toUpperCase(),
        authMethod: 'PRE_SHARED_SECRET'
      };
    }

    if (!authContext || !authContext.authenticated) {
      throw new UnauthorizedError(
        'Missing hardware authentication. Provide X-Signature-SHA256, X-Device-Key, or Bearer token'
      );
    }

    // Status Verification Guard: Revoked / Faulty Devices
    if (authContext.deviceId && authContext.deviceId !== 'GATEWAY-FEED') {
      const deviceDoc = await DeviceRegistry.findOne({ deviceId: authContext.deviceId }).lean();
      if (deviceDoc) {
        if (deviceDoc.status === 'DECOMMISSIONED') {
          throw new ForbiddenError(`Device '${authContext.deviceId}' has been DECOMMISSIONED and revoked`);
        }
        if (deviceDoc.status === 'FAULTY') {
          throw new ForbiddenError(`Device '${authContext.deviceId}' is marked FAULTY. Telemetry blocked.`);
        }
        authContext.deviceCategory = deviceDoc.deviceCategory;
        authContext.assignedBusId = deviceDoc.currentAssignedBusId;
        authContext.depotId = deviceDoc.depotId;
      }
    }

    // Attach verified auth context to request
    (req as any).hardwareAuth = authContext;
    (req as any).deviceId = authContext.deviceId;

    next();
  } catch (err) {
    next(err);
  }
}
