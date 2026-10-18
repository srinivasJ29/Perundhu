import { describe, it, expect } from 'vitest';
import { normalizeError, getUserFriendlyErrorMessage, AppApiError } from '../src/lib/error';

describe('Error Normalization Foundation', () => {
  it('should normalize standard TypeError fetch failure to network error', () => {
    const fetchError = new TypeError('Failed to fetch');
    const normalized = normalizeError(fetchError);

    expect(normalized).toBeInstanceOf(AppApiError);
    expect(normalized.isNetworkError).toBe(true);
    expect(normalized.code).toBe('NETWORK_DISCONNECTED');

    const taMessage = getUserFriendlyErrorMessage(normalized, 'ta');
    const enMessage = getUserFriendlyErrorMessage(normalized, 'en');

    expect(taMessage).toContain('இணைய இணைப்பு இல்லை');
    expect(enMessage).toContain('Network connection error');
  });

  it('should normalize AbortError into timeout error', () => {
    const abortError = new DOMException('The user aborted a request', 'AbortError');
    const normalized = normalizeError(abortError);

    expect(normalized).toBeInstanceOf(AppApiError);
    expect(normalized.isTimeout).toBe(true);
    expect(normalized.statusCode).toBe(408);
  });

  it('should return appropriate localized message for 401 Unauthorized', () => {
    const authError = new AppApiError({
      message: 'Unauthorized',
      statusCode: 401,
      code: 'UNAUTHORIZED'
    });

    expect(getUserFriendlyErrorMessage(authError, 'ta')).toContain('உள்நுழையவும்');
    expect(getUserFriendlyErrorMessage(authError, 'en')).toContain('sign in again');
  });
});
