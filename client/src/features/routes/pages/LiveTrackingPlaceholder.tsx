/**
 * PERUNDHU (பேருந்து) — Step 6 Live Tracking Telemetry Destination Placeholder
 * Clean boundary: Displays selected route & direction state and clearly frames Step 6 scope
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Radio, ArrowLeft, Terminal, Activity, CheckCircle2, Navigation, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';

export const LiveTrackingPlaceholder: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const directionId = searchParams.get('directionId') || '';
  const routeNumber = searchParams.get('routeNumber') || 'Pilot';

  useEffect(() => {
    document.title = `${t('routes.step6_placeholder_title')} — PERUNDHU`;
  }, [t]);

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-icon-box" aria-hidden="true">
          <Activity size={32} />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Badge variant="success">
            <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
            <span>
              {language === 'ta' ? `தடம் ${routeNumber} தேர்ந்தெடுக்கப்பட்டது` : `Route ${routeNumber} Selected`}
            </span>
          </Badge>
          <Badge variant="info">
            <Radio size={12} style={{ marginRight: '4px' }} />
            <span>{language === 'ta' ? 'நேரலை வரைபடம் (படி 7)' : 'Live Map (Step 7)'}</span>
          </Badge>
        </div>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-deep-teal)', margin: 0 }}>
          {t('routes.step6_placeholder_title')}
        </h1>

        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', margin: 0 }}>
          {t('routes.step6_placeholder_desc').replace('{routeNumber}', routeNumber)}
        </p>

        {/* Selected Route Telemetry Context Box */}
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
            <Navigation size={16} color="var(--color-primary-teal)" />
            <span>
              {language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட விவரங்கள்' : 'Active Telemetry Context'}
            </span>
          </div>

          <ul style={{ paddingLeft: 'var(--space-5)', margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <li>
              <strong>{language === 'ta' ? 'தட எண்:' : 'Route Number:'}</strong> {routeNumber}
            </li>
            {routeId && (
              <li>
                <strong>{language === 'ta' ? 'தட குறியீடு (Backend ID):' : 'Backend Route ID:'}</strong>{' '}
                <code>{routeId}</code>
              </li>
            )}
            {directionId && (
              <li>
                <strong>{language === 'ta' ? 'திசை குறியீடு (Direction ID):' : 'Direction ID:'}</strong>{' '}
                <code>{directionId}</code>
              </li>
            )}
            <li>
              <strong>{language === 'ta' ? 'முன்னோடி தளம்:' : 'Pilot Hub:'}</strong> {t('pilot.corridor')}
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-2)', justifyContent: 'center' }}>
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate(`/dashboard?routeId=${routeId || ''}&directionId=${directionId}&routeNumber=${routeNumber}`)}
            icon={<LayoutDashboard size={16} />}
          >
            <span>{language === 'ta' ? 'முகப்பு பலகைக்குச் செல்க' : 'Go to Home Dashboard'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/districts/mdu/routes')}
            icon={<ArrowLeft size={16} />}
          >
            <span>{t('routes.back_to_routes')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/districts')}
          >
            <span>{t('districts.back_to_districts')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dev')}
            icon={<Terminal size={16} />}
          >
            <span>{t('onboarding.view_dev')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
