import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Radio, ShieldCheck, MapPin } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { TNSTCLogo } from '../../landing/components/TNSTCLogo';
import { LanguageSelector } from '../../landing/components/LanguageSelector';
import { Badge } from '../../../components/common/Badge';
import '../styles/auth.css';

export interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { t, language } = useLanguage();

  return (
    <div className="auth-split-wrapper">
      {/* ====================================================================
          Left Column (Desktop Branded Visual Space)
         ==================================================================== */}
      <aside className="auth-brand-side" aria-label="PERUNDHU Transit Branding">
        <div className="auth-brand-bg-pattern" aria-hidden="true" />

        <div className="auth-brand-content">
          {/* Top Brand & Logo */}
          <div className="auth-brand-header">
            <div className="auth-brand-logo-row">
              <TNSTCLogo size="md" />
              <div className="auth-brand-titles">
                <span className="auth-brand-title">
                  {language === 'ta' ? 'பேருந்து' : 'PERUNDHU'}
                </span>
                <span className="auth-brand-tamil">
                  {language === 'ta' ? 'PERUNDHU • TNSTC' : 'பேருந்து • TNSTC'}
                </span>
              </div>
            </div>

            <div>
              <Badge variant="info">
                {t('auth.brand_badge')}
              </Badge>
            </div>
          </div>

          {/* Middle Value Proposition & Pilot Corridor Feature Highlights */}
          <div className="auth-brand-middle">
            <h2 className="auth-hero-heading">
              {t('auth.side_title')}
            </h2>
            <p className="auth-hero-desc">
              {t('auth.side_desc')}
            </p>

            <ul className="auth-feature-list">
              <li className="auth-feature-item">
                <span className="auth-feature-icon" aria-hidden="true">
                  <Radio size={14} />
                </span>
                <span>{t('auth.side_feature_live')}</span>
              </li>
              <li className="auth-feature-item">
                <span className="auth-feature-icon" aria-hidden="true">
                  <MapPin size={14} />
                </span>
                <span>{t('auth.side_feature_routes')}</span>
              </li>
              <li className="auth-feature-item">
                <span className="auth-feature-icon" aria-hidden="true">
                  <ShieldCheck size={14} />
                </span>
                <span>{t('auth.side_feature_eta')}</span>
              </li>
            </ul>
          </div>

          {/* Bottom Corridor Disclaimer */}
          <div className="auth-brand-footer">
            <div className="auth-brand-pilot-tag">
              <MapPin size={14} style={{ color: 'var(--color-warm-peach)' }} />
              <span>{t('landing.hero_tag_pilot')} • {t('landing.hero_tag_routes')}</span>
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-sage-light)' }}>
              {t('landing.footer_statewide')}
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          Right Column (Authentication Card & Controls)
         ==================================================================== */}
      <main className="auth-form-side" role="main">
        {/* Top Navigation Row: Back Link & Language Switcher */}
        <div className="auth-top-nav">
          <Link to="/" className="auth-back-link" aria-label={t('auth.back_to_landing')}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{t('auth.back_to_landing')}</span>
          </Link>

          <LanguageSelector showIcon={false} />
        </div>

        {/* Mobile Brand Identity Header (Visible < 992px) */}
        <div className="auth-mobile-header">
          <TNSTCLogo size="sm" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="auth-mobile-title">
              {language === 'ta' ? 'பேருந்து' : 'PERUNDHU'}
            </span>
            <span className="auth-mobile-tamil">
              {language === 'ta' ? 'TNSTC நேரலை' : 'TNSTC Live Tracking'}
            </span>
          </div>
        </div>

        {/* Form Container */}
        <div className="auth-card-container">
          <div className="auth-card">
            {children}
          </div>
        </div>

        {/* Bottom Micro Footer */}
        <footer className="auth-page-footer">
          <span>{t('landing.footer_copyright')}</span>
        </footer>
      </main>
    </div>
  );
};
