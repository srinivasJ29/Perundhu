import { env, assertApiConfigured } from '../../config/env';
import { AppApiError, normalizeError } from '../../lib/error';
import { ApiErrorResponse } from '../../types/api';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  timeoutMs?: number;
  skipAuth?: boolean;
}

type TokenProvider = () => string | null;

class HttpClient {
  private baseUrl: string;
  private tokenProvider: TokenProvider | null = null;
  private defaultTimeoutMs: number = 15000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  public setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  public async post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  public async put<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  public async patch<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, body });
  }

  public async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  /**
   * Internal request executor with error parsing and timeout control.
   */
  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions
  ): Promise<T> {
    assertApiConfigured();

    const {
      params,
      body,
      timeoutMs = this.defaultTimeoutMs,
      skipAuth = false,
      headers: customHeaders,
      signal: customSignal,
      ...customInit
    } = options;

    // 1. Build Query Parameters URL
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`, window.location.origin);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // 2. Setup Headers
    const headers = new Headers(customHeaders);
    headers.set('Accept', 'application/json');

    if (body !== undefined && !(body instanceof FormData) && !(body instanceof Blob)) {
      headers.set('Content-Type', 'application/json');
    }

    // 3. Attach Bearer Token if available and not skipped
    if (!skipAuth && this.tokenProvider) {
      const token = this.tokenProvider();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // 4. Setup Abort Controller for Timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort(new DOMException('Request timeout', 'AbortError'));
    }, timeoutMs);

    // If caller provided their own signal, listen to it
    if (customSignal) {
      customSignal.addEventListener('abort', () => abortController.abort());
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body:
          body !== undefined
            ? body instanceof FormData || body instanceof Blob
              ? body
              : JSON.stringify(body)
            : undefined,
        signal: abortController.signal,
        credentials: 'include', // Includes HttpOnly cookies (e.g. refreshToken)
        ...customInit
      });

      clearTimeout(timeoutId);

      // Handle Empty Content (204 No Content)
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!response.ok) {
        let errorPayload: ApiErrorResponse | null = null;
        if (isJson) {
          try {
            errorPayload = (await response.json()) as ApiErrorResponse;
          } catch {
            // Not JSON
          }
        }

        const requestId =
          response.headers.get('X-Request-Id') ||
          errorPayload?.error?.requestId ||
          undefined;

        throw new AppApiError({
          message:
            errorPayload?.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          code: errorPayload?.error?.code || `HTTP_${response.status}`,
          statusCode: response.status,
          details: errorPayload?.error?.details,
          requestId
        });
      }

      if (isJson) {
        return (await response.json()) as T;
      }

      return (await response.text()) as unknown as T;
    } catch (err) {
      clearTimeout(timeoutId);
      throw normalizeError(err);
    }
  }
}

export const httpClient = new HttpClient(env.VITE_API_BASE_URL);
