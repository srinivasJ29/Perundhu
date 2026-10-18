import { useI18n } from '../i18n';

export function useLanguage() {
  const { language, setLanguage, t } = useI18n();
  return {
    language,
    setLanguage,
    t,
    isTamil: language === 'ta',
    isEnglish: language === 'en'
  };
}
