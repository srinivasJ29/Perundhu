import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { mlEtaService } from '../../src/modules/eta/mlEta.service';

describe('Phase 9 AI/ML Bus Arrival Prediction Endpoints (Integration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. POST /api/v1/eta/predict
  // ---------------------------------------------------------------------------
  describe('POST /api/v1/eta/predict', () => {
    const validPayload = {
      bus_id: 'BUS-MD-01',
      route_number: '70',
      target_stop_code: 'STOP-04',
      distance_to_stop_meters: 2700,
      distance_along_route_meters: 1500,
      current_speed_kmph: 24,
      stops_remaining: 3,
      recorded_at: new Date().toISOString(),
      is_deviated: false,
      tracking_status: 'REAL_TIME_TRACKING'
    };

    it('should return 200 with valid prediction payload', async () => {
      const res = await request(app)
        .post('/api/v1/eta/predict')
        .send(validPayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.prediction_source).toBeDefined();
      expect(['ML_PREDICTION', 'BASELINE_ESTIMATE']).toContain(res.body.data.prediction_source);
      expect(res.body.data.predicted_seconds).toBeGreaterThan(0);
      expect(res.body.data.predicted_minutes).toBeGreaterThan(0);
      expect(res.body.data.confidence_lower_seconds).toBeDefined();
      expect(res.body.data.confidence_upper_seconds).toBeDefined();
    });

    it('should return ETA_UNAVAILABLE when bus is deviated off-route', async () => {
      const deviatedPayload = {
        ...validPayload,
        is_deviated: true
      };

      const res = await request(app)
        .post('/api/v1/eta/predict')
        .send(deviatedPayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.prediction_source).toBe('ETA_UNAVAILABLE');
      expect(res.body.data.fallback_reason).toBe('BUS_OFF_ROUTE');
      expect(res.body.data.predicted_seconds).toBe(0);
    });

    it('should return ETA_UNAVAILABLE when GPS tracking is OFFLINE', async () => {
      const stalePayload = {
        ...validPayload,
        tracking_status: 'OFFLINE'
      };

      const res = await request(app)
        .post('/api/v1/eta/predict')
        .send(stalePayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.prediction_source).toBe('ETA_UNAVAILABLE');
      expect(res.body.data.fallback_reason).toBe('GPS_STALE');
      expect(res.body.data.predicted_seconds).toBe(0);
    });

    it('should return 400 VALIDATION_ERROR on missing or invalid parameters', async () => {
      const invalidPayload = {
        route_number: '70',
        distance_to_stop_meters: -50 // Negative distance not allowed
      };

      const res = await request(app)
        .post('/api/v1/eta/predict')
        .send(invalidPayload)
        .expect(400);

      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. GET /api/v1/eta/model-info
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/eta/model-info', () => {
    it('should return 200 with model information and data readiness status', async () => {
      const res = await request(app)
        .get('/api/v1/eta/model-info')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.version).toBeDefined();
      expect(res.body.data.data_readiness).toBeDefined();
      expect(res.body.data.data_readiness.pilot_district).toBe('MADURAI');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Graceful Fallback and Circuit Breaker
  // ---------------------------------------------------------------------------
  describe('ML Service Fallback & Circuit Breaker', () => {
    it('should seamlessly fall back to BASELINE_ESTIMATE when remote ML service is unreachable', async () => {
      // Mock global fetch to simulate network error to ML service
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      try {
        const payload = {
          bus_id: 'BUS-MD-02',
          route_number: '77',
          target_stop_code: 'STOP-03',
          distance_to_stop_meters: 2500,
          distance_along_route_meters: 500,
          current_speed_kmph: 20,
          stops_remaining: 2,
          recorded_at: new Date().toISOString(),
          is_deviated: false,
          tracking_status: 'REAL_TIME_TRACKING'
        };

        const result = await mlEtaService.predict(payload as any);

        expect(result.prediction_source).toBe('BASELINE_ESTIMATE');
        expect(result.fallback_reason).toBe('MODEL_UNAVAILABLE');
        expect(result.predicted_seconds).toBeGreaterThan(0);
        expect(result.predicted_minutes).toBeGreaterThan(0);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
