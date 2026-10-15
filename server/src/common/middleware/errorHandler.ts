import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../errors';
import { logger } from '../logger';
import { env } from '../../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal error occurred';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;

    if (!err.isOperational) {
      logger.error({ err, statusCode, errorCode }, `Critical non-operational error: ${err.message}`);
    }
  } else {
    // Unhandled error / programming fault
    logger.error({ err }, `Unhandled exception caught by error middleware: ${err.message}`);
    // In development mode, provide the actual error message
    if (env.NODE_ENV === 'development') {
      message = err.message || message;
    }
  }

  const responsePayload: ErrorResponse = {
    error: {
      code: errorCode,
      message,
      ...(details !== undefined && { details }),
      timestamp: new Date().toISOString()
    }
  };

  res.status(statusCode).json(responsePayload);
}
