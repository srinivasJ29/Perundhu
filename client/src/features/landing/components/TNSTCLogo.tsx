import React, { useState } from 'react';
import { Bus } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';

interface TNSTCLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * TNSTCLogo Component
 *
 * Attempts to load the official Tamil Nadu State Transport Corporation logo from
 * `/assets/branding/tnstc-logo.png` (or `.svg`).
 *
 * If the asset is awaiting upload or fails to load, gracefully displays an accessible
 * branded insignia badge strictly using the approved TNSTC color palette.
 */
export const TNSTCLogo: React.FC<TNSTCLogoProps> = ({ size = 'md' }) => {
  const [hasError, setHasError] = useState(false);
  const { t } = useLanguage();

  const dimensions = {
    sm: { height: 36, iconSize: 18, fontSize: '0.75rem' },
    md: { height: 48, iconSize: 22, fontSize: '0.875rem' },
    lg: { height: 60, iconSize: 28, fontSize: '1rem' }
  }[size];

  if (hasError) {
    return (
      <div
        className="landing-logo-fallback"
        style={{
          width: `${dimensions.height}px`,
          height: `${dimensions.height}px`,
          backgroundColor: 'var(--color-primary-teal)',
          color: '#000000',
          border: '1px solid #FFE600',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
          flexShrink: 0
        }}
        role="img"
        aria-label={t('landing.logo_alt')}
        title={t('landing.logo_alt')}
      >
        <Bus size={dimensions.iconSize} />
        <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.04em', marginTop: '1px' }}>
          TNSTC
        </span>
      </div>
    );
  }

  return (
    <div className="landing-logo-container">
      <img
        src="/assets/branding/tnstc-logo.png"
        alt={t('landing.logo_alt')}
        aria-label={t('landing.logo_alt')}
        className="landing-logo-img"
        style={{
          height: `${dimensions.height}px`,
          width: 'auto',
          maxHeight: `${dimensions.height}px`,
          objectFit: 'contain'
        }}
        onError={() => setHasError(true)}
      />
    </div>
  );
};
