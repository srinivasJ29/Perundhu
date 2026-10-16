import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-]{8,64}$/;

/**
 * Request correlation ID middleware.
 * Uses client-provided X-Request-Id or X-Correlation-Id if it conforms to safe alphanumeric/hyphen syntax,
 * otherwise generates a cryptographically random UUID v4.
 * Attaches the ID to req.id and sets the X-Request-Id response header.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = (req.headers['x-request-id'] || req.headers['x-correlation-id']) as string | undefined;
  let id: string;

  if (typeof incoming === 'string' && SAFE_ID_REGEX.test(incoming.trim())) {
    id = incoming.trim();
  } else {
    id = crypto.randomUUID();
  }

  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
