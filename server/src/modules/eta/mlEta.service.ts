/**
 * PERUNDHU (பேருந்து) — Phase 9 Machine Learning ETA Integration Service
 * Connects backend to ML prediction service with timeout guards, circuit-breaking,
 * input validation, and validated fallback to corridor baseline model.
 */

import { env } from '../../config/env';
import { logger } from '../../common/logger';
import {
  MlPredictionRequestDto,
  MlPredictionResponseDto
} from './eta.types';

export interface MlEtaServiceOptions {
  serviceUrl?: string;
  timeoutMs?: number;
  apiKey?: string;
  enabled?: boolean;
}

export class MlEtaService {
  private serviceUrl: string;
  private timeoutMs: number;
  private apiKey: string;
  private enabled: boolean;
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  constructor(options?: MlEtaServiceOptions) {
    this.serviceUrl = options?.serviceUrl ?? env.ML_ETA_SERVICE_URL;
    this.timeoutMs = options?.timeoutMs ?? env.ML_ETA_SERVICE_TIMEOUT_MS;
    this.apiKey = options?.apiKey ?? env.ML_ETA_API_KEY;
    this.enabled = options?.enabled ?? env.ML_ETA_ENABLED;
  }

  /**
   * Evaluates corridor baseline in-process when ML service is offline or disabled.
   */
  public calculateBaselineEstimate(req: MlPredictionRequestDto): MlPredictionResponseDto {
    const distanceMeters = Math.max(0, req.distance_to_stop_meters);
    const stopsRemaining = Math.max(0, req.stops_remaining ?? 1);
    const rawSpeed = req.rolling_speed_kmph ?? req.current_speed_kmph ?? 24.0;

    // Clamp speed to realistic urban bounds [10 km/h, 50 km/h]
    let effectiveSpeed = Math.min(50.0, Math.max(env.ETA_MIN_EFFECTIVE_SPEED_KMPH, rawSpeed));

    // Time of day peak factor (Morning: 08:00 - 11:00, Evening: 17:00 - 20:30 IST)
    const now = req.recorded_at ? new Date(req.recorded_at) : new Date();
    const istHours = (now.getUTCHours() + 5.5) % 24;
    const isPeak = (istHours >= 8 && istHours <= 11) || (istHours >= 17 && istHours <= 20.5);

    if (isPeak) {
      effectiveSpeed *= 0.75; // Peak hour corridor deceleration
    }

    const speedMps = (effectiveSpeed * 1000.0) / 3600.0;
    const transitSeconds = distanceMeters / speedMps;
    const dwellSeconds = stopsRemaining * env.ETA_DEFAULT_DWELL_SECONDS;

    const totalSeconds = Math.max(10, Math.round(transitSeconds + dwellSeconds));

    return {
      bus_id: req.bus_id,
      target_stop_code: req.target_stop_code,
      prediction_source: 'BASELINE_ESTIMATE',
      predicted_seconds: totalSeconds,
      predicted_minutes: Math.round((totalSeconds / 60.0) * 10) / 10,
      confidence: 0.65,
      confidence_lower_seconds: Math.max(5, Math.round(totalSeconds * 0.75)),
      confidence_upper_seconds: Math.round(totalSeconds * 1.35),
      model_version: 'baseline-corridor-v1.0',
      prediction_timestamp: new Date().toISOString(),
      fallback_reason: 'MODEL_UNAVAILABLE',
      inference_latency_ms: 1.2
    };
  }

  /**
   * Predicts ETA for a downstream stop using Python ML service with circuit breaker.
   */
  public async predict(req: MlPredictionRequestDto): Promise<MlPredictionResponseDto> {
    const startTime = Date.now();

    // 1. Data Quality Checks
    if (req.is_deviated) {
      return {
        bus_id: req.bus_id,
        target_stop_code: req.target_stop_code,
        prediction_source: 'ETA_UNAVAILABLE',
        predicted_seconds: 0,
        predicted_minutes: 0,
        confidence: 0,
        confidence_lower_seconds: 0,
        confidence_upper_seconds: 0,
        model_version: 'none',
        prediction_timestamp: new Date().toISOString(),
        fallback_reason: 'BUS_OFF_ROUTE',
        inference_latency_ms: Date.now() - startTime
      };
    }

    if (req.tracking_status === 'OFFLINE' || req.tracking_status === 'DEVIATED') {
      return {
        bus_id: req.bus_id,
        target_stop_code: req.target_stop_code,
        prediction_source: 'ETA_UNAVAILABLE',
        predicted_seconds: 0,
        predicted_minutes: 0,
        confidence: 0,
        confidence_lower_seconds: 0,
        confidence_upper_seconds: 0,
        model_version: 'none',
        prediction_timestamp: new Date().toISOString(),
        fallback_reason: 'GPS_STALE',
        inference_latency_ms: Date.now() - startTime
      };
    }

    // 2. Circuit Breaker Check
    const now = Date.now();
    const isCircuitOpen = this.circuitOpenUntil > now;

    if (!this.enabled || isCircuitOpen) {
      const baseline = this.calculateBaselineEstimate(req);
      baseline.inference_latency_ms = Date.now() - startTime;
      return baseline;
    }

    // 3. Query ML Service
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.serviceUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.apiKey
        },
        body: JSON.stringify(req),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ML prediction service HTTP ${response.status}`);
      }

      const data = (await response.json()) as MlPredictionResponseDto;
      this.consecutiveFailures = 0; // reset failures on success
      data.inference_latency_ms = Date.now() - startTime;
      return data;
    } catch (err: any) {
      this.consecutiveFailures += 1;
      // Open circuit breaker for 30s after 3 consecutive failures
      if (this.consecutiveFailures >= 3) {
        this.circuitOpenUntil = Date.now() + 30000;
        logger.warn('ML ETA prediction circuit breaker opened for 30s due to consecutive failures');
      }

      logger.debug({
        error: err.message,
        busId: req.bus_id
      }, 'ML ETA service query failed, executing corridor baseline fallback');

      const baseline = this.calculateBaselineEstimate(req);
      baseline.inference_latency_ms = Date.now() - startTime;
      return baseline;
    }
  }

  /**
   * Fetches model information from ML service or returns local baseline metadata.
   */
  public async getModelInfo(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${this.serviceUrl}/model-info`, {
        headers: {
          'X-Internal-Token': this.apiKey
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Return baseline metadata when Python service is offline
    }

    return {
      version: 'v1.0',
      model_type: 'XGBoostRegressor / CorridorBaselineFallback',
      status: 'BENCHMARK_CORRIDOR_VERIFIED',
      data_readiness: {
        physical_gps_status: 'INSUFFICIENT_HISTORICAL_ACCUMULATION',
        benchmarking_status: 'SURVEYED_MADURAI_CORRIDOR_ACTIVE',
        routes_supported: ['70', '77'],
        pilot_district: 'MADURAI'
      }
    };
  }
}

export const mlEtaService = new MlEtaService();
