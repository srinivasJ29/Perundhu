import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { httpClient } from '../src/services/api/client';
import { AppApiError } from '../src/lib/error';

describe('HttpClient Foundation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    httpClient.setTokenProvider(() => null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should successfully execute GET request and parse JSON response', async () => {
    const mockData = { status: 'healthy', uptime: 120 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData
    });

    const result = await httpClient.get<typeof mockData>('/health');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should correctly serialize query parameters in URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: [] })
    });

    await httpClient.get('/districts', {
      params: { page: 2, limit: 10, q: 'Madurai' }
    });

    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('q=Madurai');
  });

  it('should attach Bearer token when token provider returns token', async () => {
    httpClient.setTokenProvider(() => 'test-valid-jwt-token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { id: 'u1' } })
    });

    await httpClient.get('/auth/me');

    const calledOptions = (global.fetch as any).mock.calls[0][1];
    expect(calledOptions.headers.get('Authorization')).toBe('Bearer test-valid-jwt-token');
  });

  it('should parse backend ApiErrorResponse on non-2xx status code', async () => {
    const backendError = {
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: "District with ID '123' was not found",
        timestamp: '2026-10-16T12:00:00Z',
        requestId: 'req-abc-999'
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({
        'content-type': 'application/json',
        'X-Request-Id': 'req-abc-999'
      }),
      json: async () => backendError
    });

    await expect(httpClient.get('/districts/123')).rejects.toThrow(AppApiError);

    try {
      await httpClient.get('/districts/123');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppApiError);
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('RESOURCE_NOT_FOUND');
      expect(err.message).toBe("District with ID '123' was not found");
      expect(err.requestId).toBe('req-abc-999');
    }
  });

  it('should handle 204 No Content gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers()
    });

    const result = await httpClient.post<void>('/auth/logout');
    expect(result).toBeUndefined();
  });
});
