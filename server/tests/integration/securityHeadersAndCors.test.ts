import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Phase 10 — Express Security Hardening (Headers, CORS, Request ID, Body Limits)', () => {
  // ---------------------------------------------------------------------------
  // 1. Security Headers (Helmet)
  // ---------------------------------------------------------------------------
  describe('HTTP Security Headers', () => {
    it('should include X-Content-Type-Options: nosniff', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options: DENY (clickjacking protection)', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('should include Cross-Origin-Resource-Policy', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });

    it('should strip X-Powered-By header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Correlation / Request ID Middleware
  // ---------------------------------------------------------------------------
  describe('Request ID / Correlation ID Propagation', () => {
    it('should generate a UUID X-Request-Id when client does not supply one', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should propagate valid client-supplied X-Request-Id', async () => {
      const clientReqId = 'custom-correlation-id-12345';
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Request-Id', clientReqId);

      expect(res.headers['x-request-id']).toBe(clientReqId);
    });

    it('should replace invalid client-supplied X-Request-Id with safe UUID', async () => {
      const dangerousReqId = '<script>alert(1)</script>';
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Request-Id', dangerousReqId);

      expect(res.headers['x-request-id']).not.toBe(dangerousReqId);
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. CORS Policy
  // ---------------------------------------------------------------------------
  describe('CORS Policy Enforcement', () => {
    it('should allow requests from configured CLIENT_ORIGIN', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject requests from unauthorized origins with 403 CORS_REJECTED', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'https://malicious-phishing-site.com');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CORS_REJECTED');
      expect(res.body.error.message).toContain('not allowed by CORS policy');
    });

    it('should allow requests with no origin (curl, mobile app, server-to-server)', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. HTTP Method Filtering
  // ---------------------------------------------------------------------------
  describe('Unsupported / Dangerous HTTP Methods', () => {
    it('should reject TRACE requests with 405 Method Not Allowed', async () => {
      const res = await request(app)
        .trace('/api/v1/health');

      expect(res.status).toBe(405);
      expect(res.body.error.code).toBe('METHOD_NOT_ALLOWED');
      expect(res.headers['allow']).toBe('GET, POST, PUT, PATCH, DELETE, OPTIONS');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Body Parsing & Malformed JSON Handling
  // ---------------------------------------------------------------------------
  describe('Request Body Limits & Malformed JSON Handling', () => {
    it('should return 400 MALFORMED_JSON on invalid JSON syntax without leaking internal stack', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json payload: true');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MALFORMED_JSON');
      expect(res.body.error.message).toBe('Invalid JSON payload in request body');
      expect(res.body.error).toHaveProperty('requestId');
    });

    it('should return 413 PAYLOAD_TOO_LARGE when body exceeds 1MB limit', async () => {
      const hugeString = 'A'.repeat(1.2 * 1024 * 1024); // 1.2 MB
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ data: hugeString }));

      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
      expect(res.body.error.message).toBe('Request payload exceeds allowable limit');
    });
  });
});
