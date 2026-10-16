import { Request, Response, NextFunction } from 'express';

const DISALLOWED_METHODS = new Set(['TRACE', 'TRACK', 'CONNECT']);

/**
 * Rejects disallowed HTTP methods with HTTP 405 Method Not Allowed.
 * Protects against Cross-Site Tracing (XST) and arbitrary tunnel attacks.
 */
export function disallowUnsafeMethods(req: Request, res: Response, next: NextFunction): void {
  if (DISALLOWED_METHODS.has(req.method.toUpperCase())) {
    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `HTTP method ${req.method} is not allowed`,
        timestamp: new Date().toISOString(),
        ...(req.id && { requestId: req.id })
      }
    });
    return;
  }
  next();
}
