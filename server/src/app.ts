import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env, getAllowedOrigins } from './config/env';
import {
  requestIdMiddleware,
  disallowUnsafeMethods,
  requestLogger,
  notFoundHandler,
  errorHandler
} from './common/middleware';
import { AppError } from './common/errors';
import { apiRouter } from './routes';

export function createApp(): Application {
  const app: Application = express();

  // 1. Trust Proxy Configuration (only when explicitly configured for topology)
  if (env.TRUST_PROXY) {
    if (env.TRUST_PROXY === 'true') {
      app.set('trust proxy', true);
    } else if (env.TRUST_PROXY === 'false') {
      app.set('trust proxy', false);
    } else {
      app.set('trust proxy', env.TRUST_PROXY);
    }
  }

  // 2. Correlation / Request ID Middleware (first in stack)
  app.use(requestIdMiddleware);

  // 3. Reject Unsafe / Disallowed HTTP Methods (TRACE, TRACK, CONNECT)
  app.use(disallowUnsafeMethods);

  // 4. Hardened HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy:
        env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", ...getAllowedOrigins(env.CLIENT_ORIGIN)]
              }
            }
          : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      hidePoweredBy: true
    })
  );

  // 5. Explicit CORS Policy with Origin Allowlist Validation
  const allowedOrigins = getAllowedOrigins(env.CLIENT_ORIGIN);
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow server-to-server, mobile app, or CLI requests with no origin header
        if (!requestOrigin) {
          return callback(null, true);
        }

        if (
          allowedOrigins.includes(requestOrigin) ||
          (env.NODE_ENV !== 'production' && allowedOrigins.includes('*'))
        ) {
          return callback(null, true);
        }

        return callback(
          new AppError(
            `Origin '${requestOrigin}' is not allowed by CORS policy`,
            403,
            'CORS_REJECTED'
          )
        );
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-Id',
        'X-Correlation-Id',
        'X-Device-Id',
        'X-Signature-SHA256',
        'X-Timestamp',
        'X-Nonce'
      ],
      exposedHeaders: ['X-Request-Id']
    })
  );

  // 6. Request Body Parsing with strict size limits and raw body preservation for HMAC
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      }
    })
  );
  app.use(
    express.text({
      limit: '1mb',
      type: ['text/*', 'application/csv'],
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      }
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // 7. Request Logging with Request ID correlation
  app.use(requestLogger);

  // 8. Mount API Routes
  app.use(env.API_PREFIX, apiRouter);

  // 9. Fallthrough 404 Handler
  app.use(notFoundHandler);

  // 10. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
