import { describe, it, expect } from 'vitest';
import { enTranslations } from '../src/i18n/translations/en';
import { taTranslations } from '../src/i18n/translations/ta';

describe('Internationalization (i18n) Foundation', () => {
  it('should contain matching core keys across English and Tamil dictionaries', () => {
    const coreKeys = [
      'app.name',
      'app.tagline',
      'common.loading',
      'common.error',
      'common.retry',
      'common.live',
      'common.simulated',
      'pilot.badge',
      'nav.not_found'
    ];

    for (const key of coreKeys) {
      expect(enTranslations[key], `Missing English key: ${key}`).toBeDefined();
      expect(taTranslations[key], `Missing Tamil key: ${key}`).toBeDefined();
      expect(enTranslations[key].trim().length).toBeGreaterThan(0);
      expect(taTranslations[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('should verify Tamil characters are present in Tamil translations', () => {
    // Unicode range for Tamil: \u0B80-\u0BFF
    const tamilRegex = /[\u0B80-\u0BFF]/;
    expect(tamilRegex.test(taTranslations['app.name'])).toBe(true);
    expect(tamilRegex.test(taTranslations['common.loading'])).toBe(true);
    expect(tamilRegex.test(taTranslations['pilot.badge'])).toBe(true);
  });
});
