import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language, I18nContextValue } from './types';
import { enTranslations } from './translations/en';
import { taTranslations } from './translations/ta';
import { STORAGE_KEYS, DEFAULT_LANGUAGE } from '../config/constants';
import { safeGetItem, safeSetItem } from '../lib/storage';

const dictionaries: Record<Language, Record<string, string>> = {
  ta: taTranslations,
  en: enTranslations
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = safeGetItem<string>(STORAGE_KEYS.LANGUAGE, DEFAULT_LANGUAGE);
    return saved === 'en' ? 'en' : 'ta';
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    safeSetItem(STORAGE_KEYS.LANGUAGE, newLang);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDict = dictionaries[language] || dictionaries.ta;
      let text = activeDict[key];

      // Fallback to English if translation is missing in Tamil
      if (!text && language !== 'en') {
        text = dictionaries.en[key];
      }

      // If still missing, return the key itself so UI never renders empty blank strings
      if (!text) {
        text = key;
      }

      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        }
      }

      return text;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
