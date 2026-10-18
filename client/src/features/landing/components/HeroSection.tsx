import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../../auth';
import { Badge } from '../../../components/common/Badge';
import { BusHeroImage } from './BusHeroImage';

/**
 * HeroSection Component
 *
 * Primary visual anchor of the opening page.
 * Features:
 * - Bilingual high-impact typography
 * - Verified Madurai Pilot Corridor tags
 * - Primary "Get Started" and Secondary "Explore PERUNDHU" actions
 * - Hero Bus visual composition
 */
export const HeroSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById('features');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="landing-hero" aria-labelledby="hero-main-heading">
      <div className="app-container">
        <div className="hero-grid">
          {/* Left Column: Headings, Value Proposition & Actions */}
          <div className="hero-content">
            <div className="hero-badges-row">
              <Badge variant="neutral">
                <MapPin size={12} style={{ marginRight: '4px' }} />
                {t('landing.hero_tag_pilot')}
              </Badge>
              <Badge variant="info">
                {t('landing.hero_tag_routes')}
              </Badge>
              <Badge variant="success">
                {t('landing.hero_badge_realtime')}
              </Badge>
            </div>

            <h1
              id="hero-main-heading"
              className={`hero-title ${language === 'ta' ? 'hero-title-tamil' : ''}`}
            >
              {t('landing.hero_title')}
            </h1>

            <p className="hero-description">
              {t('landing.hero_subtitle')}
            </p>

            <div className="hero-actions-row">
              <button
                type="button"
                className="hero-btn-primary"
                onClick={() => navigate(isAuthenticated ? '/onboarding' : '/login')}
                aria-label={t('landing.get_started')}
              >
                <span>{t('landing.get_started')}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>

              <a
                href="#features"
                className="hero-btn-secondary"
                onClick={handleExploreClick}
                aria-label={t('landing.explore')}
              >
                <Compass size={18} aria-hidden="true" />
                <span>{t('landing.explore')}</span>
              </a>
            </div>

            {/* Factual corridor note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--space-2)'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-teal)',
                  display: 'inline-block'
                }}
              />
              <span>{t('pilot.corridor')}</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset Composition */}
          <div className="hero-visual-wrapper">
            <BusHeroImage />
          </div>
        </div>
      </div>
    </section>
  );
};
