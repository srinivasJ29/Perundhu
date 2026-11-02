/**
 * PERUNDHU (பேருந்து) — Telemetry Observability & Metrics Service
 * Tracks operational telemetry metrics: message rates, latencies, rejection reasons,
 * source distributions, duplicate counts, and device communication health.
 */

export interface TelemetryMetricsSummary {
  uptimeSeconds: number;
  totalReceived: number;
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  staleCount: number;
  authFailureCount: number;
  deviceFailureCount: number;
  averageProcessingLatencyMs: number;
  sourceDistribution: Record<string, number>;
  rejectionReasons: Record<string, number>;
}

export class TelemetryMetricsService {
  private startTime: number = Date.now();
  private totalReceived = 0;
  private acceptedCount = 0;
  private rejectedCount = 0;
  private duplicateCount = 0;
  private staleCount = 0;
  private authFailureCount = 0;
  private deviceFailureCount = 0;
  private totalLatencyMs = 0;
  private latencyObservationsCount = 0;

  private sourceDistribution: Map<string, number> = new Map();
  private rejectionReasons: Map<string, number> = new Map();

  /**
   * Records an incoming message received.
   * Returns a high-resolution timestamp (ms) to measure processing latency.
   */
  public recordReceived(source: string = 'UNKNOWN'): number {
    this.totalReceived++;
    const current = this.sourceDistribution.get(source) || 0;
    this.sourceDistribution.set(source, current + 1);
    return Date.now();
  }

  /**
   * Records a successfully accepted and persisted observation.
   */
  public recordAccepted(_source?: string, latencyMs: number = 0): void {
    this.acceptedCount++;
    this.recordLatency(latencyMs);
  }

  /**
   * Records a rejected telemetry message with diagnostic reason.
   */
  public recordRejected(reason: string, latencyMs?: number): void {
    this.rejectedCount++;
    const current = this.rejectionReasons.get(reason) || 0;
    this.rejectionReasons.set(reason, current + 1);
    if (latencyMs !== undefined) {
      this.recordLatency(latencyMs);
    }
  }

  /**
   * Records a duplicate observation.
   */
  public recordDuplicate(): void {
    this.duplicateCount++;
  }

  /**
   * Records a stale telemetry observation.
   */
  public recordStale(): void {
    this.staleCount++;
  }

  /**
   * Records an authentication or signature failure.
   */
  public recordAuthFailure(reason: string): void {
    this.authFailureCount++;
    const current = this.rejectionReasons.get(`AUTH_${reason}`) || 0;
    this.rejectionReasons.set(`AUTH_${reason}`, current + 1);
  }

  /**
   * Records a device-level failure.
   */
  public recordDeviceFailure(): void {
    this.deviceFailureCount++;
  }

  private recordLatency(latencyMs: number): void {
    this.totalLatencyMs += Math.max(0, latencyMs);
    this.latencyObservationsCount++;
  }

  /**
   * Returns a snapshot summary of current operational metrics.
   */
  public getSummary(): TelemetryMetricsSummary {
    const uptimeSeconds = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    const averageProcessingLatencyMs =
      this.latencyObservationsCount > 0
        ? Math.round((this.totalLatencyMs / this.latencyObservationsCount) * 100) / 100
        : 0;

    const sourceDist: Record<string, number> = {};
    for (const [source, count] of this.sourceDistribution.entries()) {
      sourceDist[source] = count;
    }

    const rejectionDist: Record<string, number> = {};
    for (const [reason, count] of this.rejectionReasons.entries()) {
      rejectionDist[reason] = count;
    }

    return {
      uptimeSeconds,
      totalReceived: this.totalReceived,
      acceptedCount: this.acceptedCount,
      rejectedCount: this.rejectedCount,
      duplicateCount: this.duplicateCount,
      staleCount: this.staleCount,
      authFailureCount: this.authFailureCount,
      deviceFailureCount: this.deviceFailureCount,
      averageProcessingLatencyMs,
      sourceDistribution: sourceDist,
      rejectionReasons: rejectionDist
    };
  }

  /**
   * Resets metrics counters (used in testing).
   */
  public reset(): void {
    this.startTime = Date.now();
    this.totalReceived = 0;
    this.acceptedCount = 0;
    this.rejectedCount = 0;
    this.duplicateCount = 0;
    this.staleCount = 0;
    this.authFailureCount = 0;
    this.deviceFailureCount = 0;
    this.totalLatencyMs = 0;
    this.latencyObservationsCount = 0;
    this.sourceDistribution.clear();
    this.rejectionReasons.clear();
  }
}

export const telemetryMetricsService = new TelemetryMetricsService();
