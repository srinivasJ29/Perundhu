import { getDatabaseStatus } from '../../infrastructure/database';

export interface HealthResponse {
  status: 'healthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  timestamp: string;
  dependencies: {
    database: string;
  };
}

export class HealthService {
  private readonly startTime = Date.now();

  public getHealth(environment: string): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment
    };
  }

  public getReadiness(): { isReady: boolean; data: ReadinessResponse } {
    const dbStatus = getDatabaseStatus();
    // The service is ready if the database is either connected or intentionally unconfigured.
    // If the database was configured but is currently disconnected, connecting, or disconnecting, it is not ready.
    const isReady = dbStatus === 'connected' || dbStatus === 'unconfigured';

    return {
      isReady,
      data: {
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: dbStatus
        }
      }
    };
  }
}

export const healthService = new HealthService();
