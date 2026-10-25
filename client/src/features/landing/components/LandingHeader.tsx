import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Compass, MapPin, Sparkles, Radio, Play } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../../auth';
import { TNSTCLogo } from './TNSTCLogo';
import { LanguageSelector } from './LanguageSelector';

/**
 * LandingHeader Component
 *
 * Ultra-modern, responsive glassmorphic navigation header for PERUNDHU featuring:
 * - Frosted glassmorphism with subtle teal rim glow
 * - Dynamic brand emblem with hover micro-animation
 * - Animated Live Transit radar indicator
 * - Sleek pill navigation links with hover lift & active indicators
 * - Bilingual Tamil / English capsule toggle
 * - Shimmer Call-to-Action button with kinetic arrow nudge
 * - Mobile animated hamburger toggle with slide-down frosted glass drawer
 */
export const LandingHeader: React.FC = () => {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className={`landing-header ${isScrolled ? 'is-scrolled' : ''}`} role="banner">
      <div className="app-container">
        <div className="landing-header-inner">
          {/* Brand & Logo Group */}
          <Link
            to="/"
            className="landing-brand-group"
            aria-label={`${t('app.name')} - ${t('app.subtitle')}`}
          >
            <div className="landing-brand-logo-wrapper">
              <TNSTCLogo size="md" />
              <span className="landing-brand-glow-halo" aria-hidden="true" />
            </div>

            <div className="landing-brand-text">
              <div className="landing-brand-title-row">
                <span className="landing-brand-title">
                  {language === 'ta' ? 'பேருந்து' : 'PERUNDHU'}
                </span>
                <span className="landing-live-radar-badge" title="Live GPS Telemetry Active">
                  <span className="landing-radar-ping" aria-hidden="true" />
                  <span className="landing-radar-dot" aria-hidden="true" />
                  <span className="landing-radar-label">LIVE</span>
                </span>
              </div>
              <span className="landing-brand-tamil">
                {language === 'ta' ? 'PERUNDHU • TNSTC' : 'பேருந்து • தமிழ்நாடு அரசுப் போக்குவரத்து'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="landing-nav-links" aria-label="Main Navigation">
            <Link to="/map" className="landing-nav-link nav-link-pill">
              <Compass size={15} className="nav-icon" aria-hidden="true" />
              <span>{language === 'ta' ? 'நேரலை வரைபடம்' : 'Live Map'}</span>
            </Link>

            <Link to="/dashboard" className="landing-nav-link nav-link-pill">
              <Sparkles size={15} className="nav-icon" aria-hidden="true" />
              <span>{language === 'ta' ? 'முகப்பு பலகை' : 'Dashboard'}</span>
            </Link>

            <Link to="/districts" className="landing-nav-link nav-link-pill">
              <MapPin size={15} className="nav-icon" aria-hidden="true" />
              <span>{language === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}</span>
            </Link>

            <a href="#features" className="landing-nav-link nav-link-pill">
              <span>{t('landing.nav_features')}</span>
            </a>

            <a href="#pilot" className="landing-nav-link nav-link-pill">
              <span>{t('landing.nav_pilot')}</span>
            </a>
          </nav>

          {/* Actions: Language & CTA Button */}
          <div className="landing-header-actions">
            <button
              type="button"
              className="btn-replay-opening"
              onClick={() => window.dispatchEvent(new CustomEvent('perundhu:replay-opening'))}
              title={language === 'ta' ? 'அறிமுக அனிமேஷனை இயக்கு' : 'Replay Opening Animation'}
              aria-label="Replay Opening Animation"
            >
              <Play size={12} fill="currentColor" />
              <span>{language === 'ta' ? 'அறிமுகம்' : 'Intro'}</span>
            </button>

            <LanguageSelector />

            <button
              type="button"
              className="btn-shimmer-cta"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              aria-label={isAuthenticated ? 'Open Dashboard' : t('landing.get_started')}
            >
              <span>{isAuthenticated ? (language === 'ta' ? 'முகப்பு' : 'Dashboard') : t('landing.get_started')}</span>
              <ArrowRight size={16} className="cta-arrow-icon" aria-hidden="true" />
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              className={`landing-mobile-menu-btn ${mobileMenuOpen ? 'is-open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-line top-line" />
              <span className="hamburger-line mid-line" />
              <span className="hamburger-line bot-line" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Animated Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div className="landing-mobile-drawer" role="navigation" aria-label="Mobile Navigation">
          <div className="landing-mobile-drawer-inner">
            <div className="landing-mobile-status-strip">
              <div className="landing-live-radar-badge">
                <span className="landing-radar-ping" aria-hidden="true" />
                <span className="landing-radar-dot" aria-hidden="true" />
                <span className="landing-radar-label">Madurai Pilot Online</span>
              </div>
            </div>

            <nav className="landing-mobile-nav-list">
              <Link
                to="/map"
                className="landing-mobile-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="mobile-nav-icon-box">
                  <Compass size={18} />
                </div>
                <div className="mobile-nav-text">
                  <span className="mobile-nav-title">{language === 'ta' ? 'நேரலை வரைபடம்' : 'Live Interactive Map'}</span>
                  <span className="mobile-nav-sub">{language === 'ta' ? 'பேருந்து ஜிபிஎஸ் நகர்வு' : 'Real-time bus telemetry'}</span>
                </div>
              </Link>

              <Link
                to="/dashboard"
                className="landing-mobile-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="mobile-nav-icon-box">
                  <Sparkles size={18} />
                </div>
                <div className="mobile-nav-text">
                  <span className="mobile-nav-title">{language === 'ta' ? 'முகப்பு பலகை' : 'Passenger Dashboard'}</span>
                  <span className="mobile-nav-sub">{language === 'ta' ? 'பயண தேடல் & நேரம்' : 'Quick search & departures'}</span>
                </div>
              </Link>

              <Link
                to="/districts"
                className="landing-mobile-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="mobile-nav-icon-box">
                  <MapPin size={18} />
                </div>
                <div className="mobile-nav-text">
                  <span className="mobile-nav-title">{language === 'ta' ? 'மாவட்டங்கள்' : 'Districts & Corridors'}</span>
                  <span className="mobile-nav-sub">{language === 'ta' ? '38 மாவட்டங்கள் விரிவு' : 'Tamil Nadu coverage'}</span>
                </div>
              </Link>

              <a
                href="#features"
                className="landing-mobile-nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="mobile-nav-icon-box">
                  <Radio size={18} />
                </div>
                <div className="mobile-nav-text">
                  <span className="mobile-nav-title">{t('landing.nav_features')}</span>
                  <span className="mobile-nav-sub">{language === 'ta' ? 'முக்கிய வசதிகள்' : 'System features & capabilities'}</span>
                </div>
              </a>
            </nav>

            <div className="landing-mobile-bottom-action">
              <button
                type="button"
                className="btn-shimmer-cta mobile-full-cta"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(isAuthenticated ? '/dashboard' : '/login');
                }}
              >
                <span>{isAuthenticated ? (language === 'ta' ? 'முகப்பு செல்ல' : 'Go to Dashboard') : t('landing.get_started')}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
