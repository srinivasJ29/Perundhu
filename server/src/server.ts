import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { logger } from './common/logger';
import { connectDatabase, disconnectDatabase } from './infrastructure/database';

async function bootstrap(): Promise<void> {
  // 1. Initialize optional database connection
  try {
    await connectDatabase(env.MONGODB_URI);
  } catch (err) {
    logger.error({ err }, 'Database initialization failed. Proceeding with degraded readiness.');
  }

  // 2. Start HTTP Server
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(
      `TNSTC Live Tracking Backend started successfully on port ${env.PORT} [${env.NODE_ENV}]`
    );
    logger.info(`Health check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    logger.info(`Readiness check: http://localhost:${env.PORT}${env.API_PREFIX}/ready`);
  });

  // 3. Graceful Shutdown Handler
  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}. Initiating graceful server shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed.');

      try {
        await disconnectDatabase();
        logger.info('Graceful shutdown completed successfully.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error occurred during database disconnect.');
        process.exit(1);
      }
    });

    // Force close if graceful shutdown takes too long (10 seconds timeout)
    setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing process termination.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception detected! Initiating emergency shutdown.');
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled Promise Rejection detected! Initiating emergency shutdown.');
    gracefulShutdown('unhandledRejection');
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Bootstrap fatal error.');
  process.exit(1);
});
