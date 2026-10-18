import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ArrowLeft, Terminal, Shield, LogOut, LogIn, MapPin } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../auth';
import { Badge } from '../../components/common/Badge';

/**
 * OnboardingPage Component (Step 2 & 3 Onboarding Destination)
 *
 * Welcomes authenticated passengers to PERUNDHU, displays their authenticated session
 * and user role, and establishes the clear handoff point for Step 4 (District Selection).
 *
 * Fully supports bilingual display and backward-compatibility with Step 2 test suites.
 */
export const OnboardingPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${t('onboarding.title')} — PERUNDHU`;
  }, [t]);

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-icon-box" aria-hidden="true">
          <UserCheck size={32} />
        </div>

        {/* Step 3 Scope Badge (Preserved for compatibility) */}
        <Badge variant={isAuthenticated ? 'success' : 'info'}>
          {isAuthenticated ? (language === 'ta' ? 'அங்கீகரிக்கப்பட்ட பயணி' : 'Authenticated Passenger') : t('onboarding.badge')}
        </Badge>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-deep-teal)', margin: 0 }}>
          {isAuthenticated
            ? (language === 'ta' ? `வணக்கம், ${user?.fullName || 'பயணி'}!` : `Welcome, ${user?.fullName || 'Passenger'}!`)
            : t('onboarding.title')}
        </h1>

        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', margin: 0 }}>
          {isAuthenticated
            ? (language === 'ta'
                ? 'உங்கள் பயணியர் கணக்கு வெற்றிகரமாக உள்நுழைக்கப்பட்டுள்ளது. நேரலை பேருந்து கண்காணிப்புக்குத் தயாராகுங்கள்.'
                : 'Your passenger account is active and verified. Prepare for real-time bus tracking and route navigation.')
            : t('onboarding.subtitle')}
        </p>

        {/* Authenticated User Profile Summary Card */}
        {isAuthenticated && user && (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              textAlign: 'left',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {t('auth.logged_in_as')}
              </span>
              <Badge variant="neutral">
                {user.role === 'ADMIN' ? t('auth.admin_badge') : t('auth.passenger_badge')}
              </Badge>
            </div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-deep-teal)' }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {user.email}
            </div>
            {user.phone && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {user.phone}
              </div>
            )}
          </div>
        )}

        {/* Step 4 Preview / Upcoming Scope Box */}
        <div
          style={{
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            textAlign: 'left',
            width: '100%',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-deep-teal)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <MapPin size={16} color="var(--color-primary-teal)" />
            <span>{t('auth.step4_preview_title')}</span>
          </div>
          <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {t('auth.step4_preview_desc')}
          </p>

          <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-deep-teal)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Shield size={16} color="var(--color-primary-teal)" />
            <span>{language === 'ta' ? 'பாதுகாப்பு & அங்கீகார நிலை' : 'Security & Session Lifecycle'}</span>
          </div>
          <ul style={{ paddingLeft: 'var(--space-5)', margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <li>
              <strong>PASSENGER Role:</strong> {language === 'ta' ? 'பாதுகாப்பான கடவுச்சொல் மற்றும் அமர்வு மேலாண்மை நிறுவப்பட்டது' : 'Secure passenger registration and authenticated session management operational'}
            </li>
            <li>
              <strong>Token Security:</strong> {language === 'ta' ? 'Argon2id மற்றும் HttpOnly JWT சுழற்சி பாதுகாப்பு' : 'Hardened Argon2id hashing and HttpOnly JWT refresh token rotation'}
            </li>
          </ul>
        </div>

        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {t('onboarding.desc')}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-2)', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ minHeight: '44px', padding: 'var(--space-2) var(--space-5)' }}
          >
            <ArrowLeft size={16} />
            <span>{t('onboarding.back_home')}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/districts')}
            style={{ minHeight: '44px', padding: 'var(--space-2) var(--space-5)' }}
          >
            <MapPin size={16} />
            <span>{t('districts.title')}</span>
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleSignOut}
              style={{ minHeight: '44px', padding: 'var(--space-2) var(--space-5)', color: 'var(--color-coral-red)' }}
            >
              <LogOut size={16} />
              <span>{t('auth.sign_out')}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/login')}
              style={{ minHeight: '44px', padding: 'var(--space-2) var(--space-5)' }}
            >
              <LogIn size={16} />
              <span>{t('auth.sign_in_button')}</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/dev')}
            style={{ minHeight: '44px', padding: 'var(--space-2) var(--space-5)' }}
          >
            <Terminal size={16} />
            <span>{t('onboarding.view_dev')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
