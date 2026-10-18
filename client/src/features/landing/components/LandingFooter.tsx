import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../hooks/useLanguage';
import { TNSTCLogo } from './TNSTCLogo';
import { LanguageSelector } from './LanguageSelector';

/**
 * LandingFooter Component
 *
 * Clean, accessible footer with truthful information, working in-app links,
 * language switching, and restrained copyright notice.
 */
export const LandingFooter: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="landing-footer" role="contentinfo">
      <div className="app-container">
        <div className="footer-grid">
          {/* Column 1: Brand & Description */}
          <div className="footer-brand-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <TNSTCLogo size="sm" />
              <div>
                <h3 className="footer-brand-title">
                  {language === 'ta' ? 'பேருந்து (PERUNDHU)' : 'PERUNDHU'}
                </h3>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-teal)', fontWeight: 'var(--font-weight-medium)' }}>
                  {t('landing.brand_descriptor')}
                </div>
              </div>
            </div>

            <p className="footer-desc">
              {t('landing.footer_desc')}
            </p>

            <div style={{ marginTop: 'var(--space-2)' }}>
              <LanguageSelector showIcon={false} />
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">
              {language === 'ta' ? 'வழிசெலுத்தல்' : 'Navigation'}
            </h4>
            <ul className="footer-links-list">
              <li>
                <a href="#features" className="footer-link">
                  {t('landing.nav_features')}
                </a>
              </li>
              <li>
                <a href="#pilot" className="footer-link">
                  {t('landing.nav_pilot')}
                </a>
              </li>
              <li>
                <Link to="/onboarding" className="footer-link">
                  {t('landing.get_started')}
                </Link>
              </li>
              <li>
                <Link to="/dev" className="footer-link">
                  {t('landing.nav_dev')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Coverage & Scope */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">
              {language === 'ta' ? 'திட்ட நோக்கம்' : 'Scope & Scale'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <div>{t('pilot.corridor')}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {t('landing.footer_statewide')}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Restrained Copyright & Attribution */}
        <div className="footer-bottom">
          <div>{t('landing.footer_copyright')}</div>
          <div>Tamil Nadu State Transport Corporation (TNSTC)</div>
        </div>
      </div>
    </footer>
  );
};
