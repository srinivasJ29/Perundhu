import React, { useState } from 'react';
import { Bus, MapPin, Radio, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

/**
 * BusHeroImage Component
 *
 * Displays the primary bus photography visual anchor of the landing page.
 * References the local asset at `/assets/branding/bus-hero.png`.
 *
 * If the asset is awaiting local placement by the user or fails to load,
 * it renders a rich, dignified visual composition with:
 * - Madurai Pilot Corridor schematic (Routes 70 & 77)
 * - Pilot telemetry badges
 * - High-contrast transit line and bus icon
 * - Strict adherence to the approved color palette without external stock photo dependencies.
 */
export const BusHeroImage: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  const { t, language } = useLanguage();

  return (
    <div className="hero-visual-card" data-testid="bus-hero-card">
      <div className="hero-bus-image-wrapper">
        {!hasError ? (
          <>
            <picture>
              <source type="image/webp" srcSet="/assets/buses/tnstc-hero-madurai.webp" />
              <img
                src="/assets/branding/bus-hero.png"
                alt={t('landing.bus_image_alt')}
                className="hero-bus-img"
                onError={() => setHasError(true)}
                loading="eager"
              />
            </picture>

            {/* Authentic Tamil Nadu bus photo caption & attribution pill */}
            <div className="hero-photo-attribution-badge">
              <span className="badge-bullet" />
              <span className="badge-text">
                {language === 'ta'
                  ? 'அரசு விரைவுப் பேருந்து • அசோக் லேலண்ட் (CC BY-SA 4.0, விஸ்வா சுந்தர்)'
                  : 'TNSTC Mofussil Express • Ashok Leyland Viking (CC BY-SA 4.0, Vishwa Sundar)'}
              </span>
            </div>
          </>
        ) : (
          <div
            className="hero-bus-fallback"
            role="region"
            aria-label={t('landing.bus_image_fallback_title')}
          >
            {/* Header badges inside card */}
            <div className="hero-fallback-header">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-status-success)'
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-deep-teal)' }}>
                  {language === 'ta' ? 'மதுரை நேரலை முன்னோட்டம்' : 'Madurai Live Pilot'}
                </span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-primary-teal)',
                  backgroundColor: 'var(--color-surface)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <Radio size={12} />
                <span>TNSTC Live</span>
              </div>
            </div>

            {/* Central Bus Silhouette Icon & Designation */}
            <div className="hero-fallback-body">
              <div className="hero-fallback-icon">
                <Bus size={32} />
              </div>
              <div className="hero-fallback-title">
                {t('landing.bus_image_fallback_title')}
              </div>
              <div className="hero-fallback-caption">
                {t('landing.bus_image_fallback_caption')}
              </div>
            </div>

            {/* Pilot Corridor Route Schematic */}
            <div className="hero-fallback-schematic">
              <div className="schematic-node">
                <MapPin size={14} color="var(--color-primary-teal)" />
                <span>{language === 'ta' ? 'மாட்டுத்தாவணி' : 'Mattuthavani'}</span>
              </div>
              <div className="schematic-line" />
              <div className="schematic-node">
                <Bus size={14} color="var(--color-primary-teal)" />
                <span>{language === 'ta' ? 'பெரியார்' : 'Periyar'}</span>
              </div>
              <div className="schematic-line" />
              <div className="schematic-node">
                <MapPin size={14} color="var(--color-coral-red)" />
                <span>{language === 'ta' ? 'ஆரப்பாளையம்' : 'Arappalayam'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verified Data Banner at card base */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color="var(--color-primary-teal)" />
          <strong>{language === 'ta' ? 'அங்கீகரிக்கப்பட்ட வழித்தடங்கள்' : 'Surveyed Routes'}</strong>
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>
          {language === 'ta' ? 'தடங்கள் 70 & 77' : 'Routes 70 & 77'}
        </span>
      </div>
    </div>
  );
};
