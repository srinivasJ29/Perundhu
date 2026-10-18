import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../../auth';
import { TNSTCLogo } from './TNSTCLogo';
import { LanguageSelector } from './LanguageSelector';

/**
 * LandingHeader Component
 *
 * Sticky, responsive header for PERUNDHU featuring:
 * - Official TNSTC Logo
 * - Bilingual Brand Identity (PERUNDHU • பேருந்து)
 * - Navigation links to in-page sections
 * - Instant Tamil / English Language Switcher
 * - Primary "Get Started" Call-to-Action button leading to authentication destination
 */
export const LandingHeader: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="landing-header" role="banner">
      <div className="app-container">
        <div className="landing-header-inner">
          {/* Brand & Logo Group */}
          <Link
            to="/"
            className="landing-brand-group"
            aria-label={`${t('app.name')} - ${t('app.subtitle')}`}
          >
            <TNSTCLogo size="md" />

            <div className="landing-brand-text">
              <span className="landing-brand-title">
                {language === 'ta' ? 'பேருந்து' : 'PERUNDHU'}
              </span>
              <span className="landing-brand-tamil">
                {language === 'ta' ? 'PERUNDHU • TNSTC' : 'பேருந்து • TNSTC'}
              </span>
              <span className="landing-brand-desc">
                {t('landing.brand_descriptor')}
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="landing-nav-links" aria-label="Main Navigation">
            <Link to="/districts" className="landing-nav-link">
              {language === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}
            </Link>
            <a href="#features" className="landing-nav-link">
              {t('landing.nav_features')}
            </a>
            <a href="#pilot" className="landing-nav-link">
              {t('landing.nav_pilot')}
            </a>
            <Link to="/dev" className="landing-nav-link">
              {t('landing.nav_dev')}
            </Link>
          </nav>

          {/* Actions: Language & Get Started */}
          <div className="landing-header-actions">
            <LanguageSelector />

            <button
              type="button"
              className="btn btn-primary"
              style={{
                minHeight: '40px',
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)'
              }}
              onClick={() => navigate(isAuthenticated ? '/onboarding' : '/login')}
            >
              <span>{t('landing.get_started')}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
