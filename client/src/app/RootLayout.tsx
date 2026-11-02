import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bus, Globe, Compass, Sparkles, MapPin, Brain, Building2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useSocket } from '../hooks/useSocket';
import { Badge } from '../components/common/Badge';
import { useAiCopilot } from '../features/ai-copilot';

export const RootLayout: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { isConnected, isConnecting } = useSocket();
  const { openCopilot } = useAiCopilot();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'ta' ? 'en' : 'ta');
  };

  return (
    <div className="page-wrapper">
      {/* Ultra-Modern Glassmorphic Header */}
      <header className="global-app-header" role="banner">
        <div className="app-container">
          <div className="global-app-header-inner">
            {/* Logo / Brand Title */}
            <Link
              to="/"
              className="global-nav-brand"
              aria-label="PERUNDHU Home"
            >
              <div className="global-brand-icon-box" aria-hidden="true">
                <Bus size={22} />
              </div>
              <div className="global-brand-text">
                <div className="global-brand-name">
                  {language === 'ta' ? 'பேருந்து' : 'PERUNDHU'}
                </div>
                <div className="global-brand-sub">
                  {language === 'ta' ? 'PERUNDHU • TNSTC' : 'தமிழ்நாடு அரசுப் போக்குவரத்து'}
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="global-nav-links">
              <Link
                to="/map"
                className={`global-nav-link ${location.pathname.startsWith('/map') ? 'is-active' : ''}`}
              >
                <Compass size={15} />
                <span>{language === 'ta' ? 'நேரலை வரைபடம்' : 'Live Map'}</span>
              </Link>

              <Link
                to="/dashboard"
                className={`global-nav-link ${location.pathname === '/dashboard' ? 'is-active' : ''}`}
              >
                <Sparkles size={15} />
                <span>{language === 'ta' ? 'முகப்பு' : 'Dashboard'}</span>
              </Link>

              <Link
                to="/districts"
                className={`global-nav-link ${location.pathname.startsWith('/districts') ? 'is-active' : ''}`}
              >
                <MapPin size={15} />
                <span>{language === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}</span>
              </Link>

              <Link
                to="/operations"
                className={`global-nav-link ${location.pathname.startsWith('/operations') ? 'is-active' : ''}`}
              >
                <Building2 size={15} />
                <span>{language === 'ta' ? 'செயல்பாடுகள்' : 'Operations'}</span>
              </Link>
            </div>

            {/* Status & Language Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Madurai Pilot Badge */}
              <Badge variant="info" style={{ display: 'none' }} className="d-sm-flex">
                {t('pilot.badge')}
              </Badge>

              {/* Socket Status Indicator */}
              <div
                className={`global-socket-status ${isConnected ? 'status-live' : isConnecting ? 'status-connecting' : ''}`}
                title={
                  isConnected
                    ? t('socket.connected')
                    : isConnecting
                    ? t('socket.connecting')
                    : t('socket.disconnected')
                }
              >
                <span className={isConnected ? 'global-socket-ping' : ''} aria-hidden="true" />
                <span>
                  {isConnected ? 'LIVE' : isConnecting ? 'CONNECTING' : 'IDLE'}
                </span>
              </div>

              {/* AI Copilot Action Badge */}
              <button
                type="button"
                onClick={() => openCopilot()}
                className="global-ai-copilot-btn"
                title="Open PERUNDHU AI Transit Copilot (LangGraph)"
                aria-label="Open AI Copilot"
              >
                <Brain size={15} />
                <span>AI Copilot</span>
              </button>

              {/* One-Action Language Switcher */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="global-lang-btn"
                aria-label={`Switch to ${language === 'ta' ? 'English' : 'தமிழ்'}`}
              >
                <Globe size={14} />
                <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                className={`landing-mobile-menu-btn ${mobileMenuOpen ? 'is-open' : ''}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation"
                aria-expanded={mobileMenuOpen}
              >
                <span className="hamburger-line top-line" />
                <span className="hamburger-line mid-line" />
                <span className="hamburger-line bot-line" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="landing-mobile-drawer" role="navigation">
            <div className="landing-mobile-drawer-inner">
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
                    <span className="mobile-nav-title">{language === 'ta' ? 'நேரலை வரைபடம்' : 'Live Map'}</span>
                    <span className="mobile-nav-sub">{language === 'ta' ? 'பேருந்து ஜிபிஎஸ் நகர்வு' : 'Real-time bus tracking'}</span>
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
                    <span className="mobile-nav-title">{language === 'ta' ? 'முகப்பு பலகை' : 'Dashboard'}</span>
                    <span className="mobile-nav-sub">{language === 'ta' ? 'பயண தேடல் & நேரம்' : 'Quick search & schedules'}</span>
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
                    <span className="mobile-nav-title">{language === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}</span>
                    <span className="mobile-nav-sub">{language === 'ta' ? '38 மாவட்டங்கள்' : 'All districts'}</span>
                  </div>
                </Link>

                <Link
                  to="/operations"
                  className="landing-mobile-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="mobile-nav-icon-box">
                    <Building2 size={18} />
                  </div>
                  <div className="mobile-nav-text">
                    <span className="mobile-nav-title">{language === 'ta' ? 'செயல்பாடுகள் & பணிமனை' : 'Operations & Depots'}</span>
                    <span className="mobile-nav-sub">{language === 'ta' ? 'பணிமனை, ரிசர்வ், பட்டறைகள்' : 'Depots, Reserve & Workshops'}</span>
                  </div>
                </Link>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Router Outlet */}
      <main className="main-content">
        <div className="app-container">
          <div key={location.pathname} className="nested-page-enter">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--space-6) 0',
          marginTop: 'auto'
        }}
      >
        <div
          className="app-container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)'
          }}
        >
          <div>
            <strong>PERUNDHU (பேருந்து)</strong> — {t('app.tagline')}
            <br />
            {t('pilot.corridor')}
          </div>
          <div>
            Government of Tamil Nadu • State Transport Corporation (TNSTC)
          </div>
        </div>
      </footer>
    </div>
  );
};
