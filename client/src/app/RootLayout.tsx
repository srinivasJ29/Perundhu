import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Bus, Globe, Radio } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useSocket } from '../hooks/useSocket';
import { Badge } from '../components/common/Badge';

export const RootLayout: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { isConnected, isConnecting } = useSocket();

  const toggleLanguage = () => {
    setLanguage(language === 'ta' ? 'en' : 'ta');
  };

  return (
    <div className="page-wrapper">
      {/* Accessible Header */}
      <header
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)'
        }}
      >
        <div
          className="app-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px'
          }}
        >
          {/* Logo / Brand Title */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              color: 'var(--color-deep-teal)'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-teal)',
                color: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bus size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-lg)', lineHeight: 1.1 }}>
                {language === 'ta' ? 'பேருந்து' : 'PERUNDHU'}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {language === 'ta' ? 'PERUNDHU • TNSTC' : 'தமிழ்நாடு அரசுப் போக்குவரத்து'}
              </div>
            </div>
          </Link>

          {/* Status & Language Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link
              to="/dashboard"
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-primary-teal)',
                fontWeight: 'var(--font-weight-medium)',
                textDecoration: 'none',
                padding: 'var(--space-1) var(--space-2)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {language === 'ta' ? 'முகப்பு' : 'Dashboard'}
            </Link>

            <Link
              to="/districts"
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-primary-teal)',
                fontWeight: 'var(--font-weight-medium)',
                textDecoration: 'none',
                padding: 'var(--space-1) var(--space-2)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {language === 'ta' ? 'மாவட்டங்கள்' : 'Districts'}
            </Link>

            {/* Madurai Pilot Badge */}
            <Badge variant="info" style={{ display: 'none' }} className="d-sm-flex">
              {t('pilot.badge')}
            </Badge>

            {/* Socket Status Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: 'var(--font-size-xs)',
                color: isConnected
                  ? 'var(--color-status-success)'
                  : isConnecting
                  ? 'var(--color-status-warning)'
                  : 'var(--color-text-muted)'
              }}
              title={
                isConnected
                  ? t('socket.connected')
                  : isConnecting
                  ? t('socket.connecting')
                  : t('socket.disconnected')
              }
            >
              <Radio size={14} />
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {isConnected ? 'LIVE' : isConnecting ? 'CONNECTING' : 'IDLE'}
              </span>
            </div>

            {/* One-Action Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="btn btn-outline"
              style={{
                minHeight: '36px',
                padding: 'var(--space-1) var(--space-3)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)'
              }}
              aria-label={`Switch to ${language === 'ta' ? 'English' : 'தமிழ்'}`}
            >
              <Globe size={14} />
              <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router Outlet */}
      <main className="main-content">
        <div className="app-container">
          <Outlet />
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
