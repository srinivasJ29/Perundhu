import { SupportedLanguage } from '../config/constants';

export type Language = SupportedLanguage;

export interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}
