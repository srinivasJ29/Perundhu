import React from 'react';
import { MapPin, Navigation, Info, Bus } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { Badge } from '../../../components/common/Badge';

/**
 * PilotInformation Component
 *
 * Restrained, truthful presentation of the Madurai Pilot Corridor.
 * Details the three surveyed hubs and active pilot routes without claiming
 * premature statewide live tracking.
 */
export const PilotInformation: React.FC = () => {
  const { t, language } = useLanguage();

  const hubs = [
    {
      id: 'periyar',
      name: t('landing.pilot_hub1'),
      desc: language === 'ta' ? 'மத்திய சந்திப்பு மற்றும் நகர இணைப்பு' : 'Central Junction & City Hub'
    },
    {
      id: 'mattuthavani',
      name: t('landing.pilot_hub2'),
      desc: language === 'ta' ? 'ஒருங்கிணைந்த பேருந்து முனையம்' : 'Integrated Bus Terminus (MIBT)'
    },
    {
      id: 'arappalayam',
      name: t('landing.pilot_hub3'),
      desc: language === 'ta' ? 'மேற்கு மற்றும் புறநகர் பேருந்து நிலையம்' : 'Western & Outbound Terminal'
    }
  ];

  return (
    <section id="pilot" className="landing-pilot" aria-labelledby="pilot-heading">
      <div className="app-container">
        <div className="pilot-card">
          {/* Header Row */}
          <div className="pilot-header">
            <div className="pilot-meta">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <Badge variant="info">
                  <Navigation size={12} style={{ marginRight: '4px' }} />
                  {t('pilot.badge')}
                </Badge>
                <Badge variant="neutral">
                  {language === 'ta' ? 'கட்டம் 11 முன்னோட்டம்' : 'Phase 11 Pilot'}
                </Badge>
              </div>
              <h2 id="pilot-heading" className="pilot-title">
                {t('landing.pilot_title')}
              </h2>
              <p className="pilot-subtitle">
                {t('landing.pilot_subtitle')}
              </p>
            </div>
          </div>

          {/* Three Major Pilot Hubs */}
          <div className="pilot-hubs-grid">
            {hubs.map((hub) => (
              <div key={hub.id} className="pilot-hub-item">
                <MapPin size={20} className="pilot-hub-icon" />
                <div>
                  <div className="pilot-hub-name">{hub.name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {hub.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Surveyed Routes In Pilot */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-2)'
              }}
            >
              {language === 'ta' ? 'செயல்பாட்டில் உள்ள முன்னோடித் தடங்கள்' : 'Active Pilot Routes'}
            </div>
            <div className="pilot-routes-row">
              <div className="pilot-route-tag">
                <Bus size={16} color="var(--color-primary-teal)" />
                <span>{t('landing.pilot_route70')}</span>
              </div>
              <div className="pilot-route-tag">
                <Bus size={16} color="var(--color-primary-teal)" />
                <span>{t('landing.pilot_route77')}</span>
              </div>
            </div>
          </div>

          {/* Truthful Availability Disclaimer */}
          <div className="pilot-disclaimer-box" role="note">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <Info size={16} color="var(--color-primary-teal)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>{t('landing.pilot_disclaimer')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
