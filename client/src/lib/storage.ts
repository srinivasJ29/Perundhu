/**
 * PERUNDHU (பேருந்து) — Safe Browser Storage Utility
 * Resilient against private browsing mode, disabled storage, and malformed JSON
 */

const memoryStorage = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__perundhu_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const storageAvailable = isLocalStorageAvailable();

export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = storageAvailable
      ? window.localStorage.getItem(key)
      : memoryStorage.get(key);

    if (raw === null || raw === undefined) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSetItem<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    if (storageAvailable) {
      window.localStorage.setItem(key, serialized);
    } else {
      memoryStorage.set(key, serialized);
    }
    return true;
  } catch {
    // Graceful fallback to memory on quota exceeded or permission denied
    try {
      memoryStorage.set(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    if (storageAvailable) {
      window.localStorage.removeItem(key);
    }
    memoryStorage.delete(key);
    return true;
  } catch {
    return false;
  }
}
