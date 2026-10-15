import pinoHttp from 'pino-http';
import { logger } from '../logger';
import { env } from '../../config/env';

export const requestLogger = pinoHttp({
  logger,
  autoLogging: env.NODE_ENV !== 'test',
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
});
