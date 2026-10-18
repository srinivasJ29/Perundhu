import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Route, Terminal, Compass, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';

export const RouteSelectionPlaceholder: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { districtId } = useParams();

  useEffect(() => {
    document.title = `${t('districts.step5_placeholder_title')} — PERUNDHU`;
  }, [t]);

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-icon-box" aria-hidden="true">
          <Route size={32} />
        </div>

        <Badge variant="success">
          <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
          <span>
            {language === 'ta' ? 'மதுரை முன்னோடி வழித்தடம்' : 'Madurai Pilot Selected'}
            {districtId ? ` (${districtId.toUpperCase()})` : ''}
          </span>
        </Badge>

        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-deep-teal)', margin: 0 }}>
          {t('districts.step5_placeholder_title')}
        </h1>

        <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)', margin: 0 }}>
          {t('districts.step5_placeholder_desc')}
        </p>

        {/* Verified corridor summary */}
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
            <Compass size={16} color="var(--color-primary-teal)" />
            <span>{language === 'ta' ? 'முன்னோடி வழித்தட விவரங்கள் (Step 5 Scope)' : 'Verified Madurai Pilot Scope (Step 5)'}</span>
          </div>
          <ul style={{ paddingLeft: 'var(--space-5)', margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <li>
              <strong>{language === 'ta' ? 'தடம் 70:' : 'Route 70:'}</strong> {t('landing.pilot_route70')}
            </li>
            <li>
              <strong>{language === 'ta' ? 'தடம் 77:' : 'Route 77:'}</strong> {t('landing.pilot_route77')}
            </li>
            <li>
              <strong>{language === 'ta' ? 'நிலையங்கள்:' : 'Key Terminals:'}</strong> {t('pilot.corridor')}
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-2)', justifyContent: 'center' }}>
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate('/districts')}
            icon={<ArrowLeft size={16} />}
          >
            <span>{t('districts.back_to_districts')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
          >
            <span>{t('nav.back_home')}</span>
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
