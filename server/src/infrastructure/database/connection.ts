import mongoose from 'mongoose';
import { logger } from '../../common/logger';
import { env } from '../../config/env';

export type DatabaseStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'disconnecting'
  | 'unconfigured';

let isConfigured = false;
let mockReadyState: number | null = null;

/**
 * Masks credentials in MongoDB connection string for safe logging.
 */
function maskMongoUri(uri?: string): string {
  if (!uri) return 'unconfigured';
  return uri.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://$2:***@');
}

/**
 * Initializes the MongoDB connection using Mongoose.
 * Connects only if a non-empty URI is supplied, or enforces presence in production.
 */
export async function connectDatabase(uri?: string): Promise<typeof mongoose | null> {
  if (!uri || uri.trim() === '') {
    if (env.NODE_ENV === 'production') {
      const msg = 'Fatal: MONGODB_URI must be configured in production environment';
      logger.fatal(msg);
      throw new Error(msg);
    }
    logger.info('MongoDB URI is not configured. Skipping database connection.');
    isConfigured = false;
    return null;
  }

  isConfigured = true;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error occurred.');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected.');
  });

  try {
    logger.info(`Attempting connection to MongoDB (${maskMongoUri(uri)})...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    return mongoose;
  } catch (err) {
    logger.error({ err }, 'Failed to establish initial MongoDB connection.');
    throw err;
  }
}

/**
 * Gracefully disconnects from MongoDB.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB connection...');
    await mongoose.disconnect();
    logger.info('MongoDB disconnected.');
  }
}

/**
 * Returns the current normalized status of the database connection.
 */
export function getDatabaseStatus(): DatabaseStatus {
  if (!isConfigured) {
    return 'unconfigured';
  }

  const state = mockReadyState !== null ? mockReadyState : mongoose.connection.readyState;

  switch (state) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 0:
    default:
      return 'disconnected';
  }
}

/**
 * Allows programmatic overriding of configuration status (used by tests).
 */
export function setConfiguredStatus(configured: boolean): void {
  isConfigured = configured;
}

/**
 * Allows programmatic overriding of ready state (used by tests to avoid monkey-patching Mongoose internals).
 */
export function setMockReadyState(state: number | null): void {
  mockReadyState = state;
}
