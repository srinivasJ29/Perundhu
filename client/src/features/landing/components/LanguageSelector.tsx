import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

interface LanguageSelectorProps {
  className?: string;
  showIcon?: boolean;
}

/**
 * LanguageSelector Component
 *
 * Provides a simple, instantaneous two-choice language toggle:
 * `தமிழ்` (Tamil) and `English`.
 *
 * Integrates directly with `useLanguage()` and persists choice across sessions.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ showIcon = true }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="lang-selector-group"
      role="group"
      aria-label={t('lang.select')}
    >
      {showIcon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            paddingLeft: 'var(--space-2)',
            paddingRight: 'var(--space-1)',
            color: 'var(--color-primary-teal)'
          }}
          aria-hidden="true"
        >
          <Globe size={14} />
        </span>
      )}

      <button
        type="button"
        className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
        onClick={() => setLanguage('ta')}
        aria-pressed={language === 'ta'}
        aria-label={t('lang.switch_to_ta')}
      >
        தமிழ்
      </button>

      <button
        type="button"
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        aria-label={t('lang.switch_to_en')}
      >
        English
      </button>
    </div>
  );
};
