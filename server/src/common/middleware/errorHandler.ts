import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../errors';
import { logger } from '../logger';
import { env } from '../../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal error occurred';
  let details: unknown = undefined;

  // 1. AppError instances (explicit operational and domain errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;

    if (!err.isOperational) {
      logger.error(
        { err, statusCode, errorCode, requestId: req.id },
        `Critical non-operational error: ${err.message}`
      );
    }
  }
  // 2. Body Parser: Malformed JSON syntax error
  else if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    statusCode = 400;
    errorCode = 'MALFORMED_JSON';
    message = 'Invalid JSON payload in request body';
  }
  // 3. Body Parser: Request body payload exceeds limit
  else if ((err as any).type === 'entity.too.large' || (err as any).status === 413) {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload exceeds allowable limit';
  }
  // 4. Mongoose: Malformed ObjectId / CastError
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_IDENTIFIER';
    message = 'Invalid resource identifier format';
  }
  // 5. MongoDB: Duplicate key violation (E11000)
  else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = 'A resource with this key already exists';
  }
  // 6. Generic unhandled error
  else {
    logger.error(
      { err, requestId: req.id },
      `Unhandled exception caught by error middleware: ${err.message}`
    );
    // In development mode, provide the actual error message
    if (env.NODE_ENV === 'development') {
      message = err.message || message;
    }
  }

  // Ensure requestId response header is set safely
  const reqIdStr = typeof req.id === 'string' ? req.id : (req.id ? String(req.id) : undefined);
  if (reqIdStr && !res.getHeader('X-Request-Id')) {
    res.setHeader('X-Request-Id', reqIdStr);
  }

  const responsePayload: ErrorResponse = {
    error: {
      code: errorCode,
      message,
      ...(details !== undefined && { details }),
      timestamp: new Date().toISOString(),
      ...(reqIdStr && { requestId: reqIdStr })
    }
  };

  res.status(statusCode).json(responsePayload);
}
