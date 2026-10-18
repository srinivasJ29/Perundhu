import { ApiErrorResponse } from '../types/api';

/**
 * Normalized API & Client Error Class
 */
export class AppApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly requestId?: string;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;
  public readonly isAuthError: boolean;

  constructor(options: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: unknown;
    requestId?: string;
    isNetworkError?: boolean;
    isTimeout?: boolean;
    cause?: unknown;
  }) {
    super(options.message);
    this.name = 'AppApiError';
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details;
    this.requestId = options.requestId;
    this.isNetworkError = options.isNetworkError ?? false;
    this.isTimeout = options.isTimeout ?? false;
    this.isAuthError = this.statusCode === 401 || this.statusCode === 403;

    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Normalizes any caught error (fetch error, backend ApiErrorResponse, AbortError, etc.) into an AppApiError.
 */
export function normalizeError(err: unknown): AppApiError {
  if (err instanceof AppApiError) {
    return err;
  }

  // Handle AbortError / Timeout
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new AppApiError({
      message: 'Request timed out or was cancelled by user.',
      code: 'REQUEST_ABORTED',
      statusCode: 408,
      isTimeout: true,
      cause: err
    });
  }

  // Handle TypeError (typical fetch network failure in browser)
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
    return new AppApiError({
      message: 'Unable to connect to PERUNDHU server. Please check your internet connection.',
      code: 'NETWORK_DISCONNECTED',
      statusCode: 0,
      isNetworkError: true,
      cause: err
    });
  }

  // Handle parsed backend error response
  if (err && typeof err === 'object' && 'error' in err) {
    const apiError = (err as ApiErrorResponse).error;
    if (apiError && typeof apiError.message === 'string') {
      return new AppApiError({
        message: apiError.message,
        code: apiError.code || 'API_ERROR',
        details: apiError.details,
        requestId: apiError.requestId,
        statusCode: 400
      });
    }
  }

  // Standard generic Error
  if (err instanceof Error) {
    return new AppApiError({
      message: err.message || 'An unexpected error occurred.',
      code: 'CLIENT_ERROR',
      statusCode: 500,
      cause: err
    });
  }

  // Unknown non-error throw
  return new AppApiError({
    message: 'An unexpected application error occurred.',
    code: 'UNKNOWN_ERROR',
    statusCode: 500
  });
}

/**
 * Returns safe, user-friendly localized messages without exposing internal stack traces.
 */
export function getUserFriendlyErrorMessage(
  error: AppApiError,
  language: 'ta' | 'en' = 'ta'
): string {
  if (error.isNetworkError) {
    return language === 'ta'
      ? 'இணைய இணைப்பு இல்லை அல்லது சேவையகம் பதிலளிக்கவில்லை. தயவுசெய்து உங்கள் இணைப்பைச் சரிபார்க்கவும்.'
      : 'Network connection error or server unreachable. Please verify your connection.';
  }

  if (error.isTimeout) {
    return language === 'ta'
      ? 'கோரிக்கையின் நேரம் முடிந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
      : 'The request timed out. Please try again.';
  }

  if (error.statusCode === 401) {
    return language === 'ta'
      ? 'உங்கள் அமர்வு காலாவதியானது. தயவுசெய்து மீண்டும் உள்நுழையவும்.'
      : 'Your session has expired. Please sign in again.';
  }

  if (error.statusCode === 403) {
    return language === 'ta'
      ? 'இந்தச் செயலைச் செய்ய உங்களுக்கு அனுமதி இல்லை.'
      : 'You do not have permission to perform this action.';
  }

  if (error.statusCode === 404) {
    return language === 'ta'
      ? 'கோரப்பட்ட தகவல் கிடைக்கவில்லை.'
      : 'The requested resource was not found.';
  }

  if (error.statusCode >= 500) {
    return language === 'ta'
      ? 'சேவையகத்தில் தற்காலிகப் பிழை ஏற்பட்டுள்ளது. சிறிது நேரம் கழித்து முயற்சிக்கவும்.'
      : 'A temporary server error occurred. Please try again shortly.';
  }

  return error.message;
}
